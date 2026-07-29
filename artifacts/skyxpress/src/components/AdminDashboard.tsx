// @ts-nocheck
/**
 * AdminDashboard — dedicated dashboard for the `admin` role.
 *
 * Super-admin sees SuperAdminDashboard (all data, all partners).
 * Admin sees THIS dashboard — their own action history, parcel creation,
 * requests, invoices, and optionally user management (if super-admin
 * has granted can_manage_users = true on their profile).
 *
 * Key features
 * ─────────────
 * • Can create parcels (same ability as partner accounts)
 * • Every parcel in the Parcels tab shows "Created By" (name + role badge)
 * • "Users" tab only appears when can_manage_users = true
 * • Stats show total-system numbers so the admin has full visibility
 */
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package, FileText, DollarSign, Users, Activity,
  TrendingUp, TrendingDown, CheckCircle2, Clock,
  ClipboardCheck, ShieldCheck, BarChart3, AlertCircle,
} from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { ParcelManagement } from "./ParcelManagement";
import { AdminRequestsSection } from "./AdminRequestsSection";
import { ApprovedParcelsSection } from "./ApprovedParcelsSection";
import { InvoiceManager } from "./InvoiceManager";
import { UserManagement } from "./UserManagement";
import {
  FlightPathChart, LedgerBars, lastNDays, bucketByDay, sumByDay, dayLabel, pctDelta,
} from "./DashboardCharts";

interface AdminDashboardProps {
  user: any;
  profile: any;
  canManageUsers?: boolean;
}

const ACCENT = "#8B5CF6"; // violet — admin identity colour

const STATUS_HEX: Record<string, string> = {
  created: "#EAB308", picked_up: "#3B82F6", in_transit: "#8B5CF6",
  custom_hold: "#EF4444", flight_departure: "#6366F1", flight_arrived: "#22C55E",
  flight_offload: "#F97316", in_custom_clearance: "#EAB308", arrived_hub: "#3B82F6",
  customs: "#F97316", out_for_delivery: "#6366F1", delivered: "#22C55E",
  cancelled: "#EF4444",
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const StatCard = ({
  label, value, delta, icon: Icon, color, sub, index,
}: {
  label: string; value: string | number; delta?: number;
  icon: any; color: string; sub?: string; index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
  >
    <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${color}18, transparent 60%)` }}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-medium text-white/60">{label}</CardTitle>
        <div className="rounded-lg p-2" style={{ background: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="text-2xl font-bold text-white">{value}</div>
        {delta !== undefined && (
          <p className="flex items-center gap-1 text-xs mt-1" style={{ color: delta >= 0 ? "#22C55E" : "#EF4444" }}>
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta >= 0 ? "+" : ""}{delta}% vs prior week
          </p>
        )}
        {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

export const AdminDashboard = ({ user, profile, canManageUsers = false }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  /* ─── live data ──────────────────────────────────────────────────────── */
  // Admins only see their own parcels everywhere in this dashboard.
  // Super-admins use SuperAdminDashboard which has no filter.
  const { data: parcels } = useLiveData<any>({
    table: "parcels",
    filter: profile?.user_id
      ? { column: "created_by", value: profile.user_id }
      : undefined,
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: invoices } = useLiveData<any>({
    table: "invoices",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: quotes } = useLiveData<any>({
    table: "quotes",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: users } = useLiveData<any>({
    table: "profiles",
    orderBy: { column: "created_at", ascending: false },
  });

  /* ─── metric math ────────────────────────────────────────────────────── */
  const days7 = useMemo(() => lastNDays(7), []);
  const days14 = useMemo(() => lastNDays(14), []);

  const parcelsThisWeek = useMemo(
    () => bucketByDay(parcels, "created_at", days7),
    [parcels, days7],
  );
  const parcelsPriorWeek = useMemo(
    () => bucketByDay(parcels, "created_at", days14.slice(0, 7)),
    [parcels, days14],
  );

  const totalParcels = parcels.length;
  const activeCount = parcels.filter((p: any) =>
    !["delivered", "cancelled"].includes(p.current_status),
  ).length;
  const deliveredCount = parcels.filter((p: any) => p.current_status === "delivered").length;
  const totalRevenue = parcels.reduce((s: number, p: any) => s + (Number(p.total_price) || 0), 0);

  const revenueThisWeek = useMemo(
    () => sumByDay(parcels, "total_price", "created_at", days7),
    [parcels, days7],
  );
  const revenuePriorWeek = useMemo(
    () => sumByDay(parcels, "total_price", "created_at", days14.slice(0, 7)),
    [parcels, days14],
  );

  const parcelDelta = pctDelta(parcelsThisWeek, parcelsPriorWeek);
  const revenueDelta = pctDelta(revenueThisWeek, revenuePriorWeek);

  /* ─── status breakdown ───────────────────────────────────────────────── */
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    parcels.forEach((p: any) => {
      map[p.current_status] = (map[p.current_status] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [parcels]);

  /* ─── tabs ───────────────────────────────────────────────────────────── */
  const TABS = [
    { id: "overview",  label: "Overview",  icon: BarChart3 },
    { id: "parcels",   label: "Parcels",   icon: Package },
    { id: "requests",  label: "Requests",  icon: ClipboardCheck },
    { id: "approved",  label: "Approved",  icon: CheckCircle2 },
    { id: "invoices",  label: "Invoices",  icon: FileText },
    ...(canManageUsers
      ? [{ id: "users", label: "Users", icon: Users }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* ─── Admin identity banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-3"
      >
        <ShieldCheck className="h-5 w-5 text-violet-400" />
        <div>
          <p className="text-sm font-semibold text-violet-300">Admin Dashboard</p>
          <p className="text-xs text-white/40">
            Full parcel access — create shipments, manage requests &amp; invoices
            {canManageUsers ? " · User management enabled" : ""}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-white/40">Signed in as</p>
          <p className="text-sm font-medium text-white/80">{profile?.full_name || user?.email}</p>
        </div>
      </motion.div>

      {/* ─── Stat cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Parcels"   value={totalParcels}  delta={parcelDelta}  icon={Package}    color="#8B5CF6" index={0} />
        <StatCard label="Active"          value={activeCount}                         icon={Activity}   color="#3B82F6" index={1} sub="in transit or processing" />
        <StatCard label="Delivered"       value={deliveredCount}                      icon={CheckCircle2} color="#22C55E" index={2} />
        <StatCard label="Total Revenue"   value={`$${totalRevenue.toLocaleString(undefined,{maximumFractionDigits:0})}`} delta={revenueDelta} icon={DollarSign} color="#C98A2B" index={3} />
      </div>

      {/* ─── Tab body ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 h-auto flex-wrap gap-1 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1.5 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 text-white/50 text-xs sm:text-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Volume chart */}
          <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Package className="h-4 w-4" style={{ color: ACCENT }} />
                Parcel Volume — Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FlightPathChart
                data={parcelsThisWeek}
                labels={days7.map(dayLabel)}
                color={ACCENT}
              />
            </CardContent>
          </Card>

          {/* Revenue + Status row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#C98A2B]" />
                  Revenue — Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LedgerBars
                  data={revenueThisWeek}
                  labels={days7.map(dayLabel)}
                  color="#C98A2B"
                />
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#3B82F6]" />
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {statusBreakdown.length === 0 && (
                  <p className="text-xs text-white/30 py-4 text-center">No parcel data yet</p>
                )}
                {statusBreakdown.map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_HEX[status] || "#6B7280" }}
                    />
                    <span className="text-xs text-white/50 flex-1 capitalize">{status.replace(/_/g, " ")}</span>
                    <span className="text-xs font-semibold text-white">{count}</span>
                    <div className="w-20 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((count / totalParcels) * 100)}%`,
                          backgroundColor: STATUS_HEX[status] || "#6B7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent parcels */}
          <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#8B5CF6]" />
                Recent Parcels (yours)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {parcels.length === 0 ? (
                <p className="text-xs text-white/30 py-6 text-center">No parcels yet</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="text-left pb-2 pr-4 font-medium">Tracking ID</th>
                      <th className="text-left pb-2 pr-4 font-medium">Sender</th>
                      <th className="text-left pb-2 pr-4 font-medium">Route</th>
                      <th className="text-left pb-2 pr-4 font-medium">Status</th>
                      <th className="text-right pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcels.slice(0, 8).map((p: any) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-2 pr-4 font-mono text-violet-300">{p.tracking_id}</td>
                        <td className="py-2 pr-4 text-white/80">{p.sender_name}</td>
                        <td className="py-2 pr-4 text-white/50">{p.from_country} → {p.to_country}</td>
                        <td className="py-2 pr-4">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${STATUS_HEX[p.current_status] || "#6B7280"}20`,
                              color: STATUS_HEX[p.current_status] || "#9CA3AF",
                            }}
                          >
                            {p.current_status?.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 text-right text-white/40">{formatRelativeTime(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Parcels — admin sees only their own created parcels ── */}
        <TabsContent value="parcels">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Info callout */}
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-300">
                As an <strong>Admin</strong> you can create new parcels and view the shipments you have created.
                Only the <strong>Super Admin</strong> can see parcels across all admins.
              </p>
            </div>
            <ParcelManagement userProfile={profile} filterByUserId={profile?.user_id} />
          </motion.div>
        </TabsContent>

        {/* ── Requests — admin sees only their own pending requests ── */}
        <TabsContent value="requests">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <AdminRequestsSection filterByUserId={profile?.user_id} />
          </motion.div>
        </TabsContent>

        {/* ── Approved — admin sees only approved parcels they created ── */}
        <TabsContent value="approved">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <ApprovedParcelsSection filterByUserId={profile?.user_id} />
          </motion.div>
        </TabsContent>

        {/* ── Invoices ── */}
        <TabsContent value="invoices">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <InvoiceManager />
          </motion.div>
        </TabsContent>

        {/* ── Users (only if can_manage_users) ── */}
        {canManageUsers && (
          <TabsContent value="users">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300">
                  User management access was granted to your account by a Super Admin.
                  You can view and manage user roles within your permissions.
                </p>
              </div>
              {/* isSuperAdmin=false so admin can't grant super_admin role or toggle other admins */}
              <UserManagement isSuperAdmin={false} />
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
