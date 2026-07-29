-- =============================================================================
-- SkyXpress — Parcel Row Level Security
-- =============================================================================
-- Enforces:
--   • super_admin → sees and manages ALL parcels
--   • admin       → sees and manages ONLY parcels they created (created_by = auth.uid())
--   • All other roles follow the same "own parcels only" rule
--
-- Run this in your Supabase SQL editor. It is IDEMPOTENT — safe to re-run.
-- =============================================================================

-- ── Step 1: Helper function — returns the current user's role ─────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── Step 2: Enable RLS on parcels ─────────────────────────────────────────────
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Drop old catch-all policies if they exist ─────────────────────────
DROP POLICY IF EXISTS "admin_full_parcel_access"   ON public.parcels;
DROP POLICY IF EXISTS "partner_own_parcels"         ON public.parcels;
DROP POLICY IF EXISTS "parcels_select_policy"       ON public.parcels;
DROP POLICY IF EXISTS "parcels_insert_policy"       ON public.parcels;
DROP POLICY IF EXISTS "parcels_update_policy"       ON public.parcels;
DROP POLICY IF EXISTS "parcels_delete_policy"       ON public.parcels;

-- ── Step 4: SELECT ────────────────────────────────────────────────────────────
-- super_admin → all rows
-- admin / everyone else → only rows where created_by = their uid
CREATE POLICY "parcels_select_policy"
  ON public.parcels
  FOR SELECT
  USING (
    public.get_my_role() = 'super_admin'
    OR created_by = auth.uid()
  );

-- ── Step 5: INSERT ────────────────────────────────────────────────────────────
-- super_admin and admin can create parcels.
-- created_by must be set to the caller's own uid (enforced in WITH CHECK).
CREATE POLICY "parcels_insert_policy"
  ON public.parcels
  FOR INSERT
  WITH CHECK (
    public.get_my_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

-- ── Step 6: UPDATE ────────────────────────────────────────────────────────────
-- super_admin → can update any parcel
-- admin       → can only update parcels they created
CREATE POLICY "parcels_update_policy"
  ON public.parcels
  FOR UPDATE
  USING (
    public.get_my_role() = 'super_admin'
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.get_my_role() = 'super_admin'
    OR created_by = auth.uid()
  );

-- ── Step 7: DELETE ────────────────────────────────────────────────────────────
-- super_admin → can delete any parcel
-- admin       → can only delete parcels they created
CREATE POLICY "parcels_delete_policy"
  ON public.parcels
  FOR DELETE
  USING (
    public.get_my_role() = 'super_admin'
    OR created_by = auth.uid()
  );

-- =============================================================================
-- Done.
-- After running, verify with:
--   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'parcels';
-- =============================================================================
