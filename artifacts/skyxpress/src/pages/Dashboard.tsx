import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SuperAdminDashboard } from "@/components/SuperAdminDashboard";
import { AdminPartnerDashboard } from "@/components/AdminPartnerDashboard";
import { UserDashboard } from "@/components/UserDashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Shield, Building2, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

// ─── Role resolution ────────────────────────────────────────────────────────
// super_admin  → full SuperAdminDashboard (all tabs always)
// admin        → SuperAdminDashboard but Users tab only if can_manage_users=true
// admin_partner/staff/developer → AdminPartnerDashboard
// user         → UserDashboard
const resolveRole = (raw?: string | null): "super_admin" | "admin" | "admin_partner" | "user" => {
  const r = (raw || "").toLowerCase();
  if (r === "super_admin") return "super_admin";
  if (r === "admin") return "admin";
  if (r === "admin_partner" || r === "staff" || r === "developer") return "admin_partner";
  return "user";
};

const ROLE_META = {
  super_admin: {
    label: "Super Admin",
    tagline: "Full platform control — all partners, parcels & analytics",
    Icon: Shield,
    headerClass: "bg-[#0a0e17]",
    accentColor: "#C98A2B",
    badgeClass: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  },
  admin: {
    label: "Admin",
    tagline: "Platform management — parcels, rates & team",
    Icon: Shield,
    headerClass: "bg-[#0a0e17]",
    accentColor: "#8B5CF6",
    badgeClass: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  },
  admin_partner: {
    label: "Admin Partner",
    tagline: "Partner office — manage your parcels, customers & reports",
    Icon: Building2,
    headerClass: "bg-[#0d0f1e]",
    accentColor: "#8B5CF6",
    badgeClass: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  },
  user: {
    label: "Customer",
    tagline: "Track your shipments and manage your account",
    Icon: User,
    headerClass: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
    accentColor: "#2563EB",
    badgeClass: "bg-blue-500/15 text-blue-700 border border-blue-200 dark:text-blue-300 dark:border-blue-500/30",
  },
} as const;

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUserData = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    setProfile(profileData);

    const role = resolveRole(profileData?.role);
    if (role === "user") {
      const { data: parcelsData } = await supabase
        .from("parcels")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setParcels(parcelsData || []);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      await fetchUserData(session.user.id);
      setLoading(false);
    };
    init();
  }, [navigate, fetchUserData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const role = resolveRole(profile?.role ?? undefined);
  const meta = ROLE_META[role];
  const { Icon } = meta;
  const isPrivileged = role === "super_admin" || role === "admin" || role === "admin_partner";
  const isSuperAdmin = role === "super_admin";
  // admin can see Users tab only if super_admin explicitly granted them access
  const canManageUsers = isSuperAdmin || profile?.can_manage_users === true;

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      {/* ─── Dashboard Header ─── */}
      <section
        className={`relative overflow-hidden border-b pt-[175px] md:pt-[195px] ${isPrivileged ? "border-white/10" : "border-border"} ${meta.headerClass}`}
      >
        {/* Glow blobs for privileged users */}
        {isPrivileged && (
          <>
            <div
              className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30"
              style={{ background: meta.accentColor }}
            />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
            {/* Grid pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </>
        )}

        <div className="container relative mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className="relative shrink-0">
                {isPrivileged && (
                  <div
                    className="absolute inset-0 animate-pulse rounded-2xl blur-md opacity-60"
                    style={{ background: meta.accentColor }}
                  />
                )}
                <div
                  className={`relative rounded-2xl p-3.5 shadow-lg sm:p-4 ${isPrivileged ? "border border-white/10" : "bg-primary"}`}
                  style={isPrivileged ? { background: `${meta.accentColor}30` } : {}}
                >
                  <Icon
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    style={{ color: isPrivileged ? meta.accentColor : "white" }}
                  />
                </div>
              </div>

              <div className="min-w-0">
                {isPrivileged && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-xs font-medium uppercase tracking-widest text-emerald-400">System Online</span>
                  </div>
                )}
                <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl ${isPrivileged ? "text-white" : "text-foreground"}`}>
                  {meta.label} Dashboard
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <p className={`truncate text-sm ${isPrivileged ? "text-white/60" : "text-muted-foreground"}`}>
                    Welcome back,{" "}
                    <span className={isPrivileged ? "text-white/90" : "text-foreground"}>
                      {profile?.full_name || user?.email}
                    </span>
                  </p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider ${meta.badgeClass}`}>
                    <Icon className="h-3 w-3" />
                    {meta.label.toUpperCase()}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isPrivileged ? "text-white/40" : "text-muted-foreground"}`}>
                  {meta.tagline}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Button
                onClick={handleLogout}
                variant="outline"
                className={`w-full gap-2 sm:w-auto ${
                  isPrivileged
                    ? "border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white"
                    : "bg-background/60 backdrop-blur"
                }`}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Dashboard Body ─── */}
      <section className={`py-8 sm:py-10 md:py-12 ${isPrivileged ? "bg-[#0a0e17]" : "bg-muted/10"}`}>
        <div className="container mx-auto px-4">
          {(role === "super_admin" || role === "admin") && (
            <SuperAdminDashboard
              user={user}
              profile={profile}
              isSuperAdmin={isSuperAdmin}
              canManageUsers={canManageUsers}
            />
          )}
          {role === "admin_partner" && (
            <AdminPartnerDashboard user={user} profile={profile} />
          )}
          {role === "user" && (
            <div className="mx-auto max-w-5xl">
              <UserDashboard
                user={user}
                profile={profile}
                parcels={parcels}
                onRefresh={() => fetchUserData(user.id)}
              />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Dashboard;
