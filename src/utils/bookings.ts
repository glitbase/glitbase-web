/* eslint-disable prefer-const */
export type BookingStatusKey =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export type BookingServiceTypeKey = 'normal' | 'home' | 'pickDrop';

export type BookingStageKey =
  | 'pending'
  | 'confirmed'
  | 'readyToServe'
  | 'vendorEnroute'
  | 'vendorArrived'
  | 'itemReceived'
  | 'inProgress'
  | 'readyForPickup'
  | 'completed'
  | 'rejected';

export interface BookingListItem {
  _id?: string;
  bookingReference?: string;
  status?: BookingStatusKey | string;
  bookingStage?: BookingStageKey | string;
  serviceType?: BookingServiceTypeKey | string;
  serviceDate?: string;
  serviceTime?: string;
  store?: {
    id?: string;
    _id?: string;
    name?: string;
    bannerImageUrl?: string;
  };
  /** Optional: stages order from API (GET booking by reference). When present, used instead of getTimelineStages(serviceType). */
  stages?: string[];
  /** Optional: same as stages; backend may use timelineStages. */
  timelineStages?: string[];
  stageHistory?: Array<{
    stage: BookingStageKey | string;
    timestamp: string;
    updatedBy?: string;
  }>;
  items?: Array<{
    quantity?: number;
    subtotal?: number;
    totalDuration?: number;
    service?: {
      name?: string;
      price?: number;
      currency?: string;
      durationInMinutes?: number;
      imageUrl?: string;
    };
  }>;
  pricing?: {
    subtotal?: number;
    currency?: string;
    amountPaid?: number;
    remainingBalance?: number;
    totalDuration?: number;
    total?: number;
  };
  homeServiceAddress?: { address?: string; city?: string; postalCode?: string };
  pickupInfo?: { address?: { address?: string } };
  dropoffInfo?: { address?: { address?: string } };
}

export const BOOKINGS_TABS: Array<{
  key: 'all' | 'pending' | 'ongoing' | 'completed' | 'rejected';
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
];

export function formatBookingDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  // Matches screenshot: "5 Feb, 2025"
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** True when serviceDate is today or in the past (date-only, local time). Used for "Day of service" stage. */
export function isServiceDateTodayOrPast(serviceDate?: string): boolean {
  if (!serviceDate) return false;
  const d = new Date(serviceDate);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const apptY = d.getFullYear();
  const apptM = d.getMonth();
  const apptD = d.getDate();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();
  if (apptY < todayY) return true;
  if (apptY > todayY) return false;
  if (apptM < todayM) return true;
  if (apptM > todayM) return false;
  return apptD <= todayD;
}

export function formatBookingTime(time?: string): string {
  if (!time) return '';
  const trimmed = time.trim();
  // If backend already returns "7:00 PM" / "19:00 PM", keep it.
  if (/am|pm/i.test(trimmed)) return trimmed;
  // Expect "HH:mm"
  const [hRaw, mRaw] = trimmed.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return trimmed;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const normalized = h % 12 === 0 ? 12 : h % 12;
  return `${normalized}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export function getTimelineStages(serviceType?: string): BookingStageKey[] {
  switch (serviceType) {
    case 'home':
      return [
        'pending',
        'confirmed',
        'vendorEnroute',
        'vendorArrived',
        'inProgress',
        'completed',
      ];
    case 'pickDrop':
      return [
        'pending',
        'confirmed',
        'itemReceived',
        'inProgress',
        'readyForPickup',
        'completed',
      ];
    case 'normal':
    default:
      return [
        'pending',
        'confirmed',
        'readyToServe',
        'inProgress',
        'completed',
      ];
  }
}

export function getBookingStageLabel(stage?: string): string {
  switch (stage) {
    case 'pending':
      return 'Booking placed';
    case 'confirmed':
      return 'Booking confirmed';
    case 'readyToServe':
      return 'Provider assigned';
    case 'vendorEnroute':
      return 'Vendor en route';
    case 'vendorArrived':
      return 'Vendor arrived';
    case 'itemReceived':
      return 'Item received';
    case 'inProgress':
      return 'Service in progress';
    case 'readyForPickup':
      return 'Ready for pickup';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    default:
      return stage ? stage.replace(/([A-Z])/g, ' $1').trim() : '';
  }
}

export function getBookingProgress(
  serviceType?: string,
  bookingStage?: string,
): number | undefined {
  if (!bookingStage) return undefined;
  const stages = getTimelineStages(serviceType);
  const idx = stages.indexOf(bookingStage as BookingStageKey);
  if (idx < 0) return undefined;
  if (stages.length <= 1) return 0;
  return idx / (stages.length - 1);
}

export function isBookingCancellable(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return s === 'pending' || s === 'confirmed';
}

export function getStageTimestamp(
  stageHistory: BookingListItem['stageHistory'] | undefined,
  stage: string,
): string | undefined {
  if (!stageHistory?.length) return undefined;
  const match = stageHistory.find((h) => h.stage === stage);
  return match?.timestamp;
}

// retune  "3:35 pm" if it's the same day but DD/MM/YYYY if it's a different day
export function formatStageTimestamp(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isSameDay) {
    // Return time like "3:35 pm"
    return d
      .toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
      })
      .replace(/^(\d{1,2}:\d{2})/, (_, t) => {
        // remove leading zero and convert to am/pm
        let [hours, minutes] = t.split(':');
        let h = parseInt(hours, 10);
        let ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
      })
      .toLowerCase();
  } else {
    // Return date as DD/MM/YYYY
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
