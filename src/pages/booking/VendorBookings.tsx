import { useState, useMemo, useRef } from "react";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { useGetVendorBookingsQuery } from "@/redux/booking";
import { formatCurrency } from "@/utils/helpers";
import { formatDate, formatDuration, STATUS_CFG } from "./bookingUtils";
import { Input } from "@/components/Inputs/TextInput";
import { IoSearchOutline } from "react-icons/io5";
import VendorBookingsFiltersModal, {
  type VendorBookingsFilterRequest,
} from "@/components/Modal/VendorBookingsFiltersModal";
import VendorBookingDetailPanel from "./VendorBookingDetailPanel";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Settings2,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────────

/** Parse serviceTime ("08:00AM", "14:30", etc.) to minutes since midnight */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const s = timeStr.trim().toUpperCase();
  const match = s.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] ?? "0", 10);
  const period = (match[3] ?? "").toUpperCase();
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function formatTimeRange(startMin: number, durationMin: number): string {
  const sh = Math.floor(startMin / 60);
  const sm = startMin % 60;
  const eh = Math.floor((startMin + durationMin) / 60);
  const em = (startMin + durationMin) % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (h: number, m: number) => {
    const hour = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hour}:${pad(m)}${ampm}`;
  };
  return `${fmt(sh, sm)} - ${fmt(eh, em)}`;
}

const HOUR_HEIGHT_DESKTOP = 64;
const HOUR_HEIGHT_COMPACT = 52;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── constants ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All bookings", status: undefined },
  { label: "Pending", status: "pending" },
  { label: "Fulfilled", status: "completed" },
  { label: "Cancelled", status: "cancelled" },
  { label: "Refunded", status: "refunded" },
] as const;

const EMPTY: Record<string, { title: string; subtitle: string }> = {
  all: { title: "No bookings yet", subtitle: "Customer bookings for your store will appear here." },
  pending: { title: "No pending bookings", subtitle: "Pending booking requests from customers will appear here." },
  completed: { title: "No fulfilled bookings", subtitle: "Fulfilled bookings will be displayed here." },
  cancelled: { title: "No cancelled bookings", subtitle: "Cancelled bookings will appear here." },
  refunded: { title: "No refunded bookings", subtitle: "Refunded bookings will appear here." },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#4C9A2A",
  confirmed: "#4C9A2A",
  ongoing: "#4C9A2A",
  completed: "#4C9A2A",
  rejected: "#FF71AA",
  cancelled: "#FF71AA",
  refunded: "#9CA3AF",
};

// ─── skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="border-b border-[#F5F5F5]">
    {[...Array(5)].map((_, i) => (
      <td key={i} className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
      </td>
    ))}
  </tr>
);

const MobileBookingCardSkeleton = () => (
  <div className="rounded-xl border border-[#EEEEEE] bg-white pl-4 pr-5 py-5 flex gap-4">
    <div className="w-0.5 shrink-0 rounded-full bg-[#E8E8E8] self-stretch min-h-[72px] animate-pulse" />
    <div className="flex-1 min-w-0 space-y-4">
      <div className="flex justify-between gap-4">
        <div className="h-3.5 w-[45%] max-w-[140px] bg-[#F0F0F0] rounded animate-pulse" />
        <div className="h-5 w-16 bg-[#F0F0F0] rounded-md animate-pulse shrink-0" />
      </div>
      <div className="h-3 w-[70%] bg-[#F0F0F0] rounded animate-pulse" />
      <div className="flex gap-8 pt-1">
        <div className="h-3 w-14 bg-[#F0F0F0] rounded animate-pulse" />
        <div className="h-3 w-12 bg-[#F0F0F0] rounded animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── main export ──────────────────────────────────────────────────────────────

type VendorBooking = {
  _id?: string;
  id?: string;
  bookingReference?: string;
  status?: string;
  serviceDate?: string;
  serviceTime?: string;
  contactInfo?: { name?: string };
  customer?: { name?: string };
  items?: Array<{ service?: { name?: string }; totalDuration?: number }>;
  pricing?: { currency?: string; vendorPayout?: number; totalDuration?: number };
  totalDuration?: number;
};

/** Resolve identifier for getBookingByReference (prefer bookingReference, fallback to _id) */
function getBookingRef(b: VendorBooking): string {
  return b.bookingReference ?? b._id ?? b.id ?? "";
}

const baseFilterParams = (filters: VendorBookingsFilterRequest) => ({
  ...(filters.sortBy && { sortBy: filters.sortBy }),
  ...(filters.serviceType && { serviceType: filters.serviceType }),
  ...(filters.minDuration !== undefined && { minDuration: filters.minDuration }),
  ...(filters.maxDuration !== undefined && { maxDuration: filters.maxDuration }),
  ...(filters.minValue !== undefined && { minValue: filters.minValue }),
  ...(filters.maxValue !== undefined && { maxValue: filters.maxValue }),
});

const VendorBookings = () => {
  const isSmUp = useMatchMedia("(min-width: 640px)");
  const hourHeight = isSmUp ? HOUR_HEIGHT_DESKTOP : HOUR_HEIGHT_COMPACT;

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<VendorBookingsFilterRequest>({});
  const [selectedBookingRef, setSelectedBookingRef] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const currentStatus = TABS[activeTab].status;
  const filterParams = baseFilterParams(appliedFilters);

  const listQuery = useGetVendorBookingsQuery(
    {
      ...(currentStatus ? { status: currentStatus } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...filterParams,
      limit: 50,
    },
    { refetchOnMountOrArgChange: true, skip: viewMode === "calendar" },
  );

  const dateStr = selectedDate.toISOString().split("T")[0];
  const calendarQuery = useGetVendorBookingsQuery(
    {
      startDate: dateStr,
      endDate: dateStr,
      ...filterParams,
      limit: 100,
    },
    { refetchOnMountOrArgChange: true, skip: viewMode === "list" },
  );

  const hasActiveFilters = !!(
    appliedFilters.sortBy ||
    appliedFilters.serviceType ||
    appliedFilters.minDuration !== undefined ||
    appliedFilters.maxDuration !== undefined ||
    appliedFilters.minValue !== undefined ||
    appliedFilters.maxValue !== undefined
  );
  const activeFilterCount = [
    appliedFilters.sortBy,
    appliedFilters.serviceType,
    appliedFilters.minDuration !== undefined || appliedFilters.maxDuration !== undefined,
    appliedFilters.minValue !== undefined || appliedFilters.maxValue !== undefined,
  ].filter(Boolean).length;

  const isCalendar = viewMode === "calendar";
  const { data, isLoading, error } = isCalendar ? calendarQuery : listQuery;
  const bookings = useMemo((): VendorBooking[] => data?.bookings ?? [], [data?.bookings]);
  const emptyKey = currentStatus ?? "all";
  const emptyConfig = EMPTY[emptyKey] ?? EMPTY["all"];

  const prevDay = () =>
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      return next;
    });
  const nextDay = () =>
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  const dateLabel = selectedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const calendarBookings = useMemo(() => {
    return bookings
      .filter((b) => b.serviceDate?.startsWith(dateStr))
      .map((b) => {
        const startMin = parseTimeToMinutes(b.serviceTime ?? "");
        const duration = b.pricing?.totalDuration ?? b.totalDuration ?? 60;
        const serviceName =
          (b as { items?: Array<{ service?: { name?: string } }> }).items?.[0]?.service?.name ?? "Booking";
        const barColor = STATUS_COLORS[b.status ?? "pending"] ?? "#4C9A2A";
        return { ...b, startMin, duration, serviceName, barColor };
      })
      .sort((a, b) => a.startMin - b.startMin);
  }, [bookings, dateStr]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = dateStr === now.toISOString().split("T")[0];
  const showNowLine = isToday && nowMinutes >= 0 && nowMinutes < 24 * 60;

  return (
    <div className="min-w-0">
      {/* Header: calendar / list toggle + date (when calendar) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 min-w-0">
        {isCalendar ? (
          <>
            <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-3 min-w-0 flex-wrap">
              <button
                type="button"
                onClick={prevDay}
                className="p-2 rounded-lg hover:bg-gray-100 text-[#101828] transition-colors touch-manipulation shrink-0"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-w-0"
              >
                <span className="text-[13px] sm:text-[14px] font-semibold text-[#101828] truncate">{dateLabel}</span>
                <ChevronDown className="w-4 h-4 text-[#6C6C6C] shrink-0" strokeWidth={2} />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={dateStr}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                aria-hidden
              />
              <button
                type="button"
                onClick={nextDay}
                className="p-2 rounded-lg hover:bg-gray-100 text-[#101828] transition-colors touch-manipulation shrink-0"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="p-2 rounded-lg hover:bg-gray-100 text-[#6C6C6C] transition-colors touch-manipulation"
                aria-label="Switch to list view"
              >
                <List className="w-5 h-5" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersModal(true)}
                className="relative flex items-center gap-2 rounded-full bg-[#FAFAFA] hover:bg-[#F0F0F0] h-9 sm:h-[40px] px-3 sm:px-4 transition-colors touch-manipulation"
                aria-label="Open filters"
              >
                <Settings2 size={16} className={hasActiveFilters ? "text-[#4C9A2A]" : "text-[#3B3B3B]"} strokeWidth={1.8} />
                <span className="text-[12px] sm:text-[13px] font-medium text-[#3B3B3B]">Filter</span>
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#4C9A2A] text-white text-[11px] font-semibold flex items-center justify-center px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-end w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(new Date());
                setViewMode("calendar");
              }}
              className="flex items-center gap-2 p-2 rounded-full bg-[#FAFAFA] hover:bg-[#F0F0F0] cursor-pointer transition-colors touch-manipulation absolute right-4 md:right-8 top-24 md:top-10"
              aria-label="Switch to calendar view"
            >
              <CalendarDays color="#0A0A0A" strokeWidth={1.7} size={20} />
            </button>
          </div>
        )}
      </div>

      {isCalendar ? (
        /* ─── Calendar view ───────────────────────────────────────────────────── */
        <div className="relative rounded-lg sm:rounded-xl border border-[#F0F0F0] overflow-x-auto overflow-y-hidden bg-white min-w-0 -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="flex min-w-[min(100%,520px)] sm:min-w-0" style={{ minHeight: hourHeight * 24 }}>
            {/* Time axis */}
            <div className="w-12 sm:w-16 shrink-0 border-r border-[#F0F0F0] bg-[#FAFAFA]">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-1 sm:pr-2 pt-0.5 text-[10px] sm:text-[12px] font-medium text-[#6C6C6C]"
                  style={{ height: hourHeight }}
                >
                  {h.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Grid + bookings */}
            <div className="flex-1 relative min-w-0">
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-[#F0F0F0]"
                  style={{ height: hourHeight }}
                />
              ))}

              {/* Current time line */}
              {showNowLine && (
                <div
                  className="absolute left-0 right-0 flex items-center z-10"
                  style={{ top: (nowMinutes / 60) * hourHeight - 1 }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}

              {/* Booking cards */}
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse text-[14px] text-[#6C6C6C]">Loading…</div>
                </div>
              ) : (
                calendarBookings.map((b) => {
                  const id = b._id ?? b.id ?? "";
                  const topPx = (b.startMin / 60) * hourHeight + 4;
                  const heightPx = Math.max(isSmUp ? 48 : 40, (b.duration / 60) * hourHeight - 8);
                  const ref = getBookingRef(b);
                  return (
                    <div
                      key={id}
                      role="button"
                      tabIndex={0}
                      onClick={() => ref && setSelectedBookingRef(ref)}
                      onKeyDown={(e) => e.key === "Enter" && ref && setSelectedBookingRef(ref)}
                      className="absolute left-1 right-1 sm:left-2 sm:right-2 rounded-md sm:rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden flex cursor-pointer hover:border-[#4C9A2A] hover:shadow-md transition-all touch-manipulation"
                      style={{ top: topPx, height: heightPx }}
                    >
                      <div
                        className="w-0.5 sm:w-1 shrink-0"
                        style={{ backgroundColor: b.barColor }}
                      />
                      <div className="flex-1 min-w-0 p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-[12px] font-semibold text-[#101828] truncate">
                            {formatTimeRange(b.startMin, b.duration)}
                          </p>
                          <p className="text-[11px] sm:text-[13px] font-medium text-[#374151] truncate leading-tight">{b.serviceName}</p>
                          <p className="text-[10px] sm:text-[11px] text-[#9CA3AF] hidden sm:block">{formatDuration(b.duration)}</p>
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E5E7EB] shrink-0 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold text-[#6C6C6C]">
                          {(b.contactInfo?.name ?? "?")[0]}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {!isLoading && !error && calendarBookings.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
              <p className="text-[15px] sm:text-[16px] font-semibold text-[#101828] mb-1 font-[lora] tracking-tight">No bookings this day</p>
              <p className="text-[12px] sm:text-[13px] text-[#6C6C6C] font-medium">Bookings for {dateLabel} will appear here.</p>
            </div>
          )}
        </div>
      ) : (
        /* ─── List view ──────────────────────────────────────────────────────── */
        <>
          <div className="flex gap-0 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`pb-2 mr-4 sm:mr-8 last:mr-0 text-[13px] sm:text-[14px] font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 touch-manipulation ${
                  activeTab === i
                    ? "border-[#4C9A2A] text-[#101828]"
                    : "border-transparent text-[#6C6C6C] hover:text-[#101828]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mb-4 sm:mb-6 flex flex-row items-center justify-between gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-1 min-w-0 max-w-[360px] sm:max-w-[360px]">
              <IoSearchOutline size={20} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9D9D9D] z-10 pointer-events-none" />
              <Input
                placeholder="Search bookings"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="!w-full !pl-10 !text-[16px] sm:!text-[14px]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFiltersModal(true)}
              className="relative flex items-center justify-center gap-2 rounded-full bg-[#FAFAFA] hover:bg-[#F0F0F0] h-9 sm:h-[40px] px-3 sm:px-4 transition-colors touch-manipulation shrink-0"
              aria-label="Open filters"
            >
              <Settings2 size={16} className={hasActiveFilters ? "text-[#4C9A2A]" : "text-[#3B3B3B]"} strokeWidth={1.8} />
              <span className="text-[12px] sm:text-[13px] font-medium text-[#3B3B3B]">Filter</span>
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#4C9A2A] text-white text-[11px] font-semibold flex items-center justify-center px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: card list — flat rows, small type, generous spacing */}
          <div className="md:hidden space-y-4 min-w-0 -mx-0.5 px-0.5">
            {isLoading && [...Array(5)].map((_, i) => <MobileBookingCardSkeleton key={i} />)}

            {!isLoading && !!error && (
              <div className="rounded-xl border border-[#EEEEEE] bg-white px-6 py-14 text-center">
                <p className="text-[14px] font-medium text-[#101828] font-[lora] mb-3 tracking-tight">Something went wrong</p>
                <p className="text-[12px] text-[#6C6C6C] leading-relaxed max-w-[260px] mx-auto">Unable to load bookings. Please try again.</p>
              </div>
            )}

            {!isLoading && !error && bookings.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E0E0E0] bg-white px-6 py-16 text-center">
                <p className="text-[14px] font-medium text-[#101828] font-[lora] mb-3 tracking-tight">{emptyConfig.title}</p>
                <p className="text-[12px] text-[#6C6C6C] max-w-[272px] mx-auto leading-[1.55]">{emptyConfig.subtitle}</p>
              </div>
            )}

            {!isLoading &&
              !error &&
              bookings.map((b) => {
                const statusCfg = STATUS_CFG[b.status ?? "pending"] ?? STATUS_CFG["pending"];
                const currency = b.pricing?.currency ?? "USD";
                const price = b.pricing?.vendorPayout ?? 0;
                const duration = b.pricing?.totalDuration ?? b.totalDuration ?? 0;
                const id = b._id ?? b.id ?? "";
                const ref = getBookingRef(b);
                const name = b.contactInfo?.name ?? "—";
                const when = `${formatDate(b.serviceDate ?? "")} · ${b.serviceTime ?? "—"}`;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => ref && setSelectedBookingRef(ref)}
                    className="group w-full text-left rounded-xl border border-[#EEEEEE] bg-white pl-4 pr-5 py-5 transition-colors hover:bg-[#FAFAFA] hover:border-[#E5E5E5] active:bg-[#F7F7F7] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9A2A]/25 focus-visible:ring-offset-2 flex gap-4 items-stretch min-w-0"
                  >
                    <span
                      className="w-1 shrink-0 rounded-full self-stretch min-h-[4rem] bg-[#4C9A2A]/85 group-hover:bg-[#4C9A2A]"
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[13px] font-medium text-[#1a1a1a] leading-[1.35] truncate">{name}</p>
                          {b.bookingReference ? (
                            <p className="text-[10px] text-[#9CA3AF] mt-2 leading-none truncate tracking-wide">
                              Ref {b.bookingReference}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium leading-tight ${statusCfg.cls}`}
                          >
                            {statusCfg.label}
                          </span>
                          <ChevronRight
                            className="w-4 h-4 text-[#BDBDBD] group-hover:text-[#9CA3AF] transition-colors"
                            strokeWidth={2}
                            aria-hidden
                          />
                        </div>
                      </div>

                      <p className="text-[12px] text-[#6B6B6B] leading-[1.45] flex items-start gap-2.5">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B0B0B0]" strokeWidth={1.75} aria-hidden />
                        <span>{when}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-1">
                        <div className="min-w-0">
                          <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-[#A3A3A3] mb-1.5">Duration</p>
                          <p className="text-[12px] font-medium text-[#404040] tabular-nums flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-[#B0B0B0]" strokeWidth={1.75} aria-hidden />
                            {formatDuration(duration)}
                          </p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-[#A3A3A3] mb-1.5">Payout</p>
                          <p className="text-[12px] font-medium text-[#1a1a1a] tabular-nums">{formatCurrency(price, currency)}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Tablet/desktop: table */}
          <div className="hidden md:block overflow-x-auto border-y border-[#F0F0F0] min-w-0 rounded-xl">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                  {["Name", "Date", "Duration", "Price", "Status"].map((col) => (
                    <th key={col} className="px-6 py-4 text-left text-[14px] font-semibold text-[#0A0A0A]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

                {!isLoading && !!error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <p className="text-[18px] font-semibold text-[#101828] font-[lora] mb-2">Something went wrong</p>
                      <p className="text-[14px] text-[#6C6C6C]">Unable to load bookings. Please try again.</p>
                    </td>
                  </tr>
                )}

                {!isLoading && !error && bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <p className="text-[18px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight">{emptyConfig.title}</p>
                      <p className="text-[14px] text-[#6C6C6C] max-w-xs mx-auto font-medium">{emptyConfig.subtitle}</p>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  !error &&
                  bookings.map((b) => {
                    const statusCfg = STATUS_CFG[b.status ?? "pending"] ?? STATUS_CFG["pending"];
                    const currency = b.pricing?.currency ?? "USD";
                    const price = b.pricing?.vendorPayout ?? 0;
                    const duration = b.pricing?.totalDuration ?? b.totalDuration ?? 0;
                    const id = b._id ?? b.id ?? "";

                    const ref = getBookingRef(b);
                    return (
                      <tr
                        key={id}
                        role="button"
                        tabIndex={0}
                        onClick={() => ref && setSelectedBookingRef(ref)}
                        onKeyDown={(e) => e.key === "Enter" && ref && setSelectedBookingRef(ref)}
                        className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-[14px] font-medium text-[#3B3B3B]">
                          {b.contactInfo?.name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#3B3B3B] font-medium whitespace-nowrap">
                          {formatDate(b.serviceDate ?? "")} <span className="text-[#3B3B3B]">·</span> {b.serviceTime ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#3B3B3B] font-medium whitespace-nowrap">{formatDuration(duration)}</td>
                        <td className="px-6 py-4 text-[14px] text-[#3B3B3B] font-medium whitespace-nowrap">
                          {formatCurrency(price, currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <VendorBookingsFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={(f) => {
          setAppliedFilters(f);
          setShowFiltersModal(false);
        }}
        currentFilters={appliedFilters}
      />

      {selectedBookingRef && (
        <VendorBookingDetailPanel
          bookingReference={selectedBookingRef}
          onClose={() => setSelectedBookingRef(null)}
        />
      )}
    </div>
  );
};

export default VendorBookings;
