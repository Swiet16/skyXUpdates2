// @ts-nocheck
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Save, RefreshCw, Building2, Globe, Weight,
  Truck, Shield, Percent, ChevronDown, ChevronUp, Lock, Edit3,
} from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────
interface RateConfig {
  id?: string;
  partner_id?: string;
  base_rates: { standard: number; express: number; overnight: number; economic: number; priority: number };
  currency_rates: { USD: number; EUR: number; GBP: number; AED: number; PKR: number };
  weight_multipliers: { light: number; medium: number; heavy: number; extra_heavy: number };
  distance_multipliers: { domestic: number; regional: number; international: number };
  service_fees: { insurance: number; tracking: number; signature: number; express_handling: number };
  tax_rate: number;
  updated_at?: string;
}

const DEFAULT_RATES: RateConfig = {
  base_rates: { standard: 15, express: 25, overnight: 45, economic: 10, priority: 35 },
  currency_rates: { USD: 1.0, EUR: 0.85, GBP: 0.75, AED: 3.67, PKR: 285.0 },
  weight_multipliers: { light: 1.0, medium: 1.2, heavy: 1.5, extra_heavy: 2.0 },
  distance_multipliers: { domestic: 1.0, regional: 1.3, international: 1.8 },
  service_fees: { insurance: 5.0, tracking: 2.0, signature: 3.0, express_handling: 10.0 },
  tax_rate: 0.10,
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const RateSection = ({
  title, icon: Icon, color, children, readonly,
}: {
  title: string; icon: any; color: string; children: React.ReactNode; readonly?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/4 hover:bg-white/6 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <span className="text-sm font-medium text-white/80">{title}</span>
          {readonly && (
            <Badge className="text-[9px] bg-white/8 text-white/30 border-white/10 ml-1">
              <Lock className="h-2.5 w-2.5 mr-1" /> read-only
            </Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Rate field ───────────────────────────────────────────────────────────────
const RateField = ({
  label, value, onChange, prefix, suffix, step, readonly,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; step?: number; readonly?: boolean;
}) => (
  <div className="space-y-1">
    <Label className="text-white/40 text-[10px] uppercase tracking-wide">{label}</Label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-2.5 text-white/30 text-xs">{prefix}</span>}
      <Input
        type="number"
        step={step ?? 0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={readonly}
        className={`h-8 text-sm ${prefix ? "pl-6" : ""} ${suffix ? "pr-8" : ""}
          bg-white/5 border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {suffix && <span className="absolute right-2.5 text-white/30 text-xs">{suffix}</span>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface PartnerRatesProps {
  /** If provided, shows only this partner's rates and limits edit to that partner */
  partnerId?: string;
  /** "super_admin" can see all and edit any; "admin_partner" can only see/edit their own */
  role?: "super_admin" | "admin_partner";
}

export const PartnerRates = ({ partnerId, role = "super_admin" }: PartnerRatesProps) => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partnerId || "global");
  const [config, setConfig] = useState<RateConfig>({ ...DEFAULT_RATES });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [editing, setEditing] = useState(false);

  const isSuperAdmin = role === "super_admin";
  const isReadonly = !isSuperAdmin && !editing;

  // Load partners (only for super admin)
  useEffect(() => {
    if (isSuperAdmin) {
      supabase.from("partners").select("id, name, is_active").order("name")
        .then(({ data }) => setPartners(data || []));
    }
  }, [isSuperAdmin]);

  // Load rates when partner selection changes
  useEffect(() => {
    fetchRates();
  }, [selectedPartnerId]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      let query = supabase.from("pricing_config").select("*");

      if (selectedPartnerId === "global") {
        query = query.is("partner_id", null);
      } else {
        query = query.eq("partner_id", selectedPartnerId);
      }

      const { data, error } = await query.maybeSingle();

      if (data) {
        setConfig({
          id: data.id,
          partner_id: data.partner_id,
          base_rates: data.base_rates || DEFAULT_RATES.base_rates,
          currency_rates: data.currency_rates || DEFAULT_RATES.currency_rates,
          weight_multipliers: data.service_multipliers || DEFAULT_RATES.weight_multipliers,
          distance_multipliers: data.region_multipliers || DEFAULT_RATES.distance_multipliers,
          service_fees: data.service_fees || DEFAULT_RATES.service_fees,
          tax_rate: data.tax_rate || DEFAULT_RATES.tax_rate,
          updated_at: data.updated_at,
        });
        setLastUpdated(data.updated_at ? new Date(data.updated_at).toLocaleString() : "Never");
      } else {
        // No rates for this partner yet, load global as baseline
        setConfig({ ...DEFAULT_RATES });
        setLastUpdated("Using global defaults");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (section: keyof RateConfig, field: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value },
    }));
  };

  const saveRates = async () => {
    setSaving(true);
    try {
      const payload = {
        partner_id: selectedPartnerId === "global" ? null : selectedPartnerId,
        base_rates: config.base_rates,
        currency_rates: config.currency_rates,
        service_multipliers: config.weight_multipliers,
        region_multipliers: config.distance_multipliers,
        service_fees: config.service_fees,
        tax_rate: config.tax_rate,
        updated_at: new Date().toISOString(),
      };

      if (config.id) {
        const { error } = await supabase.from("pricing_config").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_config").insert(payload);
        if (error) throw error;
      }

      toast({ title: "Rates saved ✓", description: "Pricing configuration updated successfully." });
      setEditing(false);
      fetchRates();
    } catch (err: any) {
      toast({ title: "Error saving rates", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedPartnerName = selectedPartnerId === "global"
    ? "Global (all partners)"
    : partners.find((p) => p.id === selectedPartnerId)?.name || "Partner";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#C98A2B]" />
            {isSuperAdmin ? "Rate Management" : "My Rate Card"}
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isSuperAdmin
              ? "Set global rates or custom rates per partner · Only super admin can see all partners"
              : "Your negotiated rates set by admin · Request changes from admin"}
          </p>
        </div>

        {/* Super admin: partner selector */}
        {isSuperAdmin && (
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="Select partner" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1020] border-white/10">
              <SelectItem value="global" className="text-white text-sm">
                🌐 Global (default)
              </SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-white text-sm">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-[#8B5CF6]" />
                    {p.name}
                    {p.is_active === false && <span className="text-red-400 text-[10px]">(inactive)</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Edit / Save controls */}
        <div className="flex gap-2">
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Edit3 className="h-4 w-4" />
              {isSuperAdmin ? "Edit Rates" : "Request Edit"}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => { setEditing(false); fetchRates(); }}
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={saveRates}
                disabled={saving}
                className="gap-2 bg-[#C98A2B] hover:bg-[#B8791A] text-white"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Rates"}
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={fetchRates}
            className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Context bar */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5">
        <Building2 className="h-4 w-4 text-[#8B5CF6]" />
        <div className="flex-1">
          <p className="text-sm text-white/80 font-medium">{selectedPartnerName}</p>
          <p className="text-[10px] text-white/30">Last updated: {lastUpdated}</p>
        </div>
        {!isSuperAdmin && (
          <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 text-[10px]">
            <Shield className="h-2.5 w-2.5 mr-1" /> Admin-managed
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-white/8 bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Base Rates */}
          <RateSection title="Base Rates (per kg / shipment)" icon={Truck} color="#C98A2B" readonly={isReadonly}>
            {Object.entries(config.base_rates).map(([key, val]) => (
              <RateField key={key} label={key.replace(/_/g, " ")} value={val} prefix="$"
                readonly={isReadonly}
                onChange={(v) => updateSection("base_rates", key, v)} />
            ))}
          </RateSection>

          {/* Currency Rates */}
          <RateSection title="Currency Exchange Rates" icon={Globe} color="#3B82F6" readonly={isReadonly}>
            {Object.entries(config.currency_rates).map(([key, val]) => (
              <RateField key={key} label={key} value={val} step={0.001}
                readonly={isReadonly}
                onChange={(v) => updateSection("currency_rates", key, v)} />
            ))}
          </RateSection>

          {/* Weight Multipliers */}
          <RateSection title="Weight Multipliers" icon={Weight} color="#8B5CF6" readonly={isReadonly}>
            {[
              { key: "light", label: "Light (0–1 kg)" },
              { key: "medium", label: "Medium (1–5 kg)" },
              { key: "heavy", label: "Heavy (5–20 kg)" },
              { key: "extra_heavy", label: "Extra Heavy (20+ kg)" },
            ].map(({ key, label }) => (
              <RateField key={key} label={label} value={(config.weight_multipliers as any)[key]} suffix="×"
                readonly={isReadonly}
                onChange={(v) => updateSection("weight_multipliers", key, v)} />
            ))}
          </RateSection>

          {/* Distance Multipliers */}
          <RateSection title="Distance Multipliers" icon={Globe} color="#22C55E" readonly={isReadonly}>
            {Object.entries(config.distance_multipliers).map(([key, val]) => (
              <RateField key={key} label={key} value={val} suffix="×"
                readonly={isReadonly}
                onChange={(v) => updateSection("distance_multipliers", key, v)} />
            ))}
          </RateSection>

          {/* Service Fees */}
          <RateSection title="Service Fees" icon={Shield} color="#F97316" readonly={isReadonly}>
            {Object.entries(config.service_fees).map(([key, val]) => (
              <RateField key={key} label={key.replace(/_/g, " ")} value={val} prefix="$"
                readonly={isReadonly}
                onChange={(v) => updateSection("service_fees", key, v)} />
            ))}
          </RateSection>

          {/* Tax */}
          <RateSection title="Tax Rate" icon={Percent} color="#EAB308" readonly={isReadonly}>
            <RateField label="Tax %" value={config.tax_rate * 100} suffix="%"
              readonly={isReadonly}
              onChange={(v) => setConfig((prev) => ({ ...prev, tax_rate: v / 100 }))} />
          </RateSection>
        </div>
      )}
    </div>
  );
};
