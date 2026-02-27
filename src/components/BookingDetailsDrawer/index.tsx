import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useGetBookingByReferenceQuery } from '@/redux/booking';
import {
  formatBookingDate,
  formatBookingTime,
  formatStageTimestamp,
  getStageTimestamp,
  getTimelineStages,
  isBookingCancellable,
  isServiceDateTodayOrPast,
  type BookingListItem,
} from '@/utils/bookings';

interface BookingDetailsDrawerProps {
  reference?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (bookingId: string) => void;
  onRate: (storeId: string) => void;
}

type BookingDetailsResponse = {
  booking?: BookingListItem;
  data?: { booking?: BookingListItem };
};

const BookingDetailsDrawer = ({
  reference,
  isOpen,
  onClose,
  onCancel,
  onRate,
}: BookingDetailsDrawerProps) => {
  const skip = !isOpen || !reference;
  const { data, isLoading, isError } = useGetBookingByReferenceQuery(
    reference || '',
    { skip, refetchOnFocus: true, refetchOnReconnect: true },
  );

  // Drawer is populated only from GET /bookings/{bookingReference} response, not from list data.
  const booking = useMemo(() => {
    const safe = data as unknown as BookingDetailsResponse | undefined;
    return safe?.booking ?? safe?.data?.booking;
  }, [data]);

  const storeName = booking?.store?.name || 'Booking';
  const storeId = booking?.store?.id || booking?.store?._id || '';

  const statusLower = (booking?.status || '').toString().toLowerCase();
  const activeStage = (booking?.bookingStage || '').toString();
  // Stages: use API-provided stages when present (dynamic); otherwise derive from serviceType.
  const baseStages: string[] = useMemo(() => {
    const fromApi: string[] | undefined = Array.isArray(booking?.stages) && booking.stages.length > 0
      ? booking.stages
      : Array.isArray(booking?.timelineStages) && booking.timelineStages.length > 0
        ? booking.timelineStages
        : undefined;
    return fromApi ?? getTimelineStages(booking?.serviceType);
  }, [booking?.stages, booking?.timelineStages, booking?.serviceType]);
  const baseActiveIdx = Math.max(
    0,
    baseStages.findIndex((s) => s === activeStage),
  );
  const isCancelled = statusLower === 'cancelled';
  const isAppointmentTodayOrPast = isServiceDateTodayOrPast(
    booking?.serviceDate,
  );

  const stages: string[] = useMemo(() => {
    let list = baseStages;
    // Insert "Day of service" above "Ready to serve" when booking is confirmed and it's the day of the appointment (or after); keep it even after the date.
    if (
      isAppointmentTodayOrPast &&
      list.includes('readyToServe')
    ) {
      const readyIdx = list.indexOf('readyToServe');
      list = [
        ...list.slice(0, readyIdx),
        'dayOfService',
        ...list.slice(readyIdx),
      ];
    }
    if (!isCancelled) return list;
    const completedIdx = list.findIndex((s: string) => s === 'completed');
    const insertAt =
      completedIdx >= 0 ? completedIdx : Math.max(0, list.length);
    return [
      ...list.slice(0, insertAt),
      'cancelled',
      ...list.slice(insertAt),
    ];
  }, [baseStages, isCancelled, isAppointmentTodayOrPast]);

  const stageHistorySet = useMemo(() => {
    const set = new Set<string>();
    for (const h of booking?.stageHistory || []) {
      if (h?.stage) set.add(String(h.stage));
    }
    return set;
  }, [booking?.stageHistory]);

  const dateLabel = formatBookingDate(booking?.serviceDate);
  const timeLabel = formatBookingTime(booking?.serviceTime);

  const canCancel = isBookingCancellable(booking?.status);
  const isCompleted =
    (booking?.status || '').toString().toLowerCase() === 'completed';
  const isRejected =
    (booking?.status || '').toString().toLowerCase() === 'rejected';

  const addressLabel = (() => {
    if (booking?.serviceType === 'home') {
      return booking?.homeServiceAddress?.address || '';
    }
    if (booking?.serviceType === 'pickDrop') {
      return (
        booking?.dropoffInfo?.address?.address ||
        booking?.pickupInfo?.address?.address ||
        ''
      );
    }
    return '';
  })();

  if (!isOpen) return null;

  const handleMissing = (msg: string) => {
    toast.error(msg);
  };

  const getStageCopy = (serviceType: string | undefined, stage: string) => {
    // Keep underlying stage keys per MD; adjust displayed copy to match UI screenshots.
    const isPickDrop = serviceType === 'pickDrop';

    if (stage === 'cancelled') {
      return {
        title: 'Booking cancelled',
        subtitle: 'Your appointment has been cancelled',
        tone: 'danger' as const,
      };
    }

    if (stage === 'dayOfService') {
      return {
        title: 'Day of service',
        subtitle: 'Your appointment is today!',
        tone: 'default' as const,
      };
    }

    if (isPickDrop) {
      switch (stage) {
        case 'confirmed':
          return {
            title: 'Drop-off schedule',
            subtitle: 'Your drop-off appointment is confirmed',
            tone: 'success' as const,
          };
        case 'itemReceived':
          return {
            title: 'Item received',
            subtitle: 'We’ve received your items and work has begun',
            tone: 'default' as const,
          };
        case 'inProgress':
          return {
            title: 'Work in progress',
            subtitle: 'Your items are being processed',
            tone: 'default' as const,
          };
        case 'readyForPickup':
          return {
            title: 'Ready for collection',
            subtitle: 'Collect during your scheduled pickup slot.',
            tone: 'default' as const,
          };
        case 'completed':
          return {
            title: 'Service completed',
            subtitle: 'Items collected successfully',
            tone: 'default' as const,
          };
        default:
          return {
            title:
              stage === 'pending'
                ? 'Booking confirmed'
                : stage.replace(/([A-Z])/g, ' $1').trim(),
            subtitle:
              stage === 'pending' ? 'The provider is reviewing booking' : '',
            tone: 'default' as const,
          };
      }
    }

    // Normal / home
    switch (stage) {
      case 'pending':
        return {
          title: 'Booking placed',
          subtitle: 'The provider is reviewing booking',
          tone: 'default' as const,
        };
      case 'confirmed':
        return {
          title: 'Booking confirmed',
          subtitle: 'Your appointment has been accepted',
          tone: 'success' as const,
        };
      case 'readyToServe':
        return {
          title: 'Ready to serve',
          subtitle: 'We’re all set! Please check in at arrival',
          tone: 'default' as const,
        };
      case 'vendorEnroute':
        return {
          title: 'Vendor en route',
          subtitle: '',
          tone: 'default' as const,
        };
      case 'vendorArrived':
        return {
          title: 'Vendor arrived',
          subtitle: '',
          tone: 'default' as const,
        };
      case 'inProgress':
        return {
          title: 'Service in progress',
          subtitle: 'Your service is currently underway',
          tone: 'default' as const,
        };
      case 'completed':
        return {
          title: 'Service completed',
          subtitle: 'Your service has been completed',
          tone: 'default' as const,
        };
      default:
        return {
          title: stage.replace(/([A-Z])/g, ' $1').trim(),
          subtitle: '',
          tone: 'default' as const,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-[520px] h-full bg-white shadow-2xl overflow-y-auto relative">
        <div className="p-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            aria-label="Close booking details"
          >
            ✕
          </button>
          {/* MD precedence: rebook only for completed or rejected, even if design shows it elsewhere */}
          {isCompleted || isRejected ? (
            <button
              type="button"
              className="px-6 py-2 rounded-full bg-[#F2F4F7] text-[#344054] text-[14px] font-medium hover:bg-[#EAECF0] transition-colors"
              onClick={() => {
                // Out of scope for now — booking creation prefill.
              }}
            >
              Rebook
            </button>
          ) : null}
        </div>

        <div className="p-6">
          {isRejected && booking?.store?.bannerImageUrl ? (
            <img
              src={booking.store.bannerImageUrl}
              alt={storeName}
              className="w-full h-48 object-cover rounded-2xl"
              loading="lazy"
            />
          ) : null}

          <div className="flex items-start justify-between gap-4 mt-4">
            <div>
              <p className="text-[20px] font-semibold text-[#101828]">
                {storeName}
              </p>
              {isRejected ? (
                <p className="text-[14px] text-[#667085] mt-1">
                  <span className="text-[#D92D20] font-medium">Rejected</span>{' '}
                  {dateLabel ? `on ${dateLabel}` : ''}
                  {timeLabel ? `, ${timeLabel}` : ''}
                </p>
              ) : (
                <p className="text-[14px] text-[#667085] mt-1">
                  The provider is reviewing booking
                </p>
              )}
            </div>
            {/* Pink icon placeholder (matches screenshots) */}
            {!isRejected ? (
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.83073 9.33333C5.83073 8.04467 6.8754 7 8.16406 7H11.6641C12.9527 7 13.9974 8.04467 13.9974 9.33333V13.2222L16.3307 16.3333H31.8096C31.611 15.9901 31.4974 15.5917 31.4974 15.1667C31.4974 13.878 32.5421 12.8333 33.8307 12.8333H41.9974C43.2861 12.8333 44.3307 13.878 44.3307 15.1667C44.3307 16.4553 43.2861 17.5 41.9974 17.5H39.7462L38.6902 19.0839L43.0853 35.5655C43.3177 36.4372 43.0268 37.3648 42.3382 37.9477C41.6495 38.5306 40.6865 38.6642 39.8652 38.2909L17.4974 28.1237V36.1667C17.4974 37.4553 16.4527 38.5 15.1641 38.5C13.8754 38.5 12.8307 37.4553 12.8307 36.1667V19.4444L9.7974 15.4C9.49448 14.9961 9.33073 14.5049 9.33073 14V11.6667H8.16406C6.8754 11.6667 5.83073 10.622 5.83073 9.33333ZM17.4974 21V22.9975L37.305 32.001L34.3714 21H17.4974Z"
                  fill="#FF71AA"
                />
                <path
                  d="M11.0807 28.8236C7.31013 30.4167 4.66406 34.1493 4.66406 38.5C4.66406 44.299 9.36507 49 15.1641 49C20.9631 49 25.6641 44.299 25.6641 38.5C25.6641 36.5134 25.1124 34.6557 24.1538 33.0716L19.2474 30.8415V36.1667C19.2474 38.4219 17.4192 40.25 15.1641 40.25C12.9089 40.25 11.0807 38.4219 11.0807 36.1667V28.8236Z"
                  fill="#FF71AA"
                />
                <path
                  d="M30.3307 38.4999C30.3307 37.6434 30.4333 36.8108 30.6268 36.0138L39.141 39.8839C40.5784 40.5373 42.2636 40.3034 43.4687 39.2834C44.6739 38.2634 45.183 36.64 44.7762 35.1145L42.9352 28.2109C47.7257 29.1855 51.3307 33.4217 51.3307 38.4999C51.3307 44.2989 46.6297 48.9999 40.8307 48.9999C35.0317 48.9999 30.3307 44.2989 30.3307 38.4999Z"
                  fill="#FF71AA"
                />
              </svg>
            ) : null}
          </div>

          {/* Timeline */}
          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-[#EAECF0] rounded w-2/3" />
                <div className="h-4 bg-[#EAECF0] rounded w-1/2" />
                <div className="h-4 bg-[#EAECF0] rounded w-3/5" />
              </div>
            ) : isError || !booking ? (
              <div className="py-6">
                <p className="text-[#F04438]">
                  Failed to load booking details.
                </p>
              </div>
            ) : isRejected ? null : (
              <div className="relative">
                {stages.map((s, idx) => {
                  const cancelIdx = stages.indexOf('cancelled');
                  const beforeCancel = cancelIdx >= 0 ? idx < cancelIdx : true;
                  const afterCancel = cancelIdx >= 0 ? idx > cancelIdx : false;

                  const wasReached =
                    stageHistorySet.has(s) ||
                    (beforeCancel && idx <= baseActiveIdx);

                  const isCancelledRow = s === 'cancelled';
                  const isDone = isCancelledRow ? true : wasReached;

                  const copy = getStageCopy(booking.serviceType, s);
                  const ts = getStageTimestamp(booking.stageHistory, s);
                  const tsLabel =
                    s === 'dayOfService'
                      ? dateLabel
                      : formatStageTimestamp(ts);

                  const markerBg = isCancelledRow
                    ? 'bg-white'
                    : isDone
                      ? 'bg-[#4C9A2A]'
                      : 'bg-white';

                  const markerBorder = isCancelledRow
                    ? 'border-[#D0D5DD]'
                    : isDone
                      ? 'border-[#4C9A2A]'
                      : 'border-[#D0D5DD]';

                  const markerCheckColor = isCancelledRow
                    ? '#D0D5DD'
                    : isDone
                      ? 'white'
                      : '#D0D5DD';

                  // Line segments: green through completed steps only (like screenshots)
                  const lineTopColor =
                    idx === 0
                      ? 'transparent'
                      : isDone && !isCancelledRow
                        ? '#4C9A2A'
                        : '#EAECF0';
                  const lineBottomColor =
                    afterCancel || isCancelledRow
                      ? '#EAECF0'
                      : isDone
                        ? '#4C9A2A'
                        : '#EAECF0';

                  const titleColor =
                    copy.tone === 'danger'
                      ? 'text-[#D92D20]'
                      : isDone
                        ? 'text-[#4C9A2A]'
                        : 'text-[#667085]';

                  const subtitleColor = isDone
                    ? 'text-[#667085]'
                    : 'text-[#98A2B3]';

                  return (
                    <div
                      key={`${s}-${idx}`}
                      className="flex gap-4 py-4 relative"
                    >
                      <div className="w-6 flex justify-center relative">
                        {/* line top */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 top-0 h-1/2 w-[2px]"
                          style={{ backgroundColor: lineTopColor }}
                        />
                        {/* line bottom */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 top-1/2 h-1/2 w-[2px]"
                          style={{ backgroundColor: lineBottomColor }}
                        />
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${markerBg} ${markerBorder}`}
                        >
                          <span
                            className="text-[12px]"
                            style={{ color: markerCheckColor }}
                          >
                            ✓
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={`text-[14px] font-medium ${titleColor}`}
                          >
                            {copy.title}
                          </p>
                          {tsLabel ? (
                            <p className="text-[12px] text-[#667085]">
                              {tsLabel}
                            </p>
                          ) : null}
                        </div>
                        {copy.subtitle ? (
                          <p className={`text-[13px] mt-1 ${subtitleColor}`}>
                            {copy.subtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {!isLoading && booking ? (
            <>
              {/* For rejected: show Date + Time blocks like screenshot */}
              {isRejected ? (
                <div className="mt-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                      <span className="text-[#667085]">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 2V4M6 2V4"
                            stroke="#3B3B3B"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M3.5 8H20.5"
                            stroke="#3B3B3B"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z"
                            stroke="#3B3B3B"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897"
                            stroke="#3B3B3B"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M3 8H21"
                            stroke="#3B3B3B"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#667085]">Date</p>
                      <p className="text-[14px] font-semibold text-[#101828]">
                        {dateLabel || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                      <span className="text-[#667085]">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#3B3B3B"
                            stroke-width="1.5"
                          />
                          <path
                            d="M12 8V12L14 14"
                            stroke="#3B3B3B"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#667085]">Time</p>
                      <p className="text-[14px] font-semibold text-[#101828]">
                        {timeLabel || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 border-t pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#101828]">
                        {booking.serviceType === 'home'
                          ? 'Home service'
                          : booking.serviceType === 'pickDrop'
                            ? 'Drop-off & pick-up'
                            : 'Normal service'}
                      </p>
                      {addressLabel ? (
                        <p className="text-[13px] text-[#667085] mt-1">
                          {addressLabel}
                        </p>
                      ) : null}
                    </div>

                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!booking._id)
                            return handleMissing('Missing booking id.');
                          onCancel(booking._id);
                        }}
                        className="px-5 py-2 rounded-full bg-[#FCECEB] text-[#D92D20] text-[14px] font-medium hover:bg-[#FAD3D1] transition-colors"
                      >
                        Cancel
                      </button>
                    ) : isCompleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!storeId)
                            return handleMissing('Missing store id.');
                          onRate(storeId);
                        }}
                        className="px-5 py-2 rounded-full bg-[#F2F4F7] text-[#344054] text-[14px] font-medium hover:bg-[#EAECF0] transition-colors"
                      >
                        Rate service
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Service details */}
              {Array.isArray(booking.items) && booking.items.length > 0 ? (
                <div className="mt-6">
                  <p className="text-[14px] font-semibold text-[#101828] mb-3">
                    Service details
                  </p>
                  <div className="space-y-4">
                    {booking.items.map((it, idx) => {
                      const service = it.service || {};
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#F2F4F7] overflow-hidden flex items-center justify-center">
                            {service.imageUrl ? (
                              <img
                                src={service.imageUrl}
                                alt={service.name || 'Service'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-[#667085]">✦</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#101828] truncate">
                              {service.name || 'Service'}
                            </p>
                            {/* Screenshot shows variant line like "lg / black" — we only have duration right now */}
                            {service.durationInMinutes ? (
                              <p className="text-[12px] text-[#667085]">
                                {Math.floor(service.durationInMinutes / 60)}hr{' '}
                                {service.durationInMinutes % 60}min
                              </p>
                            ) : null}
                          </div>
                          {typeof service.price === 'number' ? (
                            <p className="text-[14px] font-semibold text-[#101828]">
                              {service.currency || '$'}
                              {service.price}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsDrawer;
  