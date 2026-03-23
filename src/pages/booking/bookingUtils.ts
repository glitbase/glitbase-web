import type { Booking } from "@/redux/booking";

export const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDuration = (minutes: number) => {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
};

export const STAGE_TEXT: Record<string, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Booking confirmed",
  readyToServe: "Ready to serve",
  vendorEnroute: "Vendor en route",
  vendorArrived: "Vendor arrived",
  itemReceived: "Item received",
  inProgress: "In progress",
  readyForPickup: "Ready for pickup",
  completed: "Completed",
};

export const STAGE_PROGRESS: Record<string, number> = {
  pending: 10,
  confirmed: 20,
  readyToServe: 30,
  vendorEnroute: 40,
  vendorArrived: 50,
  itemReceived: 60,
  inProgress: 70,
  readyForPickup: 85,
  completed: 100,
};

export const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-[#FFF8E7] text-[#C49A00]" },
  confirmed: { label: "Confirmed", cls: "bg-[#EAF4FF] text-[#1565C0]" },
  ongoing:   { label: "Ongoing",   cls: "bg-[#FFF3E0] text-[#E65100]" },
  completed: { label: "Fulfilled", cls: "bg-[#EDFAF0] text-[#2E7D32]" },
  rejected:  { label: "Rejected",  cls: "bg-[#FFEBEE] text-[#C62828]" },
  refunded:  { label: "Refunded",  cls: "bg-[#F5F5F5] text-[#616161]" },
  cancelled: { label: "Cancelled", cls: "bg-[#FFEBEE] text-[#C62828]" },
};

export interface TimelineStep {
  label: string;
  subtitle: string;
  completed: boolean;
  isRejected?: boolean;
  isCancelled?: boolean;
  date?: string | null;
}

export function buildTimeline(booking: Booking): TimelineStep[] {
  const stage = booking.bookingStage ?? "pending";
  const serviceType = booking.serviceType ?? "normal";
  const history = booking.stageHistory ?? [];
  const isRejected = booking.status === "rejected";
  const isCancelled = booking.status === "cancelled";

  const ts = (s: string) => history.find((h) => h.stage === s)?.timestamp ?? null;

  const serviceDateStr = (booking.serviceDate ?? "").split("T")[0];
  const todayStr = new Date().toLocaleDateString("en-CA");
  const isToday = serviceDateStr === todayStr;
  const isPast = serviceDateStr < todayStr;

  if (serviceType === "normal") {
    return [
      { label: "Pending", subtitle: "Booking is awaiting confirmation", completed: true, date: ts("pending") ?? booking.createdAt },
      ...(isRejected
        ? [{ label: "Booking rejected",   subtitle: "Your appointment has been rejected", completed: true, isRejected: true,  date: ts("rejected")  ?? booking.updatedAt }]
        : isCancelled
        ? [{ label: "Booking cancelled",  subtitle: "You cancelled this appointment",     completed: true, isCancelled: true, date: ts("cancelled") ?? booking.updatedAt }]
        : [{ label: "Booking confirmed",  subtitle: "Your appointment has been accepted", completed: ["confirmed","readyToServe","inProgress","completed"].includes(stage), date: ts("confirmed") }]),
      { label: "Preparation reminder", subtitle: "Your provider is getting ready",               completed: ["confirmed","readyToServe","inProgress","completed"].includes(stage), date: null },
      { label: "Day of service",        subtitle: "Your appointment is today!",                  completed: ["confirmed","readyToServe","inProgress","completed"].includes(stage) && (isToday || isPast), date: null },
      { label: "Ready to serve",        subtitle: "We're all set! Please check in at arrival",  completed: ["readyToServe","inProgress","completed"].includes(stage), date: ts("readyToServe") },
      { label: "Service in progress",   subtitle: "Your service is currently underway",          completed: ["inProgress","completed"].includes(stage), date: ts("inProgress") },
      { label: "Service completed",     subtitle: "Your service has been completed",             completed: stage === "completed", date: ts("completed") ?? booking.completedAt ?? null },
    ];
  }

  if (serviceType === "home") {
    return [
      { label: "Pending", subtitle: "Awaiting confirmation", completed: true, date: ts("pending") ?? booking.createdAt },
      ...(isRejected
        ? [{ label: "Booking rejected",  subtitle: "Your booking was not accepted",      completed: true, isRejected: true,  date: ts("rejected")  ?? booking.updatedAt }]
        : isCancelled
        ? [{ label: "Booking cancelled", subtitle: "You cancelled this booking",         completed: true, isCancelled: true, date: ts("cancelled") ?? booking.updatedAt }]
        : [{ label: "Confirmed",         subtitle: "Your appointment has been accepted", completed: ["confirmed","vendorEnroute","vendorArrived","inProgress","completed"].includes(stage), date: ts("confirmed") }]),
      { label: "Preparation reminder", subtitle: "Your provider is getting ready",   completed: ["confirmed","vendorEnroute","vendorArrived","inProgress","completed"].includes(stage), date: null },
      { label: "Day of service",       subtitle: "Your appointment is today!",       completed: ["confirmed","vendorEnroute","vendorArrived","inProgress","completed"].includes(stage) && (isToday || isPast), date: null },
      { label: "Vendor en route",      subtitle: "Your provider is on the way",      completed: ["vendorEnroute","vendorArrived","inProgress","completed"].includes(stage), date: ts("vendorEnroute") },
      { label: "Vendor arrived",       subtitle: "Your provider has arrived",        completed: ["vendorArrived","inProgress","completed"].includes(stage), date: ts("vendorArrived") },
      { label: "In progress",          subtitle: "Your service is currently underway", completed: ["inProgress","completed"].includes(stage), date: ts("inProgress") },
      { label: "Completed",            subtitle: "Your service has been completed",  completed: stage === "completed", date: ts("completed") ?? booking.completedAt ?? null },
    ];
  }

  // pickDrop
  return [
    { label: "Pending", subtitle: "Awaiting confirmation", completed: true, date: ts("pending") ?? booking.createdAt },
    ...(isRejected
      ? [{ label: "Booking rejected",   subtitle: "Your booking was not accepted",              completed: true, isRejected: true,  date: ts("rejected")  ?? booking.updatedAt }]
      : isCancelled
      ? [{ label: "Booking cancelled",  subtitle: "You cancelled this booking",                 completed: true, isCancelled: true, date: ts("cancelled") ?? booking.updatedAt }]
      : [{ label: "Drop-off scheduled", subtitle: "Your drop-off appointment is confirmed",     completed: ["confirmed","itemReceived","inProgress","readyForPickup","completed"].includes(stage), date: ts("confirmed") }]),
    { label: "Preparation reminder", subtitle: "Your provider is getting ready",                completed: ["confirmed","itemReceived","inProgress","readyForPickup","completed"].includes(stage), date: null },
    { label: "Day of service",       subtitle: "Your appointment is today!",                    completed: ["confirmed","itemReceived","inProgress","readyForPickup","completed"].includes(stage) && (isToday || isPast), date: null },
    { label: "Item received",        subtitle: "We've received your items",                     completed: ["itemReceived","inProgress","readyForPickup","completed"].includes(stage), date: ts("itemReceived") },
    { label: "Work in progress",     subtitle: "Your items are being processed",                completed: ["inProgress","readyForPickup","completed"].includes(stage), date: ts("inProgress") },
    { label: "Ready for collection", subtitle: "Collect during your scheduled pickup slot",     completed: ["readyForPickup","completed"].includes(stage), date: ts("readyForPickup") },
    { label: "Service completed",    subtitle: "Items collected successfully",                  completed: stage === "completed", date: ts("completed") ?? booking.completedAt ?? null },
  ];
}

/**
 * True when the cart includes a service explicitly marked as delivery-capable.
 * Web CreateBooking only shows the address step when this is true **and** `serviceType === 'home'`
 * (pickup/drop-off address UI is skipped on web).
 * Normalize cart/API payloads: `is_delivery`, string "true", and ignore other truthy values so web matches mobile
 * when the field is missing or false.
 */
export function cartServiceIsDeliveryExplicitTrue(
  service: { isDelivery?: unknown; is_delivery?: unknown } | undefined
): boolean {
  if (!service) return false;
  const v = service.isDelivery ?? service.is_delivery;
  return v === true || v === "true";
}

export function cartHasDeliveryServiceForBooking(
  cartItems: Array<{ service?: { isDelivery?: unknown; is_delivery?: unknown } }>
): boolean {
  return cartItems.some((item) => cartServiceIsDeliveryExplicitTrue(item.service));
}
