import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { X, MapPin, CheckCircle2, Circle, CalendarDays, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import {
  useGetUserBookingsQuery,
  useGetBookingByReferenceQuery,
  useCancelBookingMutation,
  useCustomerPresentBookingMutation,
  type Booking,
} from "@/redux/booking";
import {
  STORE_CHECKIN_RADIUS_METERS,
  extractLatLngFromLocation,
  haversineDistanceMeters,
  getCurrentPosition,
  isServiceDateToday,
} from "@/utils/bookingGeo";
import {
  setStoreContext,
  addOrUpdateItem,
  type BookingItem,
} from "@/redux/booking/bookingSlice";
import { formatCurrency } from "@/utils/helpers";
import {
  formatDate,
  formatDuration,
  STAGE_TEXT,
  STAGE_PROGRESS,
  buildTimeline,
} from "./bookingUtils";
import { Button } from "@/components/Buttons";

// ─── constants ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All bookings", status: undefined    },
  { label: "Pending",      status: "pending"    },
  { label: "Ongoing",      status: "ongoing"    },
  { label: "Completed",    status: "completed"  },
  { label: "Rejected",     status: "rejected"   },
] as const;

const EMPTY: Record<string, { title: string; subtitle: string }> = {
  all:       { title: "No bookings yet",        subtitle: "Your bookings will appear here once you schedule your first service." },
  pending:   { title: "No pending bookings",    subtitle: "Your booking requests will appear here once you schedule a service." },
  ongoing:   { title: "No ongoing bookings",    subtitle: "Bookings currently in progress will show up here."                   },
  completed: { title: "No completed bookings",  subtitle: "Your booking history will be displayed here."                       },
  rejected:  { title: "No rejected bookings",   subtitle: "Cancelled or rejected bookings will appear here."                   },
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  normal:   "Normal service",
  home:     "Home service",
  pickDrop: "Pick & drop service",
};

// ─── booking card ─────────────────────────────────────────────────────────────

const BookingCard = ({
  booking,
  isSelected,
  onClick,
  onRebook,
}: {
  booking: Booking;
  isSelected: boolean;
  onClick: () => void;
  onRebook?: (booking: Booking) => void;
}) => {
  const showProgressBar = !["pending", "completed", "rejected", "cancelled"].includes(booking.bookingStage);
  const progress = STAGE_PROGRESS[booking.bookingStage] ?? 0;
  const stageLabel = STAGE_TEXT[booking.bookingStage] ?? "";
  const showRebookButton = booking.status === "completed" && !!onRebook;

  const statusTextMap: Record<string, { text: string; color: string }> = {
    pending:   { text: "Awaiting confirmation", color: "text-[#C49A00]" },
    completed: { text: "Completed",             color: "text-[#2E7D32]" },
    rejected:  { text: "Rejected",              color: "text-[#C62828]" },
    cancelled: { text: "Cancelled",             color: "text-[#C62828]" },
  };
  const simpleStatus = statusTextMap[booking.status];
  const showSimpleStatus = !!simpleStatus && !showProgressBar;

  return (
    <div
      onClick={onClick}
      className={`flex flex-row items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 cursor-pointer border-b border-[#F5F5F5] transition-colors touch-manipulation ${
        isSelected ? "bg-[#F2FFEC]" : "hover:bg-[#FAFAFA] active:bg-[#F5F5F5]"
      }`}
    >
      <div className="flex gap-2 sm:gap-3 flex-1 min-w-0 items-start">
        <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-[#F0F0F0]">
          {booking.store?.bannerImageUrl ? (
            <img src={booking.store.bannerImageUrl} alt={booking.store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#0A0A0A] text-lg sm:text-xl font-bold">
              {booking.store?.name?.charAt(0) ?? "?"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] sm:text-[14px] font-semibold text-[#0A0A0A] truncate">{booking.store?.name}</p>
          <p className="text-[12px] sm:text-[13px] text-[#6C6C6C] mt-0.5 mb-2 sm:mb-4 font-medium leading-snug">
            {formatDate(booking.serviceDate)} ·
            {' ' + booking.serviceTime}
            {showProgressBar && stageLabel ? ` · ${stageLabel}` : ""}
          </p>
          {showProgressBar && (
            <div className="mt-2 h-1.5 w-full max-w-[10rem] sm:w-40 sm:max-w-none bg-[#F0F0F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#4C9A2A] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {showSimpleStatus && (
            <p className={`text-[12px] sm:text-[13px] mt-1 font-medium ${simpleStatus.color}`}>{simpleStatus.text}</p>
          )}
        </div>
      </div>

      {showRebookButton && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRebook?.(booking);
          }}
          className="shrink-0 ml-1 px-3 sm:px-4 py-2 rounded-full text-[12px] sm:text-[13px] font-semibold text-[#101828] bg-[#F0F0F0] hover:bg-[#E5E5E5] transition-colors"
        >
          Rebook
        </button>
      )}
    </div>
  );
};

// ─── detail panel ─────────────────────────────────────────────────────────────

const DetailPanel = ({
  bookingReference,
  onClose,
}: {
  bookingReference: string;
  onClose: () => void;
}) => {
  const { data, isLoading } = useGetBookingByReferenceQuery(bookingReference, { skip: !bookingReference });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [customerPresentMutation, { isLoading: isUpdatingPresence }] = useCustomerPresentBookingMutation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [geoWorking, setGeoWorking] = useState(false);
  const booking = data?.data?.booking;

  const storeCoords = booking ? extractLatLngFromLocation(booking.store?.location) : null;
  const customerCheckInEligible =
    !!booking &&
    !["completed", "cancelled", "rejected", "refunded", "pending"].includes(booking.status) &&
    isServiceDateToday(booking.serviceDate);

  const handleImHere = async () => {
    if (!booking || !storeCoords) return;
    setGeoWorking(true);
    try {
      const pos = await getCurrentPosition();
      const d = haversineDistanceMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        storeCoords.lat,
        storeCoords.lng
      );
      if (d > STORE_CHECKIN_RADIUS_METERS) {
        toast.error(
          `Check-in only works within ${STORE_CHECKIN_RADIUS_METERS}m of the store. You appear to be about ${Math.round(d)}m away.`
        );
        return;
      }
      await customerPresentMutation({
        reference: booking.bookingReference,
        customerPresent: true,
      }).unwrap();
      toast.success("You're checked in at the store");
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; code?: number; message?: string };
      if (err?.code === 1) {
        toast.error("Location permission is needed to verify you're at the store.");
      } else {
        toast.error(err?.data?.message ?? err?.message ?? "Could not check in");
      }
    } finally {
      setGeoWorking(false);
    }
  };

  const handleUndoCheckIn = async () => {
    if (!booking) return;
    try {
      await customerPresentMutation({
        reference: booking.bookingReference,
        customerPresent: false,
      }).unwrap();
      toast.success("Check-in cleared");
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? "Could not update check-in");
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    try {
      await cancelBooking({ bookingId: booking.bookingReference, reason: "No longer needed" }).unwrap();
      toast.success("Booking cancelled successfully");
      setShowCancelConfirm(false);
      onClose();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to cancel booking");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Side drawer - full width on small screens, capped on larger */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-full sm:max-w-[420px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)] flex flex-col pt-[env(safe-area-inset-top,0px)]">
        {/* Header - sticky */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b border-[#F0F0F0] bg-white">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <>
              <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-3.5 w-56 bg-gray-100 rounded animate-pulse" />
            </>
          ) : booking ? (
            <>
              <p className="text-[15px] sm:text-[17px] font-bold text-[#101828] leading-tight truncate">{booking.store?.name}</p>
              <p className="text-[13px] text-[#6C6C6C] mt-0.5 font-medium">{STAGE_TEXT[booking.bookingStage] ?? booking.bookingStage}</p>
            </>
          ) : null}
        </div>
        <button type="button" onClick={onClose} className="ml-2 sm:ml-4 p-2 rounded-lg hover:bg-gray-100 text-[#6C6C6C] transition-colors shrink-0 touch-manipulation" aria-label="Close">
          <X className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      {isLoading && (
        <div className="px-4 sm:px-6 space-y-3 py-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && booking && (() => {
        const steps = buildTimeline(booking);
        return (
          <>
            {/* Timeline */}
            <div className="px-4 sm:px-6 py-2 border-t border-[#F0F0F0]">
              {steps.map((step, i) => {
                const dotCls = step.isRejected || step.isCancelled
                  ? "bg-red-500"
                  : step.completed
                  ? "bg-[#4C9A2A]"
                  : "bg-transparent border-2 border-[#D0D5DD]";
                const lineCls = step.completed
                  ? (step.isRejected || step.isCancelled ? "bg-red-400" : "bg-[#4C9A2A]")
                  : "bg-[#E5E7EB]";
                const labelCls = step.isRejected || step.isCancelled
                  ? "text-red-600"
                  : step.completed
                  ? "text-[#4C9A2A]"
                  : "text-[#101828]";

                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center w-5 shrink-0">
                      {i !== 0 && <div className={`w-0.5 flex-1 min-h-[8px] ${lineCls}`} />}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${dotCls}`}>
                        {step.completed && (
                          step.isRejected || step.isCancelled
                            ? <X className="w-3 h-3 text-white" strokeWidth={2.5} />
                            : <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={0} fill="#4C9A2A" />
                        )}
                        {!step.completed && <Circle className="w-5 h-5 text-[#D0D5DD]" strokeWidth={1.5} />}
                      </div>
                      {i !== steps.length - 1 && <div className={`w-0.5 flex-1 min-h-[8px] ${lineCls}`} />}
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-start pb-4 pt-1 min-w-0">
                      <div className="min-w-0">
                        <p className={`text-[12px] sm:text-[13px] font-semibold ${labelCls}`}>{step.label}</p>
                        <p className={`text-[11px] sm:text-[12px] font-medium mt-0.5 ${step.completed ? "text-[#6C6C6C]" : "text-[#9CA3AF]"}`}>{step.subtitle}</p>
                      </div>
                      {step.date && (
                        <p className="text-[11px] text-[#9CA3AF] font-medium shrink-0 sm:ml-2 mt-0.5 sm:mt-0.5">
                          {new Date(step.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day-of: "I'm here" — API only called when within 100m of store */}
            {customerCheckInEligible && (
              <div className="px-4 sm:px-6 py-4 border-t border-[#F0F0F0]">
                <p className="text-[13px] font-medium text-[#101828] mb-2">At the store?</p>
                {booking.customerPresent ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#E8F5E9] text-[#2E7D32] w-fit">
                      You&apos;re checked in
                    </span>
                    <Button
                      type="button"
                      variant="cancel"
                      size="auto"
                      className="!px-3 !py-2 !text-xs sm:!text-sm w-full sm:w-auto"
                      disabled={isUpdatingPresence}
                      loading={isUpdatingPresence}
                      onClick={handleUndoCheckIn}
                    >
                      Undo check-in
                    </Button>
                  </div>
                ) : storeCoords ? (
                  <>
                    <p className="text-[11px] sm:text-[12px] text-[#6C6C6C] font-medium mb-3 leading-snug">
                      Tap when you arrive. We&apos;ll confirm you&apos;re within {STORE_CHECKIN_RADIUS_METERS}m of the store (location required).
                    </p>
                    <Button
                      type="button"
                      className="w-full sm:w-auto min-h-[44px]"
                      disabled={geoWorking || isUpdatingPresence}
                      loading={geoWorking || isUpdatingPresence}
                      onClick={handleImHere}
                    >
                      I&apos;m here
                    </Button>
                  </>
                ) : (
                  <p className="text-[11px] sm:text-[12px] text-[#9CA3AF] font-medium leading-snug">
                    Map check-in isn&apos;t available until this store has coordinates on file. You can still attend your appointment as normal.
                  </p>
                )}
              </div>
            )}

            {/* Service type + date + cancel */}
            <div className="px-4 sm:px-6 py-4 border-t border-[#F0F0F0] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#101828] mb-2">
                  {SERVICE_TYPE_LABEL[booking.serviceType] ?? booking.serviceType}
                </p>
                <div className="flex items-start gap-1.5 mb-2">
                  <CalendarDays className="w-3.5 h-3.5 text-[#FF71AA] mt-0.5 shrink-0" strokeWidth={2} />
                  <p className="text-[12px] text-[#6C6C6C] font-medium break-words">
                    {formatDate(booking.serviceDate)} · {booking.serviceTime}
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF71AA] mt-0.5 shrink-0" strokeWidth={2} />
                  <p className="text-[12px] text-[#6C6C6C] font-medium break-words">
                    {booking.homeServiceAddress
                      ? `${booking.homeServiceAddress.apartment ? `${booking.homeServiceAddress.apartment}, ` : ""}${booking.homeServiceAddress.address}, ${booking.homeServiceAddress.city}`
                      : `${(booking.store?.location as { address?: string; city?: string })?.address ?? ""}, ${(booking.store?.location as { address?: string; city?: string })?.city ?? ""}`.replace(/^,\s*|,\s*$/g, "").trim() || "—"}
                  </p>
                </div>
              </div>
              {["pending", "confirmed"].includes(booking.status) && (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-full text-[13px] font-semibold text-[#940803] bg-[#FFF0F0] hover:bg-red-50 transition-colors touch-manipulation self-start sm:self-start"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Service Address (for home service) */}
            {booking.homeServiceAddress && (
              <div className="px-4 sm:px-6 py-4 border-t border-[#F0F0F0]">
                <p className="text-[13px] font-medium text-[#101828] mb-2">Service Address</p>
                <p className="text-[12px] text-[#6C6C6C] font-medium">
                  {booking.homeServiceAddress.apartment && `${booking.homeServiceAddress.apartment}, `}
                  {booking.homeServiceAddress.address}, {booking.homeServiceAddress.city}.
                </p>
                {booking.homeServiceAddress.additionalDirections && (
                  <p className="text-[12px] text-[#6C6C6C] font-medium mt-2">
                    {booking.homeServiceAddress.additionalDirections}
                  </p>
                )}
              </div>
            )}

            {/* Service items */}
            <div className="px-4 sm:px-6 py-4 border-t border-[#F0F0F0]">
              <p className="text-[13px] font-medium text-[#101828] mb-3">Service details</p>
              <div className="space-y-3">
                {booking.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {item.service.imageUrl ? (
                      <img src={item.service.imageUrl} alt={item.service.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] shrink-0 flex items-center justify-center text-[#9CA3AF] text-xs font-bold">
                        {item.service.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#101828] truncate">{item.service.name}</p>
                      <p className="text-[12px] text-[#9CA3AF] font-medium">{formatDuration(item.service.durationInMinutes)}</p>
                    </div>
                    <p className="text-[13px] font-semibold text-[#101828] shrink-0">
                      {formatCurrency(item.service.price * item.quantity, item.service.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information accordion */}
            {(booking.additionalInfo?.notes || (booking.additionalInfo?.images && booking.additionalInfo.images.length > 0)) && (
              <div className="px-4 sm:px-6 py-4 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => setIsAdditionalInfoExpanded((v) => !v)}
                  className="w-full flex items-center justify-between py-1"
                >
                  <p className="text-[13px] font-medium text-[#101828]">Additional Information</p>
                  <ChevronDown
                    className={`w-4 h-4 text-[#101828] transition-transform ${isAdditionalInfoExpanded ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                {isAdditionalInfoExpanded && (
                  <div className="pt-3 space-y-3">
                    {booking.additionalInfo?.notes && (
                      <p className="text-[12px] text-[#6C6C6C] font-medium">{booking.additionalInfo.notes}</p>
                    )}
                    {booking.additionalInfo?.images && booking.additionalInfo.images.length > 0 && (
                      <div className={`grid grid-cols-2 gap-2 ${booking.additionalInfo?.notes ? "mt-4" : ""}`}>
                        {booking.additionalInfo.images.map((imageUrl, idx) => (
                          <img key={idx} src={imageUrl} alt="" className="w-full aspect-square rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pricing summary */}
            <div className="px-4 sm:px-6 py-4 border-t border-[#F0F0F0] space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-between gap-3 text-[12px] sm:text-[13px]">
                <span className="text-[#6C6C6C] font-medium">
                  Subtotal ({booking.items?.length ?? 0} {(booking.items?.length ?? 0) !== 1 ? "Items" : "Item"})
                </span>
                <span className="font-semibold text-[#101828]">
                  {formatCurrency(booking.pricing?.subtotal ?? 0, booking.pricing?.currency ?? "USD")}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[12px] sm:text-[13px]">
                <span className="text-[#6C6C6C] font-medium">Total Duration</span>
                <span className="font-semibold text-[#101828]">
                  {formatDuration(booking.pricing?.totalDuration ?? 0)}
                </span>
              </div>
              {(booking.pricing?.remainingBalance ?? 0) > 0 && (
                <div className="flex justify-between gap-3 text-[12px] sm:text-[13px]">
                  <span className="text-[#6C6C6C] font-medium">Remaining Balance</span>
                  <span className="font-semibold text-[#C49A00]">
                    {formatCurrency(booking.pricing.remainingBalance, booking.pricing.currency ?? "USD")}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-3 text-[12px] sm:text-[13px]">
                <span className="text-[#6C6C6C] font-medium">Taxes</span>
                <span className="font-semibold text-[#101828]">
                  {formatCurrency(0, booking.pricing?.currency ?? "USD")}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[12px] sm:text-[13px] pt-2 border-t border-[#F0F0F0]">
                <span className="font-semibold text-[#101828]">Total Paid</span>
                <span className="font-semibold text-[#101828]">
                  {formatCurrency(booking.pricing?.amountPaid ?? 0, booking.pricing?.currency ?? "USD")}
                </span>
              </div>
            </div>
          </>
        );
      })()}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 px-3 sm:px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-4 pt-8 sm:pt-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-[1.05rem] sm:text-[17px] font-bold text-[#101828] font-[lora] mb-2">Cancel booking?</h3>
            <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] mb-5 sm:mb-6 font-medium leading-snug">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button variant="cancel" className="flex-1 min-h-[44px]" onClick={() => setShowCancelConfirm(false)}>Reschedule Instead</Button>
              <Button variant="destructive" className="flex-1 min-h-[44px]" disabled={isCancelling} onClick={handleCancel} loading={isCancelling}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

// ─── main export ──────────────────────────────────────────────────────────────

/** Bookings with progress bar = ongoing (confirmed, readyToServe, inProgress, etc.) */
const isOngoing = (b: Booking) =>
  !["pending", "completed", "rejected", "cancelled"].includes(b.bookingStage ?? "");

const CustomerBookings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const handleRebook = (booking: Booking) => {
    if (!booking.store?.id || !booking.items?.length) return;
    dispatch(setStoreContext({
      storeId: booking.store.id,
      storeName: booking.store.name,
      storeBannerImageUrl: booking.store.bannerImageUrl,
    }));
    booking.items.forEach((item) => {
      const bookingItem: BookingItem = {
        serviceId: item.service.id,
        name: item.service.name,
        description: item.service.description,
        pricingType: (item.service.pricingType ?? "fixed") as "fixed" | "free" | "from",
        price: item.service.price,
        currency: item.service.currency as "NGN" | "USD" | "GBP",
        durationInMinutes: item.service.durationInMinutes,
        imageUrl: item.service.imageUrl,
        addOns: (item.addOns ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          description: undefined,
          price: a.price,
          durationInMinutes: a.durationInMinutes,
        })),
        quantity: item.quantity,
      };
      dispatch(addOrUpdateItem(bookingItem));
    });
    setSelectedRef(null);
    navigate(`/store/${booking.store.id}`);
  };

  const currentStatus = TABS[activeTab].status;
  // For "ongoing" we fetch all and filter client-side (API may not support status=ongoing)
  const { data, isLoading, error } = useGetUserBookingsQuery(
    {
      ...(currentStatus && currentStatus !== "ongoing" ? { status: currentStatus } : {}),
      limit: 50,
    },
    { refetchOnMountOrArgChange: true },
  );

  const rawBookings: Booking[] = data?.data?.bookings ?? [];
  const bookings =
    currentStatus === "ongoing"
      ? rawBookings.filter(isOngoing)
      : rawBookings;
  const emptyConfig = EMPTY[currentStatus ?? "all"] ?? EMPTY["all"];

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100dvh-5rem)] md:max-h-[calc(100dvh-4.5rem)] overflow-hidden">
      {/* List panel */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 min-h-0">
        {/* Tabs — horizontal scroll on narrow screens */}
        <div className="flex overflow-x-auto overflow-y-hidden scrollbar-hide gap-6 sm:gap-8 shrink-0 my-3 sm:my-4 px-3 sm:px-4 touch-pan-x pb-0.5">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => { setActiveTab(i); setSelectedRef(null); }}
              className={`pb-1.5 shrink-0 text-[13px] sm:text-[14px] font-semibold border-b-2 outline-none focus:outline-none focus:ring-0 transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === i
                  ? "border-[#4C9A2A] text-[#343226]"
                  : "border-transparent text-[#9D9D9D] hover:text-[#101828]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {isLoading && [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 border-b border-[#F5F5F5]">
              <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-lg sm:rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/5" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-2/5" />
                <div className="h-1.5 bg-gray-100 rounded-full animate-pulse w-40" />
              </div>
            </div>
          ))}

          {!isLoading && !!error && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 sm:px-8 text-center">
              <p className="text-[1rem] sm:text-lg font-semibold text-[#101828] font-[lora] mb-2">Something went wrong</p>
              <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] max-w-sm">Unable to load bookings. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && bookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 sm:px-8 text-center mt-8 sm:mt-24">
              <p className="text-[1.05rem] sm:text-[19px] tracking-tight font-semibold text-[#101828] font-[lora] mb-2 px-2">{emptyConfig.title}</p>
              <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] max-w-xs font-medium leading-snug">{emptyConfig.subtitle}</p>
            </div>
          )}

          {!isLoading && !error && bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              isSelected={selectedRef === booking.bookingReference}
              onClick={() => setSelectedRef(
                selectedRef === booking.bookingReference ? null : booking.bookingReference
              )}
              onRebook={handleRebook}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedRef && (
        <DetailPanel
          bookingReference={selectedRef}
          onClose={() => setSelectedRef(null)}
        />
      )}
    </div>
  );
};

export default CustomerBookings;
