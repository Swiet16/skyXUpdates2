// @ts-nocheck
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Send, User, Phone, Mail, MapPin, Package,
  Weight, Ruler, DollarSign, Globe, FileText, Sparkles,
  ArrowRight, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRequestFormProps { onSuccess: () => void; }

const COUNTRIES = [
  { code: "PK", name: "Pakistan" }, { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" }, { code: "AE", name: "UAE" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" }, { code: "FR", name: "France" },
  { code: "SA", name: "Saudi Arabia" }, { code: "IN", name: "India" },
  { code: "CN", name: "China" }, { code: "JP", name: "Japan" },
];

const SERVICE_OPTS = [
  { value: "standard", label: "Standard", icon: "🚚", desc: "3-5 business days", color: "#3B82F6" },
  { value: "express", label: "Express", icon: "⚡", desc: "1-2 business days", color: "#8B5CF6" },
  { value: "priority", label: "Priority", icon: "🏆", desc: "Same / next day", color: "#EAB308" },
];

const PARCEL_OPTS = [
  { value: "box", label: "Box", icon: "📦" },
  { value: "envelope", label: "Envelope", icon: "✉️" },
  { value: "pallet", label: "Pallet", icon: "🏗️" },
  { value: "other", label: "Other", icon: "📫" },
];

const DOC_OPTS = [
  { value: "document", label: "Document", icon: "📄", desc: "Letters, certificates, papers", color: "#3B82F6" },
  { value: "non-document", label: "Non-Document", icon: "📦", desc: "Goods, merchandise, gifts", color: "#F97316" },
];

const STEPS = [
  { id: 0, label: "Sender", icon: User, color: "#8B5CF6" },
  { id: 1, label: "Receiver", icon: MapPin, color: "#3B82F6" },
  { id: 2, label: "Parcel", icon: Package, color: "#F97316" },
  { id: 3, label: "Route", icon: Globe, color: "#22C55E" },
];

// ── primitives ────────────────────────────────────────────────────────────────
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-white/45 flex items-center gap-1">
      {label}{required && <span className="text-[#F97316]">*</span>}
    </label>
    {children}
  </div>
);

const FInput = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />}
    <Input
      {...props}
      className={`h-10 bg-white/[0.05] border-white/[0.09] text-white placeholder:text-white/20
        focus-visible:border-white/25 focus-visible:ring-1 focus-visible:ring-white/10
        transition-all ${Icon ? "pl-9" : ""} ${props.className || ""}`}
    />
  </div>
);

const FTextarea = (props: any) => (
  <textarea
    {...props}
    rows={2}
    className="w-full rounded-md border border-white/[0.09] bg-white/[0.05] px-3 py-2.5
      text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25
      focus:ring-1 focus:ring-white/10 resize-none transition-all"
  />
);

const FSelect = ({ value, onChange, placeholder, children }: any) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-10 bg-white/[0.05] border-white/[0.09] text-white focus:ring-1 focus:ring-white/10">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="bg-[#0f1225] border-white/10 text-white">
      {children}
    </SelectContent>
  </Select>
);

// ── step bar ─────────────────────────────────────────────────────────────────
const StepBar = ({ step }: { step: number }) => (
  <div className="relative flex items-center justify-between px-2">
    <div className="absolute inset-x-4 top-5 h-px bg-white/8" />
    <motion.div
      className="absolute left-4 top-5 h-px bg-gradient-to-r from-[#8B5CF6] to-[#22C55E]"
      animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ maxWidth: "calc(100% - 2rem)" }}
    />
    {STEPS.map((s, i) => {
      const done = i < step;
      const active = i === step;
      const StepIcon = s.icon;
      return (
        <div key={s.id} className="relative z-10 flex flex-col items-center gap-1.5">
          <motion.div
            animate={{ scale: active ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="h-10 w-10 rounded-xl flex items-center justify-center border-2 transition-colors"
            style={
              done
                ? { background: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.4)" }
                : active
                ? { background: `${s.color}18`, borderColor: `${s.color}60` }
                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }
            }
          >
            {done
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : <StepIcon className="h-4 w-4" style={{ color: active ? s.color : "rgba(255,255,255,0.25)" }} />}
          </motion.div>
          <span className="text-[10px] font-semibold" style={{ color: active ? s.color : done ? "#4ade80" : "rgba(255,255,255,0.25)" }}>
            {s.label}
          </span>
        </div>
      );
    })}
  </div>
);

// ── section card ─────────────────────────────────────────────────────────────
const Card = ({ title, icon: Icon, color, children }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.28, ease: "easeOut" }}
    className="rounded-2xl border border-white/[0.08] overflow-hidden"
    style={{ background: `linear-gradient(135deg, ${color}08, rgba(255,255,255,0.02))` }}
  >
    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/[0.06]"
      style={{ background: `${color}0d` }}>
      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <span className="text-sm font-semibold text-white/80">{title}</span>
    </div>
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
  </motion.div>
);

// ── service picker ────────────────────────────────────────────────────────────
const ServicePicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="col-span-2 grid grid-cols-3 gap-2.5">
    {SERVICE_OPTS.map((s) => {
      const active = value === s.value;
      return (
        <motion.button key={s.value} type="button" onClick={() => onChange(s.value)}
          whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative rounded-xl border p-3 text-center overflow-hidden"
          style={{
            borderColor: active ? `${s.color}55` : "rgba(255,255,255,0.07)",
            background: active ? `radial-gradient(ellipse at 50% 0%, ${s.color}20, ${s.color}08 80%)` : "rgba(255,255,255,0.03)",
            boxShadow: active ? `0 0 20px 0 ${s.color}20` : "none",
          }}>
          {active && (
            <motion.div layoutId="svc-glow"
              className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3"
              style={{ background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} />
          )}
          <div className="text-2xl mb-1.5">{s.icon}</div>
          <p className="text-xs font-bold" style={{ color: active ? s.color : "rgba(255,255,255,0.7)" }}>{s.label}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{s.desc}</p>
        </motion.button>
      );
    })}
  </div>
);

// ── parcel type picker ────────────────────────────────────────────────────────
const ParcelPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="col-span-2 grid grid-cols-4 gap-2">
    {PARCEL_OPTS.map((t) => {
      const active = value === t.value;
      return (
        <motion.button key={t.value} type="button" onClick={() => onChange(t.value)}
          whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="rounded-xl border py-3.5 text-center overflow-hidden"
          style={{
            borderColor: active ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.07)",
            background: active ? "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.16), rgba(249,115,22,0.05) 80%)" : "rgba(255,255,255,0.03)",
            boxShadow: active ? "0 0 18px 0 rgba(249,115,22,0.15)" : "none",
          }}>
          <motion.div animate={{ scale: active ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="text-xl mb-1">{t.icon}</motion.div>
          <div className="text-[10px] font-semibold" style={{ color: active ? "#F97316" : "rgba(255,255,255,0.4)" }}>
            {t.label}
          </div>
        </motion.button>
      );
    })}
  </div>
);

// ── doc type picker ───────────────────────────────────────────────────────────
const DocPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="col-span-2 grid grid-cols-2 gap-3">
    {DOC_OPTS.map((o) => {
      const active = value === o.value;
      return (
        <motion.button key={o.value} type="button" onClick={() => onChange(o.value)}
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="relative rounded-2xl border p-4 text-center overflow-hidden"
          style={{
            borderColor: active ? `${o.color}55` : "rgba(255,255,255,0.08)",
            background: active ? `radial-gradient(ellipse at 50% 0%, ${o.color}20, ${o.color}08 70%)` : "rgba(255,255,255,0.03)",
            boxShadow: active ? `0 0 24px 0 ${o.color}18` : "none",
          }}>
          {active && (
            <motion.div layoutId="doc-glow"
              className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3"
              style={{ background: `linear-gradient(90deg,transparent,${o.color},transparent)` }} />
          )}
          <motion.div animate={{ scale: active ? 1.18 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="text-3xl mb-2">{o.icon}</motion.div>
          <p className="text-sm font-bold" style={{ color: active ? o.color : "rgba(255,255,255,0.65)" }}>{o.label}</p>
          <p className="text-[10px] text-white/30 mt-1 leading-snug">{o.desc}</p>
        </motion.button>
      );
    })}
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
export const UserRequestForm = ({ onSuccess }: UserRequestFormProps) => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    sender_name: "", sender_phone: "", sender_email: "", sender_address: "",
    receiver_name: "", receiver_phone: "", receiver_address: "",
    parcel_type: "box", doc_type: "non-document",
    weight: "", length: "", width: "", height: "", declared_value: "",
    service_type: "standard", from_country: "", to_country: "",
    special_instructions: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to submit a request");

      const { data: trackingData, error: trackingError } = await supabase.rpc("generate_numeric_tracking");
      if (trackingError) throw trackingError;

      const w = parseFloat(form.weight) || 0;
      const l = parseFloat(form.length) || 0;
      const wi = parseFloat(form.width) || 0;
      const h = parseFloat(form.height) || 0;
      const volWeight = (l * wi * h) / 5000;
      const chargeable = Math.max(w, volWeight);
      const totalPrice = chargeable * 20;

      const { error } = await supabase.from("parcels").insert([{
        tracking_id: trackingData,
        sender_name: form.sender_name, sender_phone: form.sender_phone,
        sender_email: form.sender_email, sender_address: form.sender_address,
        receiver_name: form.receiver_name, receiver_phone: form.receiver_phone,
        receiver_address: form.receiver_address,
        parcel_type: form.parcel_type, document_type: form.doc_type,
        weight: w, length: l, width: wi, height: h,
        declared_value: parseFloat(form.declared_value) || 0,
        service_type: form.service_type,
        from_country: form.from_country, to_country: form.to_country,
        special_instructions: form.special_instructions,
        total_price: totalPrice, payment_amount: totalPrice,
        currency: "USD", current_status: "created",
        request_status: "pending", created_by: user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Request Submitted! 🎉",
        description: `Tracking ID: ${trackingData}`,
      });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    // ── Step 0: Sender ────────────────────────────────────────────────────────
    <Card key="sender" title="Sender Information" icon={User} color="#8B5CF6">
      <Field label="Full Name" required>
        <FInput icon={User} placeholder="John Smith" value={form.sender_name}
          onChange={(e: any) => set("sender_name", e.target.value)} required />
      </Field>
      <Field label="Phone" required>
        <FInput icon={Phone} type="tel" placeholder="+92 300 0000000" value={form.sender_phone}
          onChange={(e: any) => set("sender_phone", e.target.value)} required />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Email" required>
          <FInput icon={Mail} type="email" placeholder="john@email.com" value={form.sender_email}
            onChange={(e: any) => set("sender_email", e.target.value)} required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Address" required>
          <FTextarea placeholder="Full street address…" value={form.sender_address}
            onChange={(e: any) => set("sender_address", e.target.value)} required />
        </Field>
      </div>
    </Card>,

    // ── Step 1: Receiver ──────────────────────────────────────────────────────
    <Card key="receiver" title="Receiver Information" icon={MapPin} color="#3B82F6">
      <Field label="Full Name" required>
        <FInput icon={User} placeholder="Jane Doe" value={form.receiver_name}
          onChange={(e: any) => set("receiver_name", e.target.value)} required />
      </Field>
      <Field label="Phone" required>
        <FInput icon={Phone} type="tel" placeholder="+44 7700 900000" value={form.receiver_phone}
          onChange={(e: any) => set("receiver_phone", e.target.value)} required />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Address" required>
          <FTextarea placeholder="Full street address…" value={form.receiver_address}
            onChange={(e: any) => set("receiver_address", e.target.value)} required />
        </Field>
      </div>
    </Card>,

    // ── Step 2: Parcel ────────────────────────────────────────────────────────
    <Card key="parcel" title="Parcel Details" icon={Package} color="#F97316">
      <div className="sm:col-span-2">
        <Field label="Shipment Type">
          <DocPicker value={form.doc_type} onChange={(v) => set("doc_type", v)} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Package Type">
          <ParcelPicker value={form.parcel_type} onChange={(v) => set("parcel_type", v)} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Service Type">
          <ServicePicker value={form.service_type} onChange={(v) => set("service_type", v)} />
        </Field>
      </div>
      <Field label="Weight (kg)" required>
        <FInput icon={Weight} type="number" step="0.01" min="0.01" placeholder="0.00"
          value={form.weight} onChange={(e: any) => set("weight", e.target.value)} required />
      </Field>
      <Field label="Declared Value ($)">
        <FInput icon={DollarSign} type="number" step="0.01" placeholder="0.00"
          value={form.declared_value} onChange={(e: any) => set("declared_value", e.target.value)} />
      </Field>
      <Field label="Length (cm)">
        <FInput icon={Ruler} type="number" step="0.1" placeholder="0" value={form.length}
          onChange={(e: any) => set("length", e.target.value)} />
      </Field>
      <Field label="Width (cm)">
        <FInput icon={Ruler} type="number" step="0.1" placeholder="0" value={form.width}
          onChange={(e: any) => set("width", e.target.value)} />
      </Field>
      <Field label="Height (cm)">
        <FInput icon={Ruler} type="number" step="0.1" placeholder="0" value={form.height}
          onChange={(e: any) => set("height", e.target.value)} />
      </Field>
      {(parseFloat(form.weight) > 0 || parseFloat(form.length) > 0) && (
        <div className="sm:col-span-2 rounded-xl border border-[#F97316]/20 bg-[#F97316]/8 p-3 grid grid-cols-3 gap-3">
          {[
            { label: "Actual", value: `${(parseFloat(form.weight) || 0).toFixed(2)} kg` },
            { label: "Volumetric", value: `${((parseFloat(form.length)||0)*(parseFloat(form.width)||0)*(parseFloat(form.height)||0)/5000).toFixed(2)} kg` },
            { label: "Chargeable", value: `${Math.max(parseFloat(form.weight)||0, (parseFloat(form.length)||0)*(parseFloat(form.width)||0)*(parseFloat(form.height)||0)/5000).toFixed(2)} kg` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-white/40">{label}</p>
              <p className="text-sm font-bold text-[#F97316]">{value}</p>
            </div>
          ))}
        </div>
      )}
    </Card>,

    // ── Step 3: Route ─────────────────────────────────────────────────────────
    <Card key="route" title="Route & Instructions" icon={Globe} color="#22C55E">
      <Field label="From Country" required>
        <FSelect value={form.from_country} onChange={(v: string) => set("from_country", v)} placeholder="Origin country">
          {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code} className="text-white">{c.name}</SelectItem>)}
        </FSelect>
      </Field>
      <Field label="To Country" required>
        <FSelect value={form.to_country} onChange={(v: string) => set("to_country", v)} placeholder="Destination country">
          {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code} className="text-white">{c.name}</SelectItem>)}
        </FSelect>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Special Instructions">
          <FTextarea placeholder="Fragile, handle with care, refrigerate…"
            value={form.special_instructions}
            onChange={(e: any) => set("special_instructions", e.target.value)} />
        </Field>
      </div>
    </Card>,
  ];

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Step bar */}
      <StepBar step={step} />

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step}>
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-2 text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-20 border-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Dot progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === step ? 20 : 6, opacity: i < step ? 0.6 : i === step ? 1 : 0.2 }}
              className="h-1.5 rounded-full"
              style={{ background: i === step ? STEPS[i].color : i < step ? "#4ade80" : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={isLoading}
            className="gap-2 bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:opacity-90 text-white border-0 shadow-lg shadow-[#22C55E]/20 min-w-36">
            {isLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : <><Send className="h-4 w-4" /> Submit Request</>}
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="gap-2 bg-white/10 hover:bg-white/15 text-white border-0">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
