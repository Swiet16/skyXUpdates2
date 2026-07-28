import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Package, FileText, Settings, DollarSign,
  Activity, TrendingUp, TrendingDown, Building2,
  Globe, BarChart3, ShieldCheck, AlertCircle, CheckCircle2,
  XCircle, Clock, RefreshCw, Eye,
} from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { UserManagement } from "./UserManagement";
import { ParcelManagement } from "./ParcelManagement";
import { PricingManager } from "./PricingManager";
import { AdminRequestsSection } from "./AdminRequestsSection";
import { ApprovedParcelsSection } from "./ApprovedParcelsSection";
import {
  FlightPathChart, ManifestBar, LedgerBars, Sparkline,
  lastNDays, bucketByDay, sumByDay, dayLabel, pctDelta,
} from "./DashboardCharts";

interface SuperAdminDashboardProps {
  user: any;
  profile: any;
}

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
  label, value, delta, icon: Icon, accentColor, sub, index,
}: {
  label: string; value: string | number; delta?: number;
  icon: any; accentColor: string; sub?: string; index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
  >
    <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${accentColor}18, transparent 60%)` }}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-medium text-white/60">{label}</CardTitle>
        <div className="rounded-lg p-2" style={{ background: `${accentColor}20` }}>
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {delta !== undefined && (
              <p className="flex items-center gap-1 text-xs mt-1" style={{ color: delta >= 0 ? "#22C55E" : "#EF4444" }}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {delta >= 0 ? "+" : ""}{delta}% vs prior week
              </p>
            )}
            {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const SuperAdminDashboard = ({ user, profile }: SuperAdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: users } = useLiveData<any>({
    table: "profiles", orderBy: { column: "created_at", ascending: false },
  });
  const { data: parcels } = useLiveData<any>({
    table: "parcels", orderBy: { column: "created_at", ascending: false },
  });
  const { data: invoices } = useLiveData<any>({
    table: "invoices", orderBy: { column: "created_at", ascending: false },
  });
  const { data: quotes } = useLiveData<any>({
    table: "quotes", orderBy: { column: "created_at", ascending: false },
  });
  const { data: partners } = useLiveData<any>({
    table: "partners", orderBy: { column: "created_at", ascending: false },
  });
  const { data: expenses } = useLiveData<any>({
    table: "expenses", orderBy: { column: "created_at", ascending: false },
  });

  const days14 = useMemo(() => lastNDays(14), []);
  const days7 = useMemo(() => lastNDays(7), []);

  const parcelsPerDay14 = useMemo(() => bucketByDay(parcels, "created_at", days14), [parcels, days14]);
  const usersPerDay14 = useMemo(() => bucketByDay(users, "created_at", days14), [users, days14]);
  const invoicesPerDay14 = useMemo(() => bucketByDay(invoices, "created_at", days14), [invoices, days14]);
  const revenuePerDay7 = useMemo(() => sumByDay(invoices, "created_at", "final_amount", days7), [invoices, days7]);

  const parcelsDelta = useMemo(() => pctDelta(parcelsPerDay14.slice(7), parcelsPerDay14.slice(0, 7)), [parcelsPerDay14]);
  const usersDelta = useMemo(() => pctDelta(usersPerDay14.slice(7), usersPerDay14.slice(0, 7)), [usersPerDay14]);
  const invoicesDelta = useMemo(() => pctDelta(invoicesPerDay14.slice(7), invoicesPerDay14.slice(0, 7)), [invoicesPerDay14]);

  const statusSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    parcels.forEach((p: any) => {
      const key = p.current_status || "created";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([label, value]) => ({ label, value, color: STATUS_HEX[label] || "#94A3B8" }));
  }, [parcels]);

  const stats = {
    totalParcels: parcels.length,
    delivered: parcels.filter((p: any) => p.current_status === "delivered").length,
    pending: parcels.filter((p: any) => !["delivered", "cancelled"].includes(p.current_status)).length,
    cancelled: parcels.filter((p: any) => p.current_status === "cancelled").length,
    totalUsers: users.filter((u: any) => u.role === "user" || !u.role).length,
    activePartners: partners.filter((p: any) => p.is_active !== false).length,
    totalRevenue: invoices.reduce((s: number, i: any) => s + (i.final_amount || 0), 0),
    totalExpenses: expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0),
    pendingQuotes: quotes.filter((q: any) => q.status === "pending").length,
  };

  const day7Labels = days7.map(dayLabel);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="h-auto flex-wrap gap-1 bg-white/5 border border-white/10 p-1">
            {[
              { value: "overview", label: "Overview", icon: BarChart3 },
              { value: "partners", label: "Partners", icon: Building2 },
              { value: "requests", label: "Requests", icon: Clock },
              { value: "approved", label: "Approved", icon: CheckCircle2 },
              { value: "users", label: "Users", icon: Users },
              { value: "parcels", label: "All Parcels", icon: Package },
              { value: "rates", label: "Rates", icon: DollarSign },
              { value: "system", label: "System", icon: Settings },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ─── OVERVIEW ─── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard index={0} label="Total Parcels" value={stats.totalParcels} delta={parcelsDelta} icon={Package} accentColor="#C98A2B" />
            <StatCard index={1} label="Delivered" value={stats.delivered} icon={CheckCircle2} accentColor="#22C55E" sub={`${stats.totalParcels > 0 ? Math.round((stats.delivered / stats.totalParcels) * 100) : 0}% delivery rate`} />
            <StatCard index={2} label="In Progress" value={stats.pending} icon={Clock} accentColor="#6366F1" />
            <StatCard index={3} label="Cancelled" value={stats.cancelled} icon={XCircle} accentColor="#EF4444" />
            <StatCard index={4} label="Revenue" value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} delta={invoicesDelta} icon={DollarSign} accentColor="#22C55E" />
            <StatCard index={5} label="Expenses" value={`$${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={TrendingDown} accentColor="#EF4444" />
            <StatCard index={6} label="Active Partners" value={stats.activePartners} icon={Building2} accentColor="#8B5CF6" />
            <StatCard index={7} label="Active Users" value={stats.totalUsers} delta={usersDelta} icon={Users} accentColor="#3B82F6" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#C98A2B]" />
                    Parcel Flow — 14 days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FlightPathChart data={parcelsPerDay14.slice(7)} labels={day7Labels} accent="#C98A2B" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#22C55E]" />
                    Revenue — 7 days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LedgerBars data={revenuePerDay7} labels={day7Labels} accent="#22C55E" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Status Breakdown + Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#6366F1]" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusSegments.length === 0 ? (
                    <p className="text-white/40 text-sm py-4 text-center">No parcel data yet</p>
                  ) : (
                    <ManifestBar segments={statusSegments} />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#3B82F6]" />
                    Live Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parcels.slice(0, 6).map((p: any, i: number) => (
                    <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_HEX[p.current_status] || "#94A3B8" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-white/80 truncate">{p.tracking_id}</p>
                        <p className="text-[10px] text-white/40">{p.from_country} → {p.to_country}</p>
                      </div>
                      <span className="text-[10px] text-white/40 shrink-0">{formatRelativeTime(p.updated_at || p.created_at)}</span>
                    </div>
                  ))}
                  {parcels.length === 0 && (
                    <p className="text-white/40 text-sm py-4 text-center">No activity yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── PARTNERS ─── */}
        <TabsContent value="partners" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white/80 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#8B5CF6]" />
                  Partner Offices ({stats.activePartners} active)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {partners.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building2 className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No partner offices yet</p>
                    <p className="text-white/25 text-xs mt-1">Partners are created after running the SQL schema</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partners.map((partner: any, i: number) => {
                      const partnerParcels = parcels.filter((p: any) => p.partner_id === partner.id);
                      return (
                        <motion.div
                          key={partner.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-[#8B5CF6]" />
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{partner.name}</p>
                              <p className="text-xs text-white/40">{partner.office_name} · {partner.country}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <p className="text-white text-sm font-bold">{partnerParcels.length}</p>
                              <p className="text-white/40 text-[10px]">parcels</p>
                            </div>
                            <Badge className={partner.is_active !== false ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                              {partner.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── OTHER TABS (reuse existing components) ─── */}
        <TabsContent value="requests">
          <AdminRequestsSection />
        </TabsContent>
        <TabsContent value="approved">
          <ApprovedParcelsSection />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="parcels">
          <ParcelManagement />
        </TabsContent>
        <TabsContent value="rates">
          <PricingManager />
        </TabsContent>
        <TabsContent value="system">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "profiles", count: users.length, last: users[0]?.created_at, color: "#6C5CE7" },
                { label: "parcels", count: parcels.length, last: parcels[0]?.created_at, color: "#C98A2B" },
                { label: "invoices", count: invoices.length, last: invoices[0]?.created_at, color: "#2B8C7E" },
                { label: "quotes", count: quotes.length, last: quotes[0]?.created_at, color: "#3FA76B" },
                { label: "partners", count: partners.length, last: partners[0]?.created_at, color: "#8B5CF6" },
              ].map(({ label, count, last, color }) => (
                <Card key={label} className="border border-white/10 bg-white/5 backdrop-blur-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-sm font-mono text-white/80">{label}</p>
                        <p className="text-xs text-white/40">Last: {formatRelativeTime(last)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{count}</p>
                      <p className="text-[10px] text-white/40">rows</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
