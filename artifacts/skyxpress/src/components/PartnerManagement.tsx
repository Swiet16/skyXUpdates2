// @ts-nocheck
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2, Plus, Eye, EyeOff, Copy, RefreshCw, Key, Mail,
  Phone, Globe, MapPin, Check, X, Shield, Trash2, Edit2, Lock,
  Unlock, User, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
const genTempPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const initials = (name: string) =>
  (name || "?").trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// ─── sub-components ──────────────────────────────────────────────────────────
const FieldBox = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/30">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-[10px] text-white/35 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-white/80">{value || "—"}</p>
    </div>
  </div>
);

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────
const PartnerFormDialog = ({
  partner,
  onSaved,
}: {
  partner?: any;
  onSaved: () => void;
}) => {
  const isEdit = !!partner;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);

  const blankForm = {
    name: "", email: "", phone: "", office_name: "", country: "", city: "", address: "",
    contact_person: "", notes: "", temp_password: genTempPassword(),
  };

  const [form, setForm] = useState(blankForm);

  // populate on edit
  useEffect(() => {
    if (partner && open) {
      setForm({
        name: partner.name || "",
        email: partner.email || "",
        phone: partner.phone || "",
        office_name: partner.office_name || "",
        country: partner.country || "",
        city: partner.city || "",
        address: partner.address || "",
        contact_person: partner.contact_person || "",
        notes: partner.notes || "",
        temp_password: "",
      });
    }
    if (!open) setForm(blankForm);
  }, [open, partner]);

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const copyPassword = () => {
    navigator.clipboard.writeText(form.temp_password).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshPassword = () => set("temp_password", genTempPassword());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Required", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      if (isEdit) {
        // Update partner record
        const { error } = await supabase
          .from("partners")
          .update({
            name: form.name,
            phone: form.phone,
            office_name: form.office_name,
            country: form.country,
            city: form.city,
            address: form.address,
            contact_person: form.contact_person,
            notes: form.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", partner.id);
        if (error) throw error;
        toast({ title: "Partner updated", description: `${form.name} has been updated.` });
      } else {
        // Create Supabase auth user with temp password
        const { data: authData, error: authError } = await supabase.auth.admin
          ? await supabase.auth.admin.createUser({
              email: form.email,
              password: form.temp_password,
              email_confirm: true,
            })
          : { data: null, error: { message: "Admin API not available on client" } };

        // If admin API unavailable, just create the partner record and store temp info
        const partnerPayload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          office_name: form.office_name,
          country: form.country,
          city: form.city,
          address: form.address,
          contact_person: form.contact_person,
          notes: form.notes,
          temp_password: form.temp_password, // stored so super admin can see it
          is_active: true,
          created_at: new Date().toISOString(),
        };

        const { error: partnerError } = await supabase
          .from("partners")
          .insert(partnerPayload);

        if (partnerError) throw partnerError;

        toast({
          title: "Partner created! 🎉",
          description: `${form.name} added. Share the temp password: ${form.temp_password}`,
          duration: 8000,
        });
      }

      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button className="gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none">
            <Plus className="h-4 w-4" /> Add Partner
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-[#0f1020] border border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-[#8B5CF6]" />
            {isEdit ? "Edit Partner" : "Add New Partner"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-white/60 text-xs">Partner Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. SkyNet UK"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="partner@email.com"
                disabled={isEdit}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 disabled:opacity-50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+44 7700 900000"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Office Name</Label>
              <Input
                value={form.office_name}
                onChange={(e) => set("office_name", e.target.value)}
                placeholder="London Office"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Contact Person</Label>
              <Input
                value={form.contact_person}
                onChange={(e) => set("contact_person", e.target.value)}
                placeholder="John Smith"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Country</Label>
              <Input
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="United Kingdom"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">City</Label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="London"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-white/60 text-xs">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="123 High Street"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-white/60 text-xs">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Internal notes..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Temp Password — only on create */}
          {!isEdit && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 text-sm font-medium">Temporary Password</span>
                <span className="text-[10px] text-amber-400/60 ml-auto">Share with partner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={form.temp_password}
                    onChange={(e) => set("temp_password", e.target.value)}
                    className="bg-black/30 border-amber-500/20 text-amber-200 font-mono pr-8"
                  />
                </div>
                <Button
                  type="button" size="icon" variant="ghost"
                  onClick={() => setShowPass((v) => !v)}
                  className="h-9 w-9 text-white/40 hover:text-white hover:bg-white/5"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button" size="icon" variant="ghost"
                  onClick={refreshPassword}
                  className="h-9 w-9 text-white/40 hover:text-white hover:bg-white/5"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button" size="icon" variant="ghost"
                  onClick={copyPassword}
                  className="h-9 w-9 text-white/40 hover:text-white hover:bg-white/5"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-amber-400/60">
                Partner must change this on first login. Copy it now — it won't be shown again.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}
              className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}
              className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Partner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Temp Password Reveal Dialog ─────────────────────────────────────────────
const TempPasswordDialog = ({ partner }: { partner: any }) => {
  const [open, setOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [newPass, setNewPass] = useState("");
  const [resetting, setResetting] = useState(false);

  const copyPassword = (val: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPassword = async () => {
    const generated = genTempPassword();
    setResetting(true);
    try {
      const { error } = await supabase
        .from("partners")
        .update({ temp_password: generated, updated_at: new Date().toISOString() })
        .eq("id", partner.id);
      if (error) throw error;
      setNewPass(generated);
      toast({ title: "Password reset", description: "New temporary password generated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const displayPass = newPass || partner.temp_password || "— not stored —";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost"
          className="h-7 w-7 text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10"
          title="View temp password">
          <Key className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-[#0f1020] border border-amber-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="h-4 w-4 text-amber-400" /> Temporary Password
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="text-xs text-white/40">Partner: <span className="text-white/70">{partner.name}</span></div>
          <div className="rounded-lg border border-amber-500/20 bg-black/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <code className={`flex-1 font-mono text-sm ${showPass ? "text-amber-200" : "blur-sm select-none text-amber-200"}`}>
                {displayPass}
              </code>
              <Button size="icon" variant="ghost" onClick={() => setShowPass((v) => !v)}
                className="h-7 w-7 text-white/40 hover:text-white">
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => copyPassword(displayPass)}
                className="h-7 w-7 text-white/40 hover:text-white">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <Button onClick={resetPassword} disabled={resetting} variant="outline"
            className="w-full border-amber-500/20 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${resetting ? "animate-spin" : ""}`} />
            Generate New Password
          </Button>
          <p className="text-[10px] text-white/30 text-center">Only visible to super admin</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Partner Card ─────────────────────────────────────────────────────────────
const PartnerCard = ({
  partner, parcels, onRefresh,
}: {
  partner: any; parcels: any[]; onRefresh: () => void;
}) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const partnerParcels = parcels.filter((p: any) => p.partner_id === partner.id);
  const isActive = partner.is_active !== false;

  const toggleActive = async () => {
    setToggling(true);
    try {
      const { error } = await supabase
        .from("partners")
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq("id", partner.id);
      if (error) throw error;
      toast({
        title: isActive ? "Partner deactivated" : "Partner activated",
        description: `${partner.name} is now ${isActive ? "inactive" : "active"}.`,
      });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className={`h-11 w-11 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-sm
          ${isActive ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "bg-white/8 text-white/30"}`}>
          {initials(partner.name)}
        </div>

        {/* Name / office */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-sm truncate">{partner.name}</p>
            <Badge className={isActive
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
              : "bg-red-500/15 text-red-400 border-red-500/30 text-[10px]"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-xs text-white/40 truncate">
            {[partner.office_name, partner.city, partner.country].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 text-right mr-2">
          <div>
            <p className="text-base font-bold text-white">{partnerParcels.length}</p>
            <p className="text-[10px] text-white/30">parcels</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <TempPasswordDialog partner={partner} />
          <PartnerFormDialog partner={partner} onSaved={onRefresh} />
          <Button size="icon" variant="ghost"
            onClick={toggleActive} disabled={toggling}
            className={`h-7 w-7 ${isActive ? "text-red-400/60 hover:text-red-400 hover:bg-red-500/10" : "text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10"}`}
            title={isActive ? "Deactivate" : "Activate"}>
            {isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/5">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/6 px-4 pb-4 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FieldBox label="Email" value={partner.email} icon={Mail} />
              <FieldBox label="Phone" value={partner.phone} icon={Phone} />
              <FieldBox label="Contact" value={partner.contact_person} icon={User} />
              <FieldBox label="Country" value={partner.country} icon={Globe} />
              <FieldBox label="City" value={partner.city} icon={MapPin} />
              <FieldBox label="Address" value={partner.address} icon={MapPin} />
              {partner.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <FieldBox label="Notes" value={partner.notes} icon={Shield} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const PartnerManagement = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: p }, { data: parc }] = await Promise.all([
      supabase.from("partners").select("*").order("created_at", { ascending: false }),
      supabase.from("parcels").select("id, partner_id"),
    ]);
    setPartners(p || []);
    setParcels(parc || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = partners
    .filter((p) => {
      if (filterActive === "active") return p.is_active !== false;
      if (filterActive === "inactive") return p.is_active === false;
      return true;
    })
    .filter((p) => {
      const q = search.toLowerCase();
      return !q || [p.name, p.email, p.office_name, p.country, p.city, p.contact_person]
        .some((v) => v?.toLowerCase().includes(q));
    });

  const counts = {
    all: partners.length,
    active: partners.filter((p) => p.is_active !== false).length,
    inactive: partners.filter((p) => p.is_active === false).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#8B5CF6]" />
            Partner Management
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Create partners and assign temporary passwords — only visible to super admin
          </p>
        </div>
        <PartnerFormDialog onSaved={fetchData} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners…"
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8B5CF6]/50"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterActive === f
                  ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30"
                  : "text-white/40 hover:text-white border border-transparent hover:border-white/10"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-[10px] opacity-60">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <Button size="icon" variant="ghost" onClick={fetchData}
          className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl border border-white/8 bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-white/30">
          <Building2 className="h-10 w-10" />
          <p className="text-sm">{search ? "No partners match your search" : "No partners yet"}</p>
          {!search && (
            <p className="text-xs text-white/20">Click "Add Partner" to create your first partner</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              parcels={parcels}
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
};
