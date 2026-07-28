-- ============================================================
-- SkyXpress Complete Database Schema
-- Supabase-compatible SQL
-- Roles: super_admin | admin_partner | user
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PARTNERS  (franchise offices / business partners)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  office_name   TEXT,
  address       TEXT,
  city          TEXT,
  country       TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN DEFAULT true,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. OFFICES  (individual locations per partner)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  country     TEXT,
  phone       TEXT,
  email       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. PROFILES  (extend existing table)
-- ============================================================
-- Add partner / office linkage + new role values
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_id   UUID REFERENCES public.partners(id),
  ADD COLUMN IF NOT EXISTS office_id    UUID REFERENCES public.offices(id),
  ADD COLUMN IF NOT EXISTS full_name    TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Role migration (run once — review before executing):
-- UPDATE public.profiles SET role = 'super_admin'   WHERE role = 'admin';
-- UPDATE public.profiles SET role = 'admin_partner'  WHERE role IN ('staff','developer');

-- ============================================================
-- 4. CUSTOMERS  (per-partner)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  office_id   UUID REFERENCES public.offices(id),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  country     TEXT,
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. PARCELS  (extend existing table with ownership fields)
-- ============================================================
ALTER TABLE public.parcels
  ADD COLUMN IF NOT EXISTS partner_id       UUID REFERENCES public.partners(id),
  ADD COLUMN IF NOT EXISTS office_id        UUID REFERENCES public.offices(id),
  ADD COLUMN IF NOT EXISTS partner_name     TEXT,
  ADD COLUMN IF NOT EXISTS office_name      TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name  TEXT,
  ADD COLUMN IF NOT EXISTS updated_by       UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by_name  TEXT,
  ADD COLUMN IF NOT EXISTS delivery_agent   TEXT,
  ADD COLUMN IF NOT EXISTS customer_id      UUID REFERENCES public.customers(id);

-- ============================================================
-- 6. PARCEL STATUS HISTORY  (full activity timeline per parcel)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parcel_status_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id        UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
  status           TEXT NOT NULL,
  previous_status  TEXT,
  notes            TEXT,
  location         TEXT,
  changed_by       UUID REFERENCES auth.users(id),
  changed_by_name  TEXT,
  partner_id       UUID REFERENCES public.partners(id),
  partner_name     TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. EXPENSES  (per-partner expense tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  office_id       UUID REFERENCES public.offices(id),
  category        TEXT NOT NULL,  -- fuel | staff | rent | supplies | other
  description     TEXT,
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  approved_by     UUID REFERENCES auth.users(id),
  status          TEXT DEFAULT 'pending',  -- pending | approved | rejected
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. PAYMENTS  (per-parcel payment records)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id       UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
  invoice_id      UUID REFERENCES public.invoices(id),
  partner_id      UUID REFERENCES public.partners(id),
  customer_id     UUID REFERENCES public.customers(id),
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  payment_method  TEXT,  -- cash | bank_transfer | card | online
  payment_status  TEXT DEFAULT 'pending',  -- pending | paid | overdue | refunded
  payment_date    TIMESTAMPTZ,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id  UUID REFERENCES public.partners(id),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info',  -- info | success | warning | error
  is_read     BOOLEAN DEFAULT false,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. ACTIVITY LOGS  (enhanced audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id),
  partner_id   UUID REFERENCES public.partners(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,  -- parcel | invoice | user | partner | expense
  entity_id    UUID,
  entity_label TEXT,
  description  TEXT,
  ip_address   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_parcels_partner_id          ON public.parcels(partner_id);
CREATE INDEX IF NOT EXISTS idx_parcels_created_by          ON public.parcels(created_by);
CREATE INDEX IF NOT EXISTS idx_parcels_current_status      ON public.parcels(current_status);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id         ON public.profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role               ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_status_history_parcel_id    ON public.parcel_status_history(parcel_id);
CREATE INDEX IF NOT EXISTS idx_status_history_partner_id   ON public.parcel_status_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_partner_id         ON public.expenses(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_parcel_id          ON public.payments(parcel_id);
CREATE INDEX IF NOT EXISTS idx_payments_partner_id         ON public.payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id       ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_partner_id    ON public.activity_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_customers_partner_id        ON public.customers(partner_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get the current authenticated user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the current authenticated user's partner_id
CREATE OR REPLACE FUNCTION public.get_user_partner_id()
RETURNS UUID AS $$
  SELECT partner_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partners_updated_at') THEN
    CREATE TRIGGER trg_partners_updated_at
      BEFORE UPDATE ON public.partners
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_offices_updated_at') THEN
    CREATE TRIGGER trg_offices_updated_at
      BEFORE UPDATE ON public.offices
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expenses_updated_at') THEN
    CREATE TRIGGER trg_expenses_updated_at
      BEFORE UPDATE ON public.expenses
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payments_updated_at') THEN
    CREATE TRIGGER trg_payments_updated_at
      BEFORE UPDATE ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Auto-insert parcel status history on status change
CREATE OR REPLACE FUNCTION public.log_parcel_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO public.parcel_status_history (
      parcel_id, status, previous_status,
      changed_by, partner_id, partner_name
    ) VALUES (
      NEW.id, NEW.current_status, OLD.current_status,
      auth.uid(), NEW.partner_id, NEW.partner_name
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parcel_status_history') THEN
    CREATE TRIGGER trg_parcel_status_history
      AFTER UPDATE ON public.parcels
      FOR EACH ROW EXECUTE FUNCTION public.log_parcel_status_change();
  END IF;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.partners              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs         ENABLE ROW LEVEL SECURITY;

-- ---- PARTNERS ----
CREATE POLICY "super_admin_all_partners" ON public.partners
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_read_own" ON public.partners
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND id = public.get_user_partner_id()
  );

-- ---- OFFICES ----
CREATE POLICY "super_admin_all_offices" ON public.offices
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_own_offices" ON public.offices
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  );

-- ---- CUSTOMERS ----
CREATE POLICY "super_admin_all_customers" ON public.customers
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_own_customers" ON public.customers
  FOR ALL TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  );

-- ---- PARCEL STATUS HISTORY ----
CREATE POLICY "super_admin_all_history" ON public.parcel_status_history
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_own_history" ON public.parcel_status_history
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  );

CREATE POLICY "user_own_parcel_history" ON public.parcel_status_history
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'user'
    AND parcel_id IN (
      SELECT id FROM public.parcels WHERE created_by = auth.uid()
    )
  );

-- ---- EXPENSES ----
CREATE POLICY "super_admin_all_expenses" ON public.expenses
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_own_expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  );

-- ---- PAYMENTS ----
CREATE POLICY "super_admin_all_payments" ON public.payments
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_own_payments" ON public.payments
  FOR ALL TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  );

CREATE POLICY "user_own_payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'user'
    AND parcel_id IN (
      SELECT id FROM public.parcels WHERE created_by = auth.uid()
    )
  );

-- ---- NOTIFICATIONS ----
CREATE POLICY "users_own_notifications" ON public.notifications
  FOR ALL TO authenticated
  USING   (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "super_admin_all_notifications" ON public.notifications
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

-- ---- ACTIVITY LOGS ----
CREATE POLICY "super_admin_all_logs" ON public.activity_logs
  FOR ALL TO authenticated
  USING   (public.get_user_role() IN ('super_admin','admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin','admin'));

CREATE POLICY "admin_partner_own_logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() IN ('admin_partner','staff')
    AND partner_id = public.get_user_partner_id()
  );

-- ============================================================
-- CONVENIENCE VIEW: Super Admin global stats
-- ============================================================
CREATE OR REPLACE VIEW public.v_global_stats AS
SELECT
  (SELECT COUNT(*)   FROM public.parcels)                                                         AS total_parcels,
  (SELECT COUNT(*)   FROM public.parcels WHERE current_status = 'delivered')                      AS delivered_parcels,
  (SELECT COUNT(*)   FROM public.parcels WHERE current_status NOT IN ('delivered','cancelled'))   AS pending_parcels,
  (SELECT COUNT(*)   FROM public.parcels WHERE current_status = 'cancelled')                      AS cancelled_parcels,
  (SELECT COUNT(*)   FROM public.partners WHERE is_active = true)                                 AS active_partners,
  (SELECT COUNT(*)   FROM public.profiles WHERE role = 'user' AND is_active = true)              AS active_users,
  (SELECT COALESCE(SUM(final_amount),0) FROM public.invoices WHERE payment_status = 'paid')       AS total_revenue,
  (SELECT COALESCE(SUM(amount),0)       FROM public.expenses  WHERE status = 'approved')          AS total_expenses;

-- ============================================================
-- NOTE: After running this schema in Supabase SQL editor,
-- set your environment variables:
--   VITE_SUPABASE_URL   = your project URL
--   VITE_SUPABASE_ANON_KEY = your anon/public key
--
-- Then create the first Super Admin manually:
--   UPDATE public.profiles SET role = 'super_admin' WHERE user_id = '<your-uid>';
-- ============================================================
