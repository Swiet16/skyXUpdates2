// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  PackageCheck,
  Truck,
  Send,
  CheckCircle2,
  Clock,
  Plane,
  XCircle,
  MessageSquareText,
  MapPin,
} from "lucide-react";

interface TrackingResult {
  tracking_id: string;
  reference_id?: string;
  sender_name: string;
  receiver_name: string;
  current_status: string;
  from_country: string;
  to_country: string;
  status_timeline: any[];
  live_route: boolean;
  route_checkpoints: any[];
  admin_note?: string | null;
}

// Helper function to group events by date
const groupEventsByDate = (timeline: any[]) => {
  const grouped: { [key: string]: any[] } = {};

  [...timeline]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .forEach((event) => {
      const date = new Date(event.timestamp);
      const dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

  return grouped;
};

// Deterministic faux-barcode bars derived from the tracking ID itself,
// so every parcel prints its own unique "ticket stub" pattern.
const getBarcodeBars = (value: string) => {
  const source = (value || "SKYXPRESS0000").toUpperCase();
  return Array.from(source).map((ch, i) => {
    const code = ch.charCodeAt(0);
    return { width: (code % 3) + 1, tall: code % 2 === 0, key: `${ch}-${i}` };
  });
};

// Deterministic ink-stamp tilt derived from a reference string, so every
// stamped note reads as its own unique physical impression rather than a
// repeated component.
const getStampRotation = (value: string) => {
  const source = value || "SKYXPRESS";
  let hash = 0;
  for (const ch of source) hash = (hash * 31 + ch.charCodeAt(0)) % 1000;
  return (hash % 700) / 100 - 3.5; // range: -3.5deg to 3.5deg
};

// ---- Brand tokens -----------------------------------------------------
// Ink navy for the fuselage, sky blue + beacon amber for instrumentation,
// SkyXpress orange as the single hot accent. Paper is true white, printed
// like a real ticket stub rather than a soft "app card". Ink red is
// reserved for the customs-stamp admin notes, distinct from the alert red.
const TOKENS = {
  navy: "#0B2545",
  navyDeep: "#071A33",
  blue: "#2E86FF",
  orange: "#FF6A1A",
  amber: "#FFB020",
  cloud: "#F5F8FC",
  mist: "#E9F0FA",
  slate: "#5B6B82",
  green: "#17A673",
  red: "#E5484D",
  ink: "#AB3527",
  paper: "#FFFFFF",
};

// ---- Journey stages (the signature "flight path") ----------------------
const STAGES = [
  { key: "placed", label: "Order Placed", gate: "A1", icon: Clock },
  { key: "picked_up", label: "Picked Up", gate: "A2", icon: PackageCheck },
  { key: "in_transit", label: "In Transit", gate: "A3", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", gate: "A4", icon: Send },
  { key: "delivered", label: "Delivered", gate: "A5", icon: CheckCircle2 },
] as const;

// Maps every possible raw status onto one of the 5 journey stages above.
const STATUS_TO_STAGE: Record<string, number> = {
  created: 0,
  pending: 0,
  approved: 0,
  picked_up: 1,
  processing: 1,
  in_transit: 2,
  customs: 2,
  custom_hold: 2,
  flight_departure: 2,
  flight_arrived: 2,
  flight_offload: 2,
  in_custom_clearance: 2,
  arrived_hub: 2,
  out_for_delivery: 3,
  delivered: 4,
};

const getStageIndex = (status: string) => STATUS_TO_STAGE[status] ?? 0;
const STAGE_COLORS = [TOKENS.slate, TOKENS.green, TOKENS.blue, TOKENS.amber, TOKENS.green];

const formatStatusLabel = (status: string) =>
  status
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

// ---- Ink-stamp admin note ------------------------------------------------
// Styled like a customs / ops rubber stamp rather than a sticky note, to
// stay inside the boarding-pass world: double ruled border, dashed inner
// frame, faint printed grain, a seal glyph, and a stamp reference number.
const StampNote = ({
  note,
  refCode,
  size = "lg",
}: {
  note: string;
  refCode: string;
  size?: "lg" | "sm";
}) => {
  const rotation = useMemo(() => getStampRotation(refCode), [refCode]);
  const isLg = size === "lg";

  return (
    <div
      className="sx-stamp relative inline-block max-w-full transition-transform duration-200 hover:rotate-0"
      style={{ ["--stamp-rot" as any]: `${rotation}deg`, transform: `rotate(${rotation}deg)` }}
    >
      <div
        className={isLg ? "rounded-md border-[1.5px] p-[3px]" : "rounded border p-[2px]"}
        style={{ borderColor: `${TOKENS.ink}99` }}
      >
        <div
          className={isLg ? "rounded-[4px] border border-dashed px-4 py-3" : "rounded-[3px] border border-dashed px-3 py-2"}
          style={{
            borderColor: `${TOKENS.ink}55`,
            backgroundColor: "#FFFDF8",
            backgroundImage: `radial-gradient(${TOKENS.ink}20 0.5px, transparent 0.5px)`,
            backgroundSize: "5px 5px",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="flex flex-shrink-0 items-center justify-center rounded-full border"
              style={{ borderColor: TOKENS.ink, width: isLg ? 17 : 14, height: isLg ? 17 : 14 }}
            >
              <Plane
                className={isLg ? "h-2.5 w-2.5" : "h-2 w-2"}
                style={{ color: TOKENS.ink, transform: "rotate(45deg)" }}
              />
            </span>
            <span
              className={`sx-mono whitespace-nowrap font-bold uppercase tracking-[0.16em] ${isLg ? "text-[10px]" : "text-[9px]"}`}
              style={{ color: TOKENS.ink }}
            >
              Official note · SkyXpress Ops
            </span>
          </div>

          <p
            className={`sx-display mt-1.5 font-semibold leading-snug ${isLg ? "text-sm" : "text-xs"}`}
            style={{ color: TOKENS.ink }}
          >
            {note}
          </p>

          <p
            className={`sx-mono mt-1.5 text-right font-medium opacity-60 ${isLg ? "text-[9px]" : "text-[8px]"}`}
            style={{ color: TOKENS.ink }}
          >
            No. {(refCode || "0000").toString().toUpperCase().slice(-4)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const TrackingSection = () => {
  const [trackingQuery, setTrackingQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Country code -> full name lookup, so routes read "Pakistan → United Kingdom"
  // instead of raw codes like "PK → GB"
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase.from("countries").select("code, name");
      if (error) {
        console.error("Error fetching countries:", error);
        return;
      }
      const map: Record<string, string> = {};
      (data || []).forEach((c: { code: string; name: string }) => {
        map[c.code] = c.name;
      });
      setCountryMap(map);
    };
    fetchCountries();
  }, []);

  const getCountryName = (code: string) => {
    if (!code) return "—";
    return countryMap[code] || code;
  };

  const handleTrackParcel = async () => {
    if (!trackingQuery.trim()) {
      toast({
        title: "Please enter tracking ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Search by tracking ID OR reference ID
      const { data: parcelData } = await supabase
        .from("parcels")
        .select("*")
        .or(`tracking_id.eq.${trackingQuery.trim()},reference_id.eq.${trackingQuery.trim()}`)
        .single();

      if (parcelData) {
        // Check if request is approved before showing tracking
        if (parcelData.request_status !== "approved") {
          toast({
            title: "Request Pending",
            description: "This shipment request is still pending approval from admin.",
            variant: "default",
          });
          setTrackingResult(null);
        } else {
          setTrackingResult({
            tracking_id: parcelData.tracking_id,
            reference_id: parcelData.reference_id,
            sender_name: parcelData.sender_name,
            receiver_name: parcelData.receiver_name,
            current_status: parcelData.shipping_status || parcelData.current_status,
            from_country: parcelData.from_country,
            to_country: parcelData.to_country,
            status_timeline: parcelData.status_timeline || [],
            live_route: parcelData.live_route || false,
            route_checkpoints: parcelData.route_checkpoints || [],
            admin_note:
              parcelData.admin_note ||
              parcelData.staff_note ||
              parcelData.internal_note ||
              parcelData.notes ||
              null,
          });

          toast({
            title: "Parcel found!",
            description: `Status: ${parcelData.shipping_status || parcelData.current_status}`,
          });
        }
      } else {
        toast({
          title: "Parcel not found",
          description: "Please check your tracking ID and try again.",
          variant: "destructive",
        });
        setTrackingResult(null);
      }
    } catch (error) {
      console.error("Tracking error:", error);
      toast({
        title: "Error",
        description: "Unable to track parcel. Please try again.",
        variant: "destructive",
      });
      setTrackingResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isCancelled = trackingResult?.current_status === "cancelled";
  const stageIndex = trackingResult && !isCancelled ? getStageIndex(trackingResult.current_status) : 0;
  const isDelivered = !isCancelled && stageIndex === STAGES.length - 1;
  const progressPercent = STAGES.length > 1 ? (stageIndex / (STAGES.length - 1)) * 100 : 0;

  const barcodeBars = useMemo(
    () => getBarcodeBars(trackingResult?.tracking_id || ""),
    [trackingResult?.tracking_id]
  );
  const pnr = (trackingResult?.reference_id || trackingResult?.tracking_id || "——————")
    .toString()
    .toUpperCase()
    .slice(-6);

  const StatusChipIcon = isCancelled ? XCircle : STAGES[stageIndex]?.icon || Clock;
  const statusChipColor = isCancelled ? TOKENS.red : isDelivered ? TOKENS.green : TOKENS.orange;

  return (
    <section className="relative overflow-hidden bg-[#F5F8FC] py-20">
      {/* Local type + motion primitives for the boarding-pass identity */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .sx-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        .sx-mono { font-family: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace; }
        @keyframes sx-flicker { 0%, 92%, 100% { opacity: 1; } 94% { opacity: 0.35; } 96% { opacity: 0.85; } }
        .sx-flicker { animation: sx-flicker 3.2s infinite; }
        @keyframes sx-glide { 0% { transform: translate(-50%, 0) rotate(90deg); } 100% { transform: translate(-50%, -3px) rotate(90deg); } }
        .sx-glide { animation: sx-glide 1.6s ease-in-out infinite alternate; }
        @keyframes sx-beacon { 0%, 100% { opacity: 0.35; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
        .sx-beacon { animation: sx-beacon 1.8s ease-in-out infinite; }
        @keyframes sx-radar-spin { to { transform: rotate(360deg); } }
        .sx-radar::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 9999px;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(23,166,115,0.55) 70deg, transparent 100deg);
          animation: sx-radar-spin 2.4s linear infinite;
        }
        @keyframes sx-stamp-press {
          0% { opacity: 0; transform: scale(1.25) rotate(var(--stamp-rot)); }
          60% { opacity: 1; transform: scale(0.95) rotate(var(--stamp-rot)); }
          100% { opacity: 1; transform: scale(1) rotate(var(--stamp-rot)); }
        }
        .sx-stamp { animation: sx-stamp-press 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .sx-flicker, .sx-glide, .sx-beacon, .sx-radar::before, .sx-stamp { animation: none !important; }
        }
      `}</style>

      {/* Ambient background: faint dashed flight paths */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.3]">
        <svg className="h-full w-full" preserveAspectRatio="none">
          <path d="M -50 120 Q 400 40, 900 160 T 1600 100" fill="none" stroke={TOKENS.blue} strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
          <path d="M -50 520 Q 500 620, 1000 480 T 1700 560" fill="none" stroke={TOKENS.orange} strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* ── Departure board search panel ── */}
          <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B2545] to-[#071A33] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-6 py-3 sm:px-8">
              <span className="sx-beacon h-2 w-2 rounded-full bg-[#FFB020]" />
              <p className="sx-mono text-[11px] font-medium uppercase tracking-[0.25em] text-[#FFB020]/90">
                SkyXpress · Departures &amp; Tracking
              </p>
            </div>

            <div className="px-6 py-10 sm:px-10">
              <h2 className="sx-display sx-flicker text-3xl font-bold text-white sm:text-4xl">
                Where's my parcel<span className="text-[#FF6A1A]">.</span>
              </h2>
              <p className="mt-3 max-w-lg text-sm text-white/60 sm:text-base">
                Enter your Reference ID or Tracking ID, printed on your receipt, to pull up the full boarding pass for your shipment.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    placeholder="e.g. 2119901 or SKX-PK-00417"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    className="sx-mono h-14 rounded-xl border-white/15 bg-white/[0.06] pl-5 pr-12 text-base text-white shadow-none placeholder:text-white/35 focus-visible:border-[#2E86FF] focus-visible:ring-2 focus-visible:ring-[#2E86FF]/40"
                    onKeyPress={(e) => e.key === "Enter" && handleTrackParcel()}
                  />
                  <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                </div>
                <Button
                  onClick={handleTrackParcel}
                  disabled={isLoading}
                  className="h-14 rounded-xl bg-[#FF6A1A] px-8 text-base font-semibold text-white shadow-lg shadow-[#FF6A1A]/20 transition-all duration-200 hover:bg-[#FF6A1A]/90 active:scale-[0.98] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                      Searching
                    </>
                  ) : (
                    <>
                      Track parcel
                      <Search className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Boarding pass result ── */}
          {trackingResult && (
            <div className="relative overflow-visible rounded-[28px] bg-[#FFFFFF] shadow-[0_30px_60px_-15px_rgba(11,37,69,0.25)]">
              {/* Main stub */}
              <div className="relative overflow-hidden rounded-t-[28px] bg-white">
                <div className="flex items-center justify-between bg-[#0B2545] px-6 py-3 sm:px-8">
                  <span className="sx-mono text-[11px] font-medium uppercase tracking-[0.25em] text-white/50">
                    Boarding pass · {isCancelled ? "Cancelled" : "Active shipment"}
                  </span>

                  {/* Gate status chip: icon + label, with a live beacon while the
                      parcel is still moving through the journey. */}
                  <span
                    className="relative inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: statusChipColor }}
                  >
                    <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                      {!isCancelled && !isDelivered && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-white/50 motion-reduce:animate-none" />
                      )}
                      <StatusChipIcon className="relative h-3 w-3" />
                    </span>
                    <span className="sx-mono uppercase tracking-wide">
                      {formatStatusLabel(trackingResult.current_status)}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4 sm:px-10 sm:py-10">
                  {/* FROM */}
                  <div>
                    <p className="sx-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#5B6B82]">From</p>
                    <p className="sx-display sx-mono text-4xl font-bold leading-none text-[#0B2545] sm:text-5xl">
                      {(trackingResult.from_country || "—").slice(0, 3).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-[#5B6B82]">{getCountryName(trackingResult.from_country)}</p>
                  </div>

                  {/* Flight path glyph */}
                  <div className="relative hidden h-10 w-24 sm:flex sm:items-center sm:justify-center">
                    <div className="h-px w-full border-t-2 border-dashed border-[#0B2545]/15" />
                    <Plane className="absolute h-4 w-4 -rotate-0 text-[#FF6A1A]" style={{ transform: "rotate(90deg)" }} />
                  </div>

                  {/* TO */}
                  <div className="sm:text-right">
                    <p className="sx-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#5B6B82]">To</p>
                    <p className="sx-display sx-mono text-4xl font-bold leading-none text-[#0B2545] sm:text-5xl">
                      {(trackingResult.to_country || "—").slice(0, 3).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-[#5B6B82]">{getCountryName(trackingResult.to_country)}</p>
                  </div>
                </div>

                {/* Passenger / parcel fields */}
                <div className="grid grid-cols-2 gap-6 border-t border-dashed border-[#0B2545]/10 px-6 py-6 sm:grid-cols-4 sm:px-10">
                  <div>
                    <p className="sx-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#5B6B82]">Sender</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#0B2545]">{trackingResult.sender_name}</p>
                  </div>
                  <div>
                    <p className="sx-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#5B6B82]">Receiver</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#0B2545]">{trackingResult.receiver_name}</p>
                  </div>
                  <div>
                    <p className="sx-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#5B6B82]">PNR</p>
                    <p className="sx-mono mt-1 text-sm font-semibold text-[#0B2545]">{pnr}</p>
                  </div>
                  <div>
                    <p className="sx-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#5B6B82]">Tracking ID</p>
                    <p className="sx-mono mt-1 truncate text-sm font-semibold text-[#0B2545]">{trackingResult.tracking_id}</p>
                  </div>
                </div>

                {trackingResult.admin_note && (
                  <div className="px-6 pb-6 sm:px-10">
                    <StampNote note={trackingResult.admin_note} refCode={trackingResult.tracking_id} size="lg" />
                  </div>
                )}
              </div>

              {/* Die-cut perforation between stub and boarding strip */}
              <div className="relative h-0">
                <div className="absolute left-[-14px] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#F5F8FC]" />
                <div className="absolute right-[-14px] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#F5F8FC]" />
                <div className="mx-7 border-t-2 border-dashed border-[#0B2545]/15" />
              </div>

              {/* Flight-path progress strip */}
              <div className="rounded-b-[28px] bg-white px-6 pb-10 pt-10 sm:px-10">
                {isCancelled ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-[#E5484D]/20 bg-[#E5484D]/5 p-6">
                    <XCircle className="h-10 w-10 flex-shrink-0 text-[#E5484D]" />
                    <div>
                      <p className="font-semibold text-[#E5484D]">This shipment was cancelled</p>
                      <p className="text-sm text-[#5B6B82]">Contact support if you believe this is a mistake.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-[#0B2545]/10" />
                    <div
                      className="absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-[#2E86FF] to-[#FF6A1A] transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div
                      className="absolute -top-1 -translate-x-1/2 transition-all duration-700 ease-out"
                      style={{ left: `${progressPercent}%` }}
                      aria-hidden
                    >
                      <span className="sx-glide flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#FF6A1A] shadow-[0_4px_14px_rgba(11,37,69,0.25)] ring-2 ring-[#FF6A1A]">
                        <Plane className="h-4 w-4" style={{ transform: "rotate(90deg)" }} />
                      </span>
                    </div>

                    <div className="relative flex justify-between pt-14">
                      {STAGES.map((stage, index) => {
                        const StageIcon = stage.icon;
                        const isDone = index < stageIndex;
                        const isCurrent = index === stageIndex;
                        const isUpcoming = index > stageIndex;

                        return (
                          <div key={stage.key} className="flex w-0 flex-1 flex-col items-center text-center">
                            <div
                              className={[
                                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-colors duration-500",
                                isDone
                                  ? "border-[#17A673] bg-[#17A673] text-white"
                                  : isCurrent
                                  ? "border-[#FF6A1A] bg-white text-[#FF6A1A] shadow-[0_0_0_6px_rgba(255,106,26,0.12)]"
                                  : "border-[#0B2545]/15 bg-white text-[#0B2545]/25",
                              ].join(" ")}
                            >
                              {isDone ? <CheckCircle2 className="h-5 w-5" /> : <StageIcon className="h-4.5 w-4.5" />}
                            </div>
                            <p className="sx-mono mt-2 text-[10px] font-semibold text-[#0B2545]/30">{stage.gate}</p>
                            <p
                              className={[
                                "mt-0.5 max-w-[5.5rem] text-[11px] font-semibold leading-tight sm:text-xs",
                                isUpcoming ? "text-[#5B6B82]/60" : "text-[#0B2545]",
                              ].join(" ")}
                            >
                              {stage.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Barcode footer */}
                <div className="mt-10 flex items-end justify-between gap-4 border-t border-dashed border-[#0B2545]/10 pt-6">
                  <div className="flex h-10 items-end gap-[2px]" aria-hidden>
                    {barcodeBars.slice(0, 46).map((bar) => (
                      <span
                        key={bar.key}
                        className="bg-[#0B2545]"
                        style={{ width: `${bar.width}px`, height: bar.tall ? "100%" : "65%" }}
                      />
                    ))}
                  </div>
                  <p className="sx-mono flex-shrink-0 text-xs text-[#0B2545]/40">
                    {trackingResult.tracking_id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tracking history / flight log ── */}
          {trackingResult && trackingResult.status_timeline.length > 0 && (
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-lg shadow-[#0B2545]/5 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="sx-beacon h-2 w-2 rounded-full bg-[#17A673]" />
                  <h3 className="sx-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                    Flight log
                  </h3>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-[#17A673]/10 px-2.5 py-1">
                  <span className="sx-radar relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#17A673]" />
                  </span>
                  <span className="sx-mono text-[10px] font-semibold uppercase tracking-wide text-[#17A673]">
                    Live
                  </span>
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(groupEventsByDate(trackingResult.status_timeline)).map(([date, events], dateIndex) => (
                  <div
                    key={dateIndex}
                    className="rounded-2xl border border-transparent p-4 transition-colors hover:border-[#0B2545]/8 hover:bg-[#F5F8FC]/60 sm:p-5"
                  >
                    <h4 className="sx-display mb-5 text-base font-bold text-[#0B2545]/80">{date}</h4>

                    <div className="space-y-7 border-l-[3px] border-dotted border-[#0B2545]/25 pl-9">
                      {events.map((event, eventIndex) => {
                        const isLatest = dateIndex === 0 && eventIndex === 0;
                        const place = event.location || event.place || event.city || event.checkpoint;
                        const eventStageIndex = getStageIndex(event.status);
                        const StageIcon = STAGES[eventStageIndex]?.icon || Clock;
                        const dotColor = isLatest ? TOKENS.orange : STAGE_COLORS[eventStageIndex];
                        const eventNote =
                          event.admin_note || event.staff_note || event.internal_note || event.remarks || event.comment;

                        return (
                          <div key={eventIndex} className="relative">
                            <span className="absolute -left-[48px] top-0 flex h-6 w-6 items-center justify-center">
                              {isLatest && (
                                <span className="absolute h-6 w-6 animate-ping rounded-full bg-[#FF6A1A]/40 motion-reduce:animate-none" />
                              )}
                              <span
                                className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: dotColor }}
                              >
                                <StageIcon className="h-3 w-3 text-white" />
                              </span>
                            </span>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              <p className="sx-mono text-xs font-medium text-[#5B6B82]">
                                {new Date(event.timestamp).toLocaleString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </p>

                              {/* Status as a stage-coloured pill instead of plain text,
                                  so the flight log reads at a glance like the gate chip above. */}
                              <span
                                className="sx-mono inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  color: dotColor,
                                  backgroundColor: `${dotColor}14`,
                                  border: `1px solid ${dotColor}40`,
                                }}
                              >
                                {formatStatusLabel(event.status || event.title || "Update")}
                              </span>

                              {isLatest && (
                                <span className="sx-mono animate-pulse rounded-full bg-[#FF6A1A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF6A1A] motion-reduce:animate-none">
                                  Latest
                                </span>
                              )}
                            </div>

                            {place && (
                              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-[#5B6B82]">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#2E86FF]" />
                                <span>{place}</span>
                              </p>
                            )}

                            {event.note && (
                              <p className="mt-1 flex items-start gap-1.5 text-xs text-[#5B6B82]">
                                <MessageSquareText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                {event.note}
                              </p>
                            )}

                            {eventNote && (
                              <div className="mt-2">
                                <StampNote note={eventNote} refCode={`${trackingResult.tracking_id}-${eventIndex}`} size="sm" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
