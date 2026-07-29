import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package, DollarSign, Users, CheckCircle2, Clock,
  TrendingUp, TrendingDown, Building2, FileText,
  Activity, ArrowRight, AlertCircle, PlusCircle,
} from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { ParcelManagement } from "./ParcelManagement";
import { AdminRequestsSection } from "./AdminRequestsSection";
import { ApprovedParcelsSection } from "./ApprovedParcelsSection";
import { InvoiceManager } from "./InvoiceManager";
import { PartnerRates } from "./PartnerRates";
import {
  FlightPathChart, LedgerBars, lastNDays, bucketByDay, sumByDay, dayLabel,
} from "./DashboardCharts";

interface AdminPartnerDashboardProps {
  user: any;
  profile: any;
}

const STATUS_COLOR: Record<string, string> = {
  delivered: "#22C55E", in_transit: "#8B5CF6", pending: "#EAB308",
  cancelled: "#EF4444", created: "#3B82F6", out_for_delivery: "#6366F1",
};

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PartnerStatCard = ({
  label, value, icon: Icon, color, sub, index,
}: {
  label: string; value: string | number; icon: any;
  color: string; sub?: string; index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
  >
    <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(ellipse at top left, ${color}15, transparent 60%)` }}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/50 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-[11px] text-white/40 mt-1">{sub}</p>}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: `${color}20` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const AdminPartnerDashboard = ({ user, profile }: AdminPartnerDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Filter all data by partner_id if available, otherwise show all
  const partnerFilter = profile?.partner_id
    ? { column: "partner_id", value: profile.partner_id }
    : undefined;

  const { data: parcels } = useLiveData<any>({
    table: "parcels",
    filter: partnerFilter,
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
  const { data: customers } = useLiveData<any>({
    table: "customers",
    filter: partnerFilter,
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: expenses } = useLiveData<any>({
    table: "expenses",
    filter: partnerFilter,
    orderBy: { column: "created_at", ascending: false },
  });

  const days7 = useMemo(() => lastNDays(7), []);
  const day7Labels = days7.map(dayLabel);

  const todayStr = new Date().toDateString();
  const today = parcels.filter((p: any) => new Date(p.created_at).toDateString() === todayStr);
  const pending = parcels.filter((p: any) => !["delivered", "cancelled"].includes(p.current_status || ""));
  const delivered = parcels.filter((p: any) => p.current_status === "delivered");

  const totalRevenue = invoices.reduce((s: number, i: any) => s + (i.final_amount || 0), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);

  const parcelsPerDay7 = useMemo(() => bucketByDay(parcels, "created_at", days7), [parcels, days7]);
  const revenuePerDay7 = useMemo(() => sumByDay(invoices, "created_at", "final_amount", days7), [invoices, days7]);

  // Status breakdown
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    parcels.forEach((p: any) => {
      const k = p.current_status || "created";
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [parcels]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="h-auto gap-1 bg-white/5 border border-white/10 p-1">
            {[
              { value: "overview", label: "Overview", icon: Activity },
              { value: "parcels", label: "Parcels", icon: Package },
              { value: "requests", label: "Requests", icon: Clock },
              { value: "approved", label: "Approved", icon: CheckCircle2 },
              { value: "invoices", label: "Invoices", icon: FileText },
              { value: "customers", label: "Customers", icon: Users },
              { value: "expenses", label: "Expenses", icon: DollarSign },
              { value: "rates", label: "My Rates", icon: DollarSign },
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
          {/* Partner info banner */}
          {profile?.partner_id && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-3">
                <Building2 className="h-4 w-4 text-[#8B5CF6]" />
                <p className="text-sm text-white/70">
                  Viewing data for your office only — isolated from other partners.
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <PartnerStatCard index={0} label="Today's Parcels" value={today.length} icon={Package} color="#C98A2B" />
            <PartnerStatCard index={1} label="Pending" value={pending.length} icon={Clock} color="#EAB308" />
            <PartnerStatCard index={2} label="Delivered" value={delivered.length} icon={CheckCircle2} color="#22C55E"
              sub={`${parcels.length > 0 ? Math.round((delivered.length / parcels.length) * 100) : 0}% rate`} />
            <PartnerStatCard index={3} label="Revenue" value={`$${formatCurrency(totalRevenue)}`} icon={DollarSign} color="#22C55E" />
            <PartnerStatCard index={4} label="Expenses" value={`$${formatCurrency(totalExpenses)}`} icon={TrendingDown} color="#EF4444" />
            <PartnerStatCard index={5} label="Customers" value={customers.length} icon={Users} color="#3B82F6" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#C98A2B]" />
                    Daily Parcels — 7 days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FlightPathChart data={parcelsPerDay7} labels={day7Labels} accent="#C98A2B" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#22C55E]" />
                    Daily Revenue — 7 days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LedgerBars data={revenuePerDay7} labels={day7Labels} accent="#22C55E" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Status Overview + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">Parcel Status Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(statusCounts).length === 0 ? (
                    <p className="text-white/40 text-sm py-4 text-center">No parcels yet</p>
                  ) : (
                    Object.entries(statusCounts).map(([status, count]) => {
                      const pct = parcels.length > 0 ? Math.round((count / parcels.length) * 100) : 0;
                      const color = STATUS_COLOR[status] || "#94A3B8";
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-white/60 flex-1 capitalize">{status.replace(/_/g, " ")}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-xs font-mono text-white/70 w-6 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#3B82F6]" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parcels.slice(0, 6).map((p: any) => {
                    const color = STATUS_COLOR[p.current_status] || "#94A3B8";
                    return (
                      <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-white/80 truncate">{p.tracking_id}</p>
                          <p className="text-[10px] text-white/40">
                            {p.from_country} <ArrowRight className="inline h-2.5 w-2.5" /> {p.to_country}
                          </p>
                        </div>
                        <Badge className="text-[10px]" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
                          {(p.current_status || "created").replace(/_/g, " ")}
                        </Badge>
                      </div>
                    );
                  })}
                  {parcels.length === 0 && (
                    <p className="text-white/40 text-sm py-4 text-center">No parcels yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── OTHER TABS ─── */}
        <TabsContent value="parcels"><ParcelManagement /></TabsContent>
        <TabsContent value="requests"><AdminRequestsSection /></TabsContent>
        <TabsContent value="approved"><ApprovedParcelsSection /></TabsContent>
        <TabsContent value="invoices"><InvoiceManager /></TabsContent>

        <TabsContent value="customers">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white/80 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#3B82F6]" />
                  My Customers ({customers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No customers yet</p>
                    <p className="text-white/25 text-xs mt-1">Customers will appear after the schema is applied</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customers.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          <p className="text-xs text-white/40">{c.email} · {c.country}</p>
                        </div>
                        <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30 text-[10px]">
                          {c.city || "—"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="expenses">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white/80 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#EF4444]" />
                  My Expenses — Total: ${formatCurrency(totalExpenses)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="py-12 text-center">
                    <DollarSign className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No expenses recorded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-white capitalize">{e.category}</p>
                          <p className="text-xs text-white/40">{e.description} · {e.expense_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#EF4444]">${formatCurrency(e.amount)}</span>
                          <Badge className={
                            e.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]"
                              : e.status === "rejected"
                              ? "bg-red-500/20 text-red-400 border-red-500/30 text-[10px]"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]"
                          }>
                            {e.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── RATES — partner can view & request edits to their own rates ─── */}
        <TabsContent value="rates">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <PartnerRates role="admin_partner" partnerId={profile?.partner_id} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
