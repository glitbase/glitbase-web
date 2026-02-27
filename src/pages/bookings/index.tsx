import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomeLayout from '@/layout/home/HomeLayout';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  useCancelBookingMutation,
  useGetUserBookingsQuery,
} from '@/redux/booking';
import { useCreateStoreReviewMutation } from '@/redux/vendor';
import BookingCard from '@/components/BookingCard';
import BookingsTabs, { type BookingsTabKey } from '@/components/BookingsTabs';
import BookingDetailsDrawer from '@/components/BookingDetailsDrawer';
import CancelBookingModal from '@/components/CancelBookingModal';
import BookingReviewModal from '@/components/BookingReviewModal';
import {
  BOOKINGS_TABS,
  formatBookingDate,
  formatBookingTime,
  getBookingProgress,
  getBookingStageLabel,
  type BookingListItem,
} from '@/utils/bookings';

const SkeletonRow = () => (
  <div className="flex items-start gap-4 py-5 animate-pulse">
    <div className="w-[52px] h-[52px] rounded-full bg-[#EAECF0]" />
    <div className="flex-1">
      <div className="h-4 w-44 bg-[#EAECF0] rounded mb-2" />
      <div className="h-3 w-64 bg-[#F2F4F7] rounded mb-3" />
      <div className="h-[6px] w-[220px] bg-[#EAECF0] rounded-full" />
    </div>
  </div>
);

const CustomerBookings = () => {
  const user = useAppSelector((s) => s.auth.user);
  const [activeTab, setActiveTab] = useState<BookingsTabKey>('ongoing');
  const [selectedReference, setSelectedReference] = useState<string | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [reviewStoreId, setReviewStoreId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const isVendor = user?.activeRole === 'vendor';

  const [cancelBooking, { isLoading: isCancelling }] =
    useCancelBookingMutation();
  const [createReview, { isLoading: isSubmittingReview }] =
    useCreateStoreReviewMutation();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetUserBookingsQuery(
    { status: activeTab, page: 1, limit: 10 },
    { refetchOnFocus: true, refetchOnReconnect: true, skip: isVendor }
  );

  type UserBookingsResponse = {
    bookings?: BookingListItem[];
    data?: { bookings?: BookingListItem[] };
  };

  const bookings: BookingListItem[] = useMemo(() => {
    const safe = data as unknown as UserBookingsResponse | undefined;
    const maybe = safe?.bookings ?? safe?.data?.bookings ?? [];
    return Array.isArray(maybe) ? maybe : [];
  }, [data]);

  if (isVendor) {
    return <Navigate to="/vendor/bookings" replace />;
  }

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <h1 className="text-[40px] font-[lora] font-bold text-[#101828] mb-6">
            Bookings
          </h1>

          <BookingsTabs
            tabs={BOOKINGS_TABS}
            activeKey={activeTab}
            onChange={setActiveTab}
          />

          {isError ? (
            <div className="py-12">
              <p className="text-[#F04438] mb-4">Failed to load bookings.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 bg-[#4C9A2A] text-white rounded-full hover:bg-[#3d7a22] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : null}

          {(isLoading || (isFetching && bookings.length === 0)) && !isError ? (
            <div>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : null}

          {!isLoading && !isError && bookings.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[24px] font-semibold text-[#101828]">
                No bookings yet
              </p>
              <p className="text-[14px] text-[#667085] mt-2">
                Your booking history will appear here once you schedule your
                first service
              </p>
            </div>
          ) : null}

          {!isError && bookings.length > 0 ? (
            <div>
              {bookings.map((b) => {
                const name =
                  b.store?.name ||
                  (b as unknown as { storeName?: string })?.storeName ||
                  (b as unknown as { vendorName?: string })?.vendorName ||
                  'Booking';
                const reference = b.bookingReference;

                const stageLabel = getBookingStageLabel(b.bookingStage);
                const timeLabel = formatBookingTime(b.serviceTime);
                const dateLabel = formatBookingDate(b.serviceDate);

                const meta = dateLabel
                  ? `${dateLabel}${timeLabel ? ` • ${timeLabel}` : ''}${
                      stageLabel ? ` • ${stageLabel}` : ''
                    }`
                  : `${timeLabel}${stageLabel ? ` • ${stageLabel}` : ''}`;

                const status = (b.status || '').toString().toLowerCase();
                const isCompleted = status === 'completed';
                const isRejected = status === 'rejected';
                const isOngoing =
                  status === 'ongoing' || (!isCompleted && !isRejected);

                const progress = isOngoing
                  ? getBookingProgress(b.serviceType, b.bookingStage)
                  : undefined;

                return (
                  <BookingCard
                    key={b._id || b.bookingReference || `${name}-${meta}`}
                    name={name}
                    imageUrl={
                      b.store?.bannerImageUrl ||
                      (b as unknown as { storeImageUrl?: string })?.storeImageUrl
                    }
                    meta={meta}
                    progress={typeof progress === 'number' ? progress : undefined}
                    statusText={
                      isCompleted ? 'Completed' : isRejected ? 'Rejected' : undefined
                    }
                    statusTone={
                      isCompleted ? 'success' : isRejected ? 'danger' : 'default'
                    }
                    actionLabel={isCompleted ? 'Rebook' : undefined}
                    onActionClick={
                      isCompleted
                        ? () => {
                            // Out of scope for now — booking creation prefill.
                          }
                        : undefined
                    }
                    onClick={() => {
                      if (!reference) {
                        toast.error('Missing booking reference.');
                        return;
                      }
                      setSelectedReference(reference);
                      setIsDrawerOpen(true);
                    }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <BookingDetailsDrawer
        reference={selectedReference}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCancel={(bookingId) => {
          setCancelBookingId(bookingId);
          setIsCancelOpen(true);
        }}
        onRate={(storeId) => {
          setReviewStoreId(storeId);
          setIsReviewOpen(true);
        }}
      />

      <CancelBookingModal
        isOpen={isCancelOpen}
        isLoading={isCancelling}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={async (reason) => {
          if (!cancelBookingId) return;
          try {
            await cancelBooking({ bookingId: cancelBookingId, reason }).unwrap();
            toast.success('Booking cancelled');
            setIsCancelOpen(false);
            setIsDrawerOpen(false);
            refetch();
          } catch (e) {
            toast.error('Failed to cancel booking');
          }
        }}
      />

      <BookingReviewModal
        isOpen={isReviewOpen}
        isLoading={isSubmittingReview}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={async ({ rating, message }) => {
          if (!reviewStoreId) return;
          try {
            await createReview({ storeId: reviewStoreId, rating, message }).unwrap();
            toast.success('Review submitted');
            setIsReviewOpen(false);
            setIsDrawerOpen(false);
            refetch();
          } catch (e) {
            toast.error('Failed to submit review');
          }
        }}
      />
    </HomeLayout>
  );
};

export default CustomerBookings;

