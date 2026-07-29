-- =============================================================================
-- SkyXpress — Request & Approval Row Level Security
-- =============================================================================
-- Enforces:
--   • super_admin → sees ALL pending requests and ALL approved parcels,
--                   can approve/reject any parcel
--   • admin       → sees ONLY pending requests they created (created_by = auth.uid())
--                   can approve/reject ONLY their own parcels
--
-- IMPORTANT: Run skyxpress-rls-parcels.sql FIRST — it creates the
-- get_my_role() helper function this script depends on.
--
-- Run this in your Supabase SQL editor. It is IDEMPOTENT — safe to re-run.
-- =============================================================================

-- ── Drop old policies that allow all admins to see all requests ───────────────
DROP POLICY IF EXISTS "parcels_select_policy"  ON public.parcels;
DROP POLICY IF EXISTS "parcels_insert_policy"  ON public.parcels;
DROP POLICY IF EXISTS "parcels_update_policy"  ON public.parcels;
DROP POLICY IF EXISTS "parcels_delete_policy"  ON public.parcels;

-- ── SELECT ────────────────────────────────────────────────────────────────────
-- Covers: parcel list, pending requests tab, approved parcels tab.
-- super_admin → all rows.
-- admin / everyone else → only rows where created_by = their own uid.
CREATE POLICY "parcels_select_policy"
  ON public.parcels
  FOR SELECT
  USING (
    public.get_my_role() = 'super_admin'
    OR created_by = auth.uid()
  );

-- ── INSERT ────────────────────────────────────────────────────────────────────
-- Only admins and super_admins may create parcels.
-- created_by must equal the caller's own uid.
CREATE POLICY "parcels_insert_policy"
  ON public.parcels
  FOR INSERT
  WITH CHECK (
    public.get_my_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

-- ── UPDATE ────────────────────────────────────────────────────────────────────
-- Covers: approve_parcel_request / reject_parcel_request RPCs,
--         inline status edits, and field updates.
-- super_admin → can update any parcel.
-- admin       → can only update parcels they created.
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

-- ── DELETE ────────────────────────────────────────────────────────────────────
CREATE POLICY "parcels_delete_policy"
  ON public.parcels
  FOR DELETE
  USING (
    public.get_my_role() = 'super_admin'
    OR created_by = auth.uid()
  );

-- =============================================================================
-- Done.
-- Verify with:
--   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'parcels';
-- =============================================================================
