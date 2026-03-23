import { useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  MessageCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetBookingByReferenceQuery,
  useConfirmBookingMutation,
  useUpdateBookingStageMutation,
  useCompleteBookingVendorMutation,
  useRejectBookingMutation,
  useProviderBookingUpdateMutation,
} from "@/redux/booking";
import { useCreateChatMutation } from "@/redux/chat";
import { formatCurrency } from "@/utils/helpers";
import { formatDate, formatDuration, buildTimeline } from "./bookingUtils";
import { Button } from "@/components/Buttons";
import { toast } from "react-toastify";
import type { Booking } from "@/redux/booking";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  normal: "Normal service",
  home: "Home service",
  pickDrop: "Drop-off & pick-up",
};

const STAGE_LABEL: Record<string, string> = {
  pending: "New booking",
  confirmed: "Confirmed",
  readyToServe: "Ready to serve",
  vendorEnroute: "Provider on the way",
  vendorArrived: "Provider arrived",
  itemReceived: "Item received",
  inProgress: "Service in progress",
  readyForPickup: "Ready for pickup",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STAGE_COLOR: Record<string, { text: string; bg: string }> = {
  pending: { text: "#8A6703", bg: "#FFF8E6" },
  completed: { text: "#3D7B22", bg: "#EBFEE3" },
  cancelled: { text: "#BB0A0A", bg: "#FFF0F0" },
  rejected: { text: "#BB0A0A", bg: "#FFF0F0" },
  confirmed: { text: "#2196F3", bg: "#E3F2FD" },
  readyToServe: { text: "#8A6703", bg: "#FFF8E6" },
  vendorEnroute: { text: "#8A6703", bg: "#FFF8E6" },
  vendorArrived: { text: "#8A6703", bg: "#FFF8E6" },
  itemReceived: { text: "#8A6703", bg: "#FFF8E6" },
  inProgress: { text: "#8A6703", bg: "#FFF8E6" },
  readyForPickup: { text: "#8A6703", bg: "#FFF8E6" },
};

// Extended booking for pickDrop addresses
type BookingWithPickDrop = Booking & {
  pickupInfo?: { address?: { address?: string; city?: string; postalCode?: string } };
  dropoffInfo?: { address?: { address?: string; city?: string; postalCode?: string } };
};

function formatTimeRange(startTime: string, durationMinutes: number): string {
  if (!startTime) return "Not set";
  const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return startTime;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = (match[3] ?? "").toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const totalMinutes = hours * 60 + minutes + (durationMinutes ?? 0);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const endPeriod = endHours >= 12 ? " PM" : " AM";
  const endHours12 = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
  const formattedEnd = `${endHours12}:${endMinutes.toString().padStart(2, "0")}${endPeriod}`;
  return `${startTime} - ${formattedEnd}`;
}

interface VendorBookingDetailPanelProps {
  bookingReference: string;
  onClose: () => void;
}

const VendorBookingDetailPanel = ({ bookingReference, onClose }: VendorBookingDetailPanelProps) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetBookingByReferenceQuery(bookingReference, {
    skip: !bookingReference,
    refetchOnMountOrArgChange: true,
  });
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingProviderFlag, setPendingProviderFlag] = useState<"late" | "noshow" | null>(null);

  const [confirmBooking, { isLoading: isConfirming }] = useConfirmBookingMutation();
  const [updateBookingStage, { isLoading: isUpdatingStage }] = useUpdateBookingStageMutation();
  const [completeBookingVendor, { isLoading: isCompleting }] = useCompleteBookingVendorMutation();
  const [rejectBooking, { isLoading: isRejecting }] = useRejectBookingMutation();
  const [providerBookingUpdate, { isLoading: isSavingProviderUpdate }] = useProviderBookingUpdateMutation();
  const [createChat, { isLoading: isCreatingChat }] = useCreateChatMutation();

  const booking = data?.data?.booking as BookingWithPickDrop | undefined;
  const stage = booking?.bookingStage ?? "pending";
  const stageCfg = STAGE_COLOR[stage] ?? { text: "#6C6C6C", bg: "#F5F5F5" };
  const getStageLabel = (s: string) => STAGE_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

  const handleAccept = async () => {
    try {
      await confirmBooking(bookingReference).unwrap();
      toast.success("Booking accepted successfully");
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to accept booking");
    }
  };

  const handleUpdateStage = async (s: string, msg: string) => {
    try {
      await updateBookingStage({ reference: bookingReference, stage: s }).unwrap();
      toast.success(msg);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to update");
    }
  };

  const handleComplete = async () => {
    try {
      await completeBookingVendor(bookingReference).unwrap();
      toast.success("Booking marked as completed");
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to complete");
    }
  };

  const handleReject = async () => {
    try {
      await rejectBooking({ reference: bookingReference, reason: "Service not available" }).unwrap();
      toast.success("Booking rejected successfully");
      setRejectModalVisible(false);
      onClose();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to reject");
    }
  };

  const handleMessage = async () => {
    if (!booking) return;
    try {
      const result = await createChat({
        participants: [booking.user],
        type: "booking",
        bookingId: booking._id,
        storeId: booking.store?.id ?? "",
        title: `Booking Discussion - ${bookingReference}`,
      }).unwrap();
      const chatId = result.chat?.chatId ?? result.chat?.id ?? "";
      onClose();
      navigate("/inbox", { state: { openChatId: chatId } });
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to create chat");
    }
  };

  const currency = booking?.pricing?.currency ?? "USD";

  const terminalBooking =
    !!booking &&
    (["cancelled", "rejected", "refunded", "completed"].includes(booking.status) ||
      booking.bookingStage === "completed");
  const canSetProviderUpdate =
    !!booking &&
    !terminalBooking &&
    booking.status !== "pending" &&
    !booking.providerUpdate;

  const handleProviderUpdate = async (providerUpdate: "late" | "noshow") => {
    setPendingProviderFlag(providerUpdate);
    try {
      await providerBookingUpdate({ reference: bookingReference, providerUpdate }).unwrap();
      toast.success(providerUpdate === "late" ? "Marked as late" : "Marked as no-show");
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Could not save update");
    } finally {
      setPendingProviderFlag(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-[420px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)] flex flex-col min-w-0 pt-[env(safe-area-inset-top,0px)]"
        role="dialog"
        aria-modal="true"
        aria-label="Booking details"
      >
        <div className="flex items-start justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 shrink-0 border-b border-[#F0F0F0] bg-white gap-3">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-3.5 w-56 bg-gray-100 rounded animate-pulse" />
              </>
            ) : booking ? (
              <>
                <p className="text-[15px] sm:text-[17px] font-semibold text-[#101828] leading-tight truncate">
                  {booking.contactInfo?.name ?? "Customer"}
                </p>
                <p className="text-[12px] sm:text-[13px] text-[#6C6C6C] mt-0.5 font-medium truncate">#{bookingReference}</p>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-[#6C6C6C] transition-colors shrink-0 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
          {isLoading && (
            <div className="px-4 py-4 sm:px-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && booking && (
            <div className="px-4 py-4 sm:px-6 sm:py-4 max-w-full min-w-0">
              {/* Status pill */}
              <div
                className="inline-flex px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-semibold mb-4 sm:mb-5 max-w-full"
                style={{ backgroundColor: stageCfg.bg, color: stageCfg.text }}
              >
                <span className="truncate">{getStageLabel(stage)}</span>
              </div>

              {/* Passive check-in / attendance flags (read-only) */}
              {(booking.customerPresent || booking.providerUpdate) && (
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
                  {booking.customerPresent && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold bg-[#E8F5E9] text-[#2E7D32]">
                      Customer: I&apos;m here
                    </span>
                  )}
                  {booking.providerUpdate === "late" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold bg-[#FFF8E6] text-[#8A6703]">
                      Provider: Late
                    </span>
                  )}
                  {booking.providerUpdate === "noshow" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold bg-[#FFEBEE] text-[#C62828]">
                      Provider: No-show
                    </span>
                  )}
                </div>
              )}

              {/* Customer name */}
              <p className="text-[15px] sm:text-[16px] font-semibold text-[#101828] mb-1 break-words">
                {booking.contactInfo?.name ?? "Unknown Customer"}
              </p>

              {/* Service type • Date • Time */}
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] sm:text-[13px] text-[#6C6C6C] font-medium mb-5 sm:mb-6 leading-relaxed">
                <span>{SERVICE_TYPE_LABEL[booking.serviceType] ?? booking.serviceType}</span>
                <span>•</span>
                <span>{formatDate(booking.serviceDate)}</span>
                <span>•</span>
                <span>{booking.serviceTime}</span>
              </div>

              {/* Action buttons per stage */}
              {stage === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setRejectModalVisible(true)}
                  >
                    Reject booking
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAccept}
                    loading={isConfirming}
                    disabled={isConfirming}
                  >
                    Accept
                  </Button>
                </div>
              )}
              {stage === "confirmed" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button variant="cancel" className="flex-1" onClick={handleMessage} loading={isCreatingChat} disabled={isCreatingChat}>
                    <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Message
                  </Button>
                  <Button className="flex-1" onClick={() => {
                    if (booking.serviceType === "normal") handleUpdateStage("readyToServe", "Marked as ready to serve");
                    else if (booking.serviceType === "home") handleUpdateStage("vendorEnroute", "Marked as on the way");
                    else handleUpdateStage("itemReceived", "Marked as item received");
                  }} loading={isUpdatingStage} disabled={isUpdatingStage}>
                    {booking.serviceType === "normal" ? "Ready to serve" : booking.serviceType === "home" ? "On the way" : "Mark item received"}
                  </Button>
                </div>
              )}
              {(stage === "vendorEnroute" || stage === "vendorArrived") && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button variant="cancel" className="flex-1" onClick={handleMessage} loading={isCreatingChat} disabled={isCreatingChat}>
                    <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Message
                  </Button>
                  <Button className="flex-1" onClick={() => handleUpdateStage(stage === "vendorEnroute" ? "vendorArrived" : "inProgress", stage === "vendorEnroute" ? "Marked as arrived" : "Service started")} loading={isUpdatingStage} disabled={isUpdatingStage}>
                    {stage === "vendorEnroute" ? "Mark arrived" : "Start service"}
                  </Button>
                </div>
              )}
              {stage === "itemReceived" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button variant="cancel" className="flex-1" onClick={handleMessage} loading={isCreatingChat} disabled={isCreatingChat}>
                    <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Message
                  </Button>
                  <Button className="flex-1" onClick={() => handleUpdateStage("inProgress", "Service started")} loading={isUpdatingStage} disabled={isUpdatingStage}>
                    Start service
                  </Button>
                </div>
              )}
              {stage === "readyToServe" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button variant="cancel" className="flex-1" onClick={handleMessage} loading={isCreatingChat} disabled={isCreatingChat}>
                    <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Message
                  </Button>
                  <Button className="flex-1" onClick={() => handleUpdateStage("inProgress", "Service started")} loading={isUpdatingStage} disabled={isUpdatingStage}>
                    Begin service
                  </Button>
                </div>
              )}
              {stage === "readyForPickup" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button variant="cancel" className="flex-1" onClick={handleMessage} loading={isCreatingChat} disabled={isCreatingChat}>
                    <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Message
                  </Button>
                  <Button className="flex-1" onClick={handleComplete} loading={isCompleting} disabled={isCompleting}>
                    Mark as completed
                  </Button>
                </div>
              )}
              {stage === "inProgress" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8 min-w-0">
                  <Button variant="cancel" className="flex-1" onClick={handleMessage} loading={isCreatingChat} disabled={isCreatingChat}>
                    <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Message
                  </Button>
                  {booking.serviceType === "pickDrop" ? (
                    <Button className="flex-1" onClick={() => handleUpdateStage("readyForPickup", "Marked as ready for pickup")} loading={isUpdatingStage} disabled={isUpdatingStage}>
                      Ready for pickup
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={handleComplete} loading={isCompleting} disabled={isCompleting}>
                      Mark as completed
                    </Button>
                  )}
                </div>
              )}

              {/* Provider attendance (manual status — not automated) */}
              {canSetProviderUpdate && (
                <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl border border-[#F0F0F0] bg-[#FAFAFA]/80 min-w-0">
                  <p className="text-[12px] sm:text-[13px] font-semibold text-[#101828] mb-1">Attendance issue</p>
                  <p className="text-[11px] sm:text-[12px] text-[#6C6C6C] font-medium mb-3 leading-snug">
                    Mark if the customer is late or did not show. This is a status update only for your records and disputes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="cancel"
                      className="flex-1"
                      disabled={!!pendingProviderFlag}
                      loading={pendingProviderFlag === "late" && isSavingProviderUpdate}
                      onClick={() => handleProviderUpdate("late")}
                    >
                      Mark late
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={!!pendingProviderFlag}
                      loading={pendingProviderFlag === "noshow" && isSavingProviderUpdate}
                      onClick={() => handleProviderUpdate("noshow")}
                    >
                      Mark no-show
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="py-2 mb-5 sm:mb-6 border-t border-[#F0F0F0] min-w-0">
                {(() => {
                  const steps = buildTimeline(booking);
                  return steps.map((step, i) => {
                  const dotCls =
                    step.isRejected || step.isCancelled
                      ? "bg-red-500"
                      : step.completed
                      ? "bg-[#4C9A2A]"
                      : "bg-transparent border-2 border-[#D0D5DD]";
                  const lineCls = step.completed
                    ? step.isRejected || step.isCancelled
                      ? "bg-red-400"
                      : "bg-[#4C9A2A]"
                    : "bg-[#E5E7EB]";
                  const labelCls =
                    step.isRejected || step.isCancelled
                      ? "text-red-600"
                      : step.completed
                      ? "text-[#4C9A2A]"
                      : "text-[#101828]";

                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center w-5 shrink-0">
                        {i !== 0 && <div className={`w-0.5 flex-1 min-h-[8px] ${lineCls}`} />}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${dotCls}`}>
                          {step.completed &&
                            (step.isRejected || step.isCancelled ? (
                              <X className="w-3 h-3 text-white" strokeWidth={2.5} />
                            ) : (
                              <CheckCircle2
                                className="w-5 h-5 text-white"
                                strokeWidth={0}
                                fill="#4C9A2A"
                              />
                            ))}
                          {!step.completed && (
                            <Circle className="w-5 h-5 text-[#D0D5DD]" strokeWidth={1.5} />
                          )}
                        </div>
                        {i !== steps.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[8px] ${lineCls}`} />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start pb-4 pt-1 min-w-0">
                        <div className="min-w-0">
                          <p className={`text-[12px] sm:text-[13px] font-semibold ${labelCls}`}>{step.label}</p>
                          <p
                            className={`text-[11px] sm:text-[12px] font-medium mt-0.5 ${
                              step.completed ? "text-[#6C6C6C]" : "text-[#9CA3AF]"
                            }`}
                          >
                            {step.subtitle}
                          </p>
                        </div>
                        {step.date && (
                          <p className="text-[10px] sm:text-[11px] text-[#9CA3AF] font-medium shrink-0 sm:ml-2 sm:mt-0.5">
                            {new Date(step.date)
                              .toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
                })()}
              </div>

              {/* Date & Time section */}
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-3 min-w-0">
                <div className="flex flex-1 min-w-0 items-center gap-3 rounded-xl sm:rounded-none bg-[#FAFAFA]/80 sm:bg-transparent px-3 py-3 sm:px-0 sm:py-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white sm:bg-[#FAFAFA] flex items-center justify-center shrink-0 border border-[#F0F0F0] sm:border-0">
                    <Calendar className="w-4 h-4 text-[#6C6C6C]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] sm:text-[13px] text-[#6C6C6C] font-medium">Date</p>
                    <p className="text-[13px] sm:text-[14px] font-medium text-[#101828] break-words">{formatDate(booking.serviceDate)}</p>
                  </div>
                </div>
                <div className="flex flex-1 min-w-0 items-center gap-3 rounded-xl sm:rounded-none bg-[#FAFAFA]/80 sm:bg-transparent px-3 py-3 sm:px-0 sm:py-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white sm:bg-[#FAFAFA] flex items-center justify-center shrink-0 border border-[#F0F0F0] sm:border-0">
                    <Clock className="w-4 h-4 text-[#6C6C6C]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] sm:text-[13px] text-[#6C6C6C] font-medium">Time</p>
                    <p className="text-[13px] sm:text-[14px] font-medium text-[#101828] break-words">
                      {formatTimeRange(booking.serviceTime, booking.pricing?.totalDuration ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service details */}
              <p className="text-[14px] sm:text-[15px] font-medium text-[#101828] mb-3 sm:mb-4">Service details</p>
              <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6 min-w-0">
                {booking.items?.map((item, i) => {
                  const addOnsDur = (item.addOns ?? []).reduce((s, a) => s + (a.durationInMinutes ?? 0), 0);
                  const totalDur = (item.service?.durationInMinutes ?? 0) + addOnsDur;
                  return (
                    <div key={i} className="flex gap-3 items-start sm:items-center min-w-0">
                      {item.service?.imageUrl ? (
                        <img src={item.service.imageUrl} alt="" className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-lg sm:rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-lg sm:rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#9CA3AF] text-base sm:text-lg font-bold shrink-0">
                          {item.service?.name?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 min-w-0">
                          <p className="flex-1 min-w-0 text-[13px] sm:text-[14px] font-medium text-[#101828] break-words sm:truncate">{item.service?.name}</p>
                          <p className="text-[13px] sm:text-[14px] font-semibold text-[#101828] shrink-0 tabular-nums">
                            {formatCurrency(item.subtotal ?? 0, item.service?.currency ?? currency)}
                          </p>
                        </div>
                        <p className="text-[12px] sm:text-[14px] text-[#6C6C6C] font-medium mt-0.5">
                          {formatDuration(totalDur)}
                          {(item.addOns?.length ?? 0) > 1 && ` • Includes ${item.addOns?.length} add-ons`}
                        </p>
                        {(item.addOns?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                            {item.addOns?.map((a, j) => (
                              <span key={j} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-[13px] font-medium text-[#6C6C6C] bg-[#F5F5F5] border border-[#E8E8E8]">
                                + {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Service address (home) */}
              {booking.serviceType === "home" && booking.homeServiceAddress && (
                <div className="mb-5 sm:mb-6 min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-medium text-[#101828] mb-3 sm:mb-4">Service address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#6C6C6C] mt-0.5 shrink-0" />
                    <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] font-medium leading-relaxed break-words">
                      {[booking.homeServiceAddress.apartment, booking.homeServiceAddress.address, `${booking.homeServiceAddress.city}.`]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Pick-up & Drop-off */}
              {booking.serviceType === "pickDrop" && (booking.pickupInfo || booking.dropoffInfo) && (
                <div className="mb-5 sm:mb-6 min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-medium text-[#101828] mb-3 sm:mb-4">Drop-off & Pick-up</p>
                  {booking.dropoffInfo?.address && (
                    <div className="flex items-start gap-2 mb-3">
                      <ArrowDownCircle className="w-4 h-4 text-[#6C6C6C] mt-0.5 shrink-0" />
                      <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] font-medium break-words">
                        Drop-off: {booking.dropoffInfo.address.address}, {booking.dropoffInfo.address.city}{" "}
                        {booking.dropoffInfo.address.postalCode ? `, ${booking.dropoffInfo.address.postalCode}` : ""}
                      </p>
                    </div>
                  )}
                  {booking.pickupInfo?.address && (
                    <div className="flex items-start gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-[#6C6C6C] mt-0.5 shrink-0" />
                      <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] font-medium break-words">
                        Pickup: {booking.pickupInfo.address.address}, {booking.pickupInfo.address.city}{" "}
                        {booking.pickupInfo.address.postalCode ? `, ${booking.pickupInfo.address.postalCode}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional info */}
              {(booking.additionalInfo?.notes || (booking.additionalInfo?.images?.length ?? 0) > 0) && (
                <div className="mb-5 sm:mb-6 min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-medium text-[#101828] mb-3 sm:mb-4">Additional information</p>
                  {booking.additionalInfo?.notes && (
                    <p className="text-[13px] sm:text-[14px] text-[#101828] font-medium leading-relaxed mb-3 sm:mb-4 break-words">{booking.additionalInfo.notes}</p>
                  )}
                  {booking.additionalInfo?.images && booking.additionalInfo.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {booking.additionalInfo.images.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedImage(url)}
                          className="w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-lg overflow-hidden border border-[#E5E7EB] shrink-0 touch-manipulation"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Payment summary */}
              <p className="text-[14px] sm:text-[15px] font-medium text-[#101828] mb-2 sm:mb-3">Payment summary</p>
              <div className="bg-[#FAFAFA] rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3 min-w-0">
                <div className="flex justify-between gap-3 text-[13px] sm:text-[14px] min-w-0">
                  <span className="text-[#6C6C6C] font-medium break-words text-left">
                    Subtotal ({booking.items?.length ?? 0} {(booking.items?.length ?? 0) !== 1 ? "Items" : "Item"})
                  </span>
                  <span className="font-medium text-[#101828] tabular-nums shrink-0 text-right">
                    {formatCurrency(booking.pricing?.subtotal ?? 0, currency)}
                  </span>
                </div>
                {(booking.pricing?.remainingBalance ?? 0) > 0 && (
                  <div className="flex justify-between gap-3 text-[13px] sm:text-[14px]">
                    <span className="text-[#6C6C6C] font-medium">Remaining Balance</span>
                    <span className="font-medium text-[#101828] tabular-nums shrink-0">
                      {formatCurrency(booking.pricing?.remainingBalance ?? 0, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3 text-[13px] sm:text-[14px]">
                  <span className="text-[#6C6C6C] font-medium">Taxes</span>
                  <span className="font-medium text-[#101828] tabular-nums shrink-0">{formatCurrency(0, currency)}</span>
                </div>
                {(booking.pricing?.commissionAmount ?? 0) > 0 && (
                  <div className="flex justify-between gap-3 text-[13px] sm:text-[14px]">
                    <span className="text-[#6C6C6C] font-medium">Commission</span>
                    <span className="font-medium text-[#101828] tabular-nums shrink-0">
                      - {formatCurrency(booking.pricing?.commissionAmount ?? 0, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3 text-[13px] sm:text-[14px] pt-3 border-t border-[#F0F0F0]">
                  <span className="font-semibold text-[#101828] break-words pr-2">
                    {(booking.pricing?.amountPaid ?? 0) < (booking.pricing?.subtotal ?? 0) ? "Total paid" : "Total received"}
                  </span>
                  <span className="font-semibold text-[#101828] tabular-nums shrink-0 text-right">
                    {formatCurrency(
                      booking.pricing?.paymentTerm === "deposit"
                        ? (booking.pricing?.amountPaid ?? 0)
                        : (booking.pricing?.vendorPayout ?? booking.pricing?.amountPaid ?? 0),
                      currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectModalVisible && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => setRejectModalVisible(false)}
            aria-hidden
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-xl sm:shadow-none">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#101828] font-[lora] mb-2 pr-2">Reject this booking?</h3>
            <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] mb-5 sm:mb-6 font-medium leading-relaxed">
              This action cannot be undone. The customer will be notified and any payment will be refunded automatically.
            </p>
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <Button variant="destructive" onClick={handleReject} loading={isRejecting} disabled={isRejecting}>
                Refund booking
              </Button>
              <Button variant="cancel" onClick={() => setRejectModalVisible(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-3 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-[max(0.75rem,env(safe-area-inset-top,0px))] left-3 sm:left-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white z-10 touch-manipulation"
            aria-label="Close image"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <img
            src={selectedImage}
            alt=""
            className="max-w-full max-h-[min(85dvh,85vh)] w-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default VendorBookingDetailPanel;
