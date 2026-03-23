import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState } from '@/redux/store';
import { setStore, type Store } from '@/redux/vendor/storeSlice';
import { useGetMyStoreQuery, useGetServicesQuery } from '@/redux/vendor';
import { useGetVendorBookingsQuery, useGetVendorMetricsQuery } from '@/redux/booking';
import VendorHeader from './components/VendorHeader';
import Metrics from './components/Metrics';
import QuickActions from './components/QuickActions';
import TodaysAppointments from './components/TodaysAppointments';
import SetupGuideModal from './components/SetupGuideModal';
import { toStoreSlug } from './components/utils';

const VendorHome = () => {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const store = useSelector((state: RootState) => state.vendorStore.store);

  const { data: myStoreData } = useGetMyStoreQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    const maybe = myStoreData as unknown;
    if (maybe && typeof maybe === 'object' && 'store' in maybe) {
      const storeValue = (maybe as { store?: unknown }).store;
      if (storeValue && typeof storeValue === 'object' && 'id' in storeValue) {
        dispatch(setStore(storeValue as Store));
      }
    }
  }, [myStoreData, dispatch]);

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const {
    data: vendorMetrics,
    isLoading: isLoadingMetrics,
  } = useGetVendorMetricsQuery({ startDate: today, endDate: today }, { skip: !user });

  const {
    data: vendorBookings,
    isLoading: isLoadingBookings,
    isError: isBookingsError,
  } = useGetVendorBookingsQuery(
    { startDate: today, endDate: today, page: 1, limit: 10 },
    { skip: !user }
  );

  const { data: servicesData } = useGetServicesQuery(
    { storeId: store?.id || '', page: 1, limit: 1 },
    { skip: !store?.id }
  );
  const hasServices = ((servicesData as { services?: unknown[] } | undefined)?.services?.length ?? 0) > 0;

  const storeName = store?.name || user?.storeName || user?.businessName || user?.firstName;
  const profileImageUrl = user?.profileImageUrl;

  // Match mobile SetupGuide: progress is derived from actual store/user/services data, not API
  const progressPercent = useMemo(() => {
    const stepIds = ['payout_details', 'payment_policy', 'business_rules', 'time_management', 'add_service'];
    let completedCount = 0;
    if (user?.hasPayoutInfo) completedCount++;
    if (store?.policies?.payment?.depositType != null && store?.policies?.payment?.amount != null) completedCount++;
    if (store?.policies?.booking?.cancellation && store?.policies?.booking?.rescheduling) completedCount++;
    const hasOpeningHours =
      Array.isArray(store?.openingHours) &&
      store.openingHours.length > 0 &&
      store.openingHours.some((h: { isOpen?: boolean }) => h?.isOpen);
    if (hasOpeningHours) completedCount++;
    if (hasServices) completedCount++;
    return Math.round((completedCount / stepIds.length) * 100);
  }, [user?.hasPayoutInfo, store?.policies, store?.openingHours, hasServices]);

  const handleCopyStoreUrl = async () => {
    const slug = toStoreSlug(storeName);
    const url = slug ? `https://glitbase.com/${slug}` : 'https://glitbase.com';
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Store link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className=" pb-14 px-8 mt-4">
      <div className="mx-auto w-full">
        <VendorHeader
          storeName={storeName}
          profileImageUrl={profileImageUrl}
          progressPercent={typeof progressPercent === 'number' ? progressPercent : undefined}
          onCopyStoreUrl={handleCopyStoreUrl}
          onSetupGuideClick={() => setShowSetupModal(true)}
        />

        <Metrics
          isLoading={isLoadingMetrics}
          metrics={vendorMetrics}
        />

        <QuickActions />

        <TodaysAppointments
          isLoading={isLoadingBookings}
          isError={isBookingsError}
          bookings={vendorBookings?.bookings ?? []}
          currencyFallback={vendorMetrics?.currency}
          onSeeAll={() => toast.info('Bookings page coming soon')}
        />

        <SetupGuideModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          storeId={store?.id}
        />
      </div>
    </div>
  );
};

export default VendorHome;