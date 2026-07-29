-- ─── STEP 1: partners table (must exist before profiles FK is added) ──────────
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
  temp_password   text,          -- plain-text temp password set by super admin
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── STEP 2: add partner_id to profiles (partners table now exists for the FK) ─
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;


-- ─── STEP 3: RLS policies on partners (profiles.partner_id now exists) ────────
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin full access" ON public.partners
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "admin_partner read own" ON public.partners
  FOR SELECT
  USING (
    id = (
      SELECT partner_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );


-- ─── STEP 4: pricing_config table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  -- NULL partner_id = global default rates
  base_rates           jsonb NOT NULL DEFAULT '{"standard":15,"express":25,"overnight":45,"economic":10,"priority":35}'::jsonb,
  currency_rates       jsonb NOT NULL DEFAULT '{"USD":1.0,"EUR":0.85,"GBP":0.75,"AED":3.67,"PKR":285.0}'::jsonb,
  weight_multipliers   jsonb NOT NULL DEFAULT '{"light":1.0,"medium":1.2,"heavy":1.5,"extra_heavy":2.0}'::jsonb,
  distance_multipliers jsonb NOT NULL DEFAULT '{"domestic":1.0,"regional":1.3,"international":1.8}'::jsonb,
  service_fees         jsonb NOT NULL DEFAULT '{"insurance":5.0,"tracking":2.0,"signature":3.0,"express_handling":10.0}'::jsonb,
  tax_rate             numeric(5,4) NOT NULL DEFAULT 0.10,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_config_partner_unique UNIQUE (partner_id)
);

CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── STEP 5: RLS policies on pricing_config (profiles.partner_id now exists) ──
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin full access" ON public.pricing_config
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "admin_partner read own rates" ON public.pricing_config
  FOR SELECT
  USING (
    partner_id = (
      SELECT partner_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "admin_partner update own rates" ON public.pricing_config
  FOR UPDATE
  USING (
    partner_id = (
      SELECT partner_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );


-- ─── STEP 6: seed global default rate row ─────────────────────────────────────
INSERT INTO public.pricing_config (partner_id)
VALUES (NULL)
ON CONFLICT (partner_id) DO NOTHING;
