import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Package, Send, FileText, ArrowRight, Inbox, Clock,
  CheckCircle2, XCircle, TruckIcon, MapPin, Bell, User,
} from "lucide-react";
import { UserRequestForm } from "./UserRequestForm";
import { UserPaymentInvoice } from "./UserPaymentInvoice";

interface UserDashboardProps {
  user: any;
  profile: any;
  parcels: any[];
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  approved:         { label: "Approved",          color: "#22C55E", bg: "#22C55E15", icon: CheckCircle2 },
  pending:          { label: "Pending",            color: "#EAB308", bg: "#EAB30815", icon: Clock },
  rejected:         { label: "Rejected",           color: "#EF4444", bg: "#EF444415", icon: XCircle },
  in_transit:       { label: "In Transit",         color: "#8B5CF6", bg: "#8B5CF615", icon: TruckIcon },
  out_for_delivery: { label: "Out for Delivery",   color: "#6366F1", bg: "#6366F115", icon: TruckIcon },
  delivered:        { label: "Delivered",          color: "#22C55E", bg: "#22C55E15", icon: CheckCircle2 },
  cancelled:        { label: "Cancelled",          color: "#EF4444", bg: "#EF444415", icon: XCircle },
};

const getStatus = (parcel: any) => {
  const s = parcel.request_status || parcel.current_status || "pending";
  return STATUS_CONFIG[s] || STATUS_CONFIG["pending"];
};

const QuickStat = ({ label, value, icon: Icon, color, index }: {
  label: string; value: number; icon: any; color: string; index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
  >
    <Card className="border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="rounded-xl p-2.5 group-hover:scale-110 transition-transform" style={{ background: `${color}15` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const UserDashboard = ({ user, profile, parcels, onRefresh }: UserDashboardProps) => {
  const [requestOpen, setRequestOpen] = useState(false);

  const inTransit = parcels.filter((p) => ["in_transit", "out_for_delivery", "picked_up"].includes(p.current_status || "")).length;
  const delivered = parcels.filter((p) => p.current_status === "delivered").length;
  const pending = parcels.filter((p) => (p.request_status || p.current_status || "pending") === "pending").length;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <QuickStat index={0} label="My Parcels" value={parcels.length} icon={Package} color="#2563EB" />
        <QuickStat index={1} label="In Transit" value={inTransit} icon={TruckIcon} color="#8B5CF6" />
        <QuickStat index={2} label="Delivered" value={delivered} icon={CheckCircle2} color="#22C55E" />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ y: -2, boxShadow: "0 20px 40px -12px rgba(37,99,235,0.2)" }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer"
            >
              <Card className="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="relative flex flex-col items-center gap-4 p-6 text-center">
                  <div className="rounded-2xl bg-primary/10 p-5 group-hover:scale-110 transition-transform duration-300">
                    <Send className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">New Shipment Request</h3>
                    <p className="text-sm text-muted-foreground mt-1">Send a package anywhere in the world</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Get started <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Shipment Request</DialogTitle>
            </DialogHeader>
            <UserRequestForm onSuccess={() => { setRequestOpen(false); onRefresh(); }} />
          </DialogContent>
        </Dialog>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card className="group relative overflow-hidden border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="relative flex flex-col items-center gap-4 p-6 text-center">
              <div className="rounded-2xl bg-emerald-500/10 p-5 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">My Invoices</h3>
                <p className="text-sm text-muted-foreground mt-1">Download payment receipts anytime</p>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                View all <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Parcel History */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            My Shipments
            {parcels.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{parcels.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <AnimatePresence mode="wait">
            {parcels.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-16 text-center"
              >
                <div className="rounded-full bg-muted p-5">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No shipments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submit your first request to see it here.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setRequestOpen(true)}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  New Request
                </Button>
              </motion.div>
            ) : (
              <motion.div key="list" className="space-y-3">
                {parcels.map((parcel, i) => {
                  const cfg = getStatus(parcel);
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={parcel.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-xl border bg-card p-4 hover:bg-muted/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-semibold text-primary truncate">
                              {parcel.tracking_id}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium text-foreground">{parcel.from_country}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{parcel.to_country}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            To: <span className="text-foreground">{parcel.receiver_name}</span>
                          </p>
                          {/* Ownership badges */}
                          {(parcel.partner_name || parcel.created_by_name) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {parcel.partner_name && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  📦 {parcel.partner_name}
                                </Badge>
                              )}
                              {parcel.created_by_name && (
                                <Badge variant="outline" className="text-[10px] py-0">
                                  ✏️ {parcel.created_by_name}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                            style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                          {parcel.shipping_status && (
                            <Badge variant="outline" className="text-[10px]">
                              {parcel.shipping_status.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                          )}
                          {parcel.payment_amount && <UserPaymentInvoice parcel={parcel} />}
                          <p className="text-xs text-muted-foreground">
                            {new Date(parcel.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {parcel.rejection_reason && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                          <p className="text-sm text-red-800 dark:text-red-400">
                            <strong>Rejection reason:</strong> {parcel.rejection_reason}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};
