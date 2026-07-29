-- ============================================================
-- partners + pricing_config migration
-- Safe to re-run on any state (fresh or partial previous run)
-- Run this entire script in one go in the Supabase SQL editor.
-- ============================================================


-- ─── set_updated_at helper ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ─── partners table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text,
  office_name     text,
  country         text,
  city            text,
  address         text,
  contact_person  text,
  notes           text,
  temp_password   text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── add partner_id to profiles (each column in its own statement) ────────────
-- Using DO blocks so each addition is independent: one failing won't block the rest.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'partner_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
  END IF;
END
$$;


-- ─── RLS on partners (profiles.partner_id now exists) ─────────────────────────
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin full access"  ON public.partners;
CREATE POLICY "super_admin full access" ON public.partners
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "admin_partner read own" ON public.partners;
CREATE POLICY "admin_partner read own" ON public.partners
  FOR SELECT
  USING (
    id = (
      SELECT partner_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );


-- ─── pricing_config table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  base_rates           jsonb NOT NULL DEFAULT '{"standard":15,"express":25,"overnight":45,"economic":10,"priority":35}'::jsonb,
  currency_rates       jsonb NOT NULL DEFAULT '{"USD":1.0,"EUR":0.85,"GBP":0.75,"AED":3.67,"PKR":285.0}'::jsonb,
  weight_multipliers   jsonb NOT NULL DEFAULT '{"light":1.0,"medium":1.2,"heavy":1.5,"extra_heavy":2.0}'::jsonb,
  distance_multipliers jsonb NOT NULL DEFAULT '{"domestic":1.0,"regional":1.3,"international":1.8}'::jsonb,
  service_fees         jsonb NOT NULL DEFAULT '{"insurance":5.0,"tracking":2.0,"signature":3.0,"express_handling":10.0}'::jsonb,
  tax_rate             numeric(5,4) NOT NULL DEFAULT 0.10,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_config_partner_unique UNIQUE (partner_id)
);

DROP TRIGGER IF EXISTS pricing_config_updated_at ON public.pricing_config;
CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── RLS on pricing_config ────────────────────────────────────────────────────
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin full access"        ON public.pricing_config;
CREATE POLICY "super_admin full access" ON public.pricing_config
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "admin_partner read own rates"   ON public.pricing_config;
CREATE POLICY "admin_partner read own rates" ON public.pricing_config
  FOR SELECT
  USING (
    partner_id = (
      SELECT partner_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_partner update own rates" ON public.pricing_config;
CREATE POLICY "admin_partner update own rates" ON public.pricing_config
  FOR UPDATE
  USING (
    partner_id = (
      SELECT partner_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );


-- ─── seed global default rate row ────────────────────────────────────────────
INSERT INTO public.pricing_config (partner_id)
VALUES (NULL)
ON CONFLICT (partner_id) DO NOTHING;
