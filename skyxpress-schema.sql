-- =============================================================================
-- SkyXpress — Role-Based Dashboard Schema Additions
-- =============================================================================
-- Run this SQL in your Supabase SQL editor (or via the Supabase CLI).
-- It is IDEMPOTENT — safe to run multiple times.
--
-- What this file does
-- ─────────────────────
-- 1. Adds `updated_by`       to parcels  — UUID of the last user to update
-- 2. Adds `updated_by_role`  to parcels  — role snapshot at update time
-- 3. Adds `can_manage_users` to profiles — super_admin can grant admin access
--    to the Users tab (already referenced in app code)
-- 4. Auto-update trigger     on parcels  — sets updated_by + updated_by_role
--    when any row is changed (requires auth.uid() to be set, i.e. RLS on)
-- 5. Helper view             creator_parcels — joins parcels with creator
--    profile so the admin dashboard can query name + role in one go
-- 6. RLS policy examples     — uncomment and adapt to your project's needs
-- =============================================================================

-- ─── 1. parcels — add updated_by columns ─────────────────────────────────────
ALTER TABLE public.parcels
  ADD COLUMN IF NOT EXISTS updated_by       uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_role  text;

COMMENT ON COLUMN public.parcels.updated_by      IS 'UUID of the last user who updated this parcel';
COMMENT ON COLUMN public.parcels.updated_by_role IS 'Role of that user at the time of update (snapshot)';

-- ─── 2. profiles — add can_manage_users ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_manage_users boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.can_manage_users IS
  'When true an admin-role user sees the Users tab in their dashboard. '
  'Only a super_admin can flip this flag (enforced in the UI and recommended '
  'in RLS — see policy below).';

-- ─── 3. Trigger — auto-populate updated_by on every parcel UPDATE ────────────
--
-- NOTE: auth.uid() returns the UUID of the authenticated Supabase user.
--       It works when Row Level Security is enabled and the client uses
--       a valid JWT (the default for browser/mobile clients).
--       If you call Supabase from a service-role key the uid() is null —
--       that is intentional so server-side batch ops don't stomp the field.
--
CREATE OR REPLACE FUNCTION public.trg_parcels_set_updated_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  -- Only run when the row is actually changing (skip no-op updates)
  IF NEW IS DISTINCT FROM OLD THEN
    -- Grab the updater's current role from profiles
    SELECT role
      INTO v_role
      FROM public.profiles
     WHERE user_id = auth.uid()
     LIMIT 1;

    NEW.updated_by      := auth.uid();
    NEW.updated_by_role := COALESCE(v_role, 'unknown');
    NEW.updated_at      := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_parcel_updated_by ON public.parcels;
CREATE TRIGGER set_parcel_updated_by
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW EXECUTE FUNCTION public.trg_parcels_set_updated_by();

-- ─── 4. Helper view — parcels with creator + updater names ───────────────────
--
-- Usage (in a Supabase JS client):
--   supabase.from('parcel_activity').select('*').order('created_at', { ascending: false })
--
CREATE OR REPLACE VIEW public.parcel_activity AS
SELECT
  p.id,
  p.tracking_id,
  p.reference_id,
  p.sender_name,
  p.receiver_name,
  p.from_country,
  p.to_country,
  p.current_status,
  p.total_price,
  p.currency,
  p.weight,
  p.created_at,
  p.updated_at,
  -- Creator
  p.created_by                             AS created_by_uid,
  cp.full_name                             AS created_by_name,
  cp.role                                  AS created_by_role,
  -- Last updater
  p.updated_by                             AS updated_by_uid,
  up.full_name                             AS updated_by_name,
  COALESCE(p.updated_by_role, up.role)     AS updated_by_role
FROM public.parcels p
LEFT JOIN public.profiles cp ON cp.user_id = p.created_by
LEFT JOIN public.profiles up ON up.user_id = p.updated_by;

COMMENT ON VIEW public.parcel_activity IS
  'Denormalised parcel list including creator and last-updater name + role. '
  'Read-only view — mutations must target the parcels table directly.';

-- ─── 5. Index — fast lookup of parcels by creator ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_parcels_created_by ON public.parcels (created_by);
CREATE INDEX IF NOT EXISTS idx_parcels_updated_by ON public.parcels (updated_by);

-- ─── 6. RLS policy snippets (uncomment & adapt) ──────────────────────────────
--
-- These assume you have a helper function get_my_role() that returns the
-- current user's role string. Adjust to match your actual setup.
--
-- CREATE OR REPLACE FUNCTION public.get_my_role()
-- RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
--   SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
-- $$;
--
-- ── super_admin: full access to can_manage_users ──────────────────────────────
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "super_admin_can_set_can_manage_users"
--   ON public.profiles
--   FOR UPDATE
--   USING  (public.get_my_role() = 'super_admin')
--   WITH CHECK (public.get_my_role() = 'super_admin');
--
-- ── admin: can manage parcels (create + update) ───────────────────────────────
-- ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "admin_full_parcel_access"
--   ON public.parcels
--   FOR ALL
--   USING  (public.get_my_role() IN ('super_admin', 'admin'))
--   WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));
--
-- ── partner: can only create & see their own parcels ─────────────────────────
-- CREATE POLICY "partner_own_parcels"
--   ON public.parcels
--   FOR ALL
--   USING  (
--     public.get_my_role() IN ('super_admin', 'admin')
--     OR created_by = auth.uid()
--   )
--   WITH CHECK (
--     public.get_my_role() IN ('super_admin', 'admin')
--     OR created_by = auth.uid()
--   );
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Done!
-- =============================================================================
