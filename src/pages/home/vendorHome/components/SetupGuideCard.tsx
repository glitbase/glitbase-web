import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '@/components/ProgressBar';
import { useAppSelector } from '@/hooks/redux-hooks';
import { useGetServicesQuery } from '@/redux/vendor';

type SetupGuideCardProps = {
  storeId?: string;
};

const SetupGuideCard = ({ storeId }: SetupGuideCardProps) => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const store = useAppSelector((s) => s.vendorStore.store);

  const { data: servicesData, isLoading: isLoadingServices } = useGetServicesQuery(
    { storeId: storeId || '', page: 1, limit: 1 },
    { skip: !storeId }
  );

  const hasServices = (servicesData as any)?.services?.length > 0;

  const progress = useMemo(() => {
    const stepCount = 5;
    let completed = 0;

    if (user?.hasPayoutInfo) completed += 1;
    if (store?.policies?.payment?.depositType && store?.policies?.payment?.amount) completed += 1;
    if (store?.policies?.booking?.cancellation && store?.policies?.booking?.rescheduling) completed += 1;

    const hasOpeningHours =
      Array.isArray(store?.openingHours) && store.openingHours.length > 0 && store.openingHours.some((h: any) => h?.isOpen);
    if (hasOpeningHours) completed += 1;

    if (hasServices) completed += 1;

    return Math.round((completed / stepCount) * 100);
  }, [user?.hasPayoutInfo, store?.policies, store?.openingHours, hasServices]);

  if (!storeId) return null;
  if (isLoadingServices) return null;
  if (progress >= 100) return null;

  return (
    <div className="mt-6 rounded-2xl bg-[#F7EFEF] p-6 border border-[#F0F0F0]">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-semibold text-[#101828]">Complete setup</p>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-[14px] font-semibold text-[#AE3670] hover:underline"
        >
          Continue
        </button>
      </div>
      <p className="mt-2 text-[14px] text-[#6C6C6C] max-w-[420px]">
        Almost done! Complete these final steps to make your profile complete.
      </p>

      <div className="mt-4 space-y-2">
        <ProgressBar value={progress} />
        <p className="text-[14px] font-semibold text-[#101828]">
          Profile <span className="font-medium text-[#6C6C6C]">{progress}% complete</span>
        </p>
      </div>
    </div>
  );
};

export default SetupGuideCard;

