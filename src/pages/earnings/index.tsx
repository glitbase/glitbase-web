import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import { GoBack } from '@/components/GoBack';
import { Button } from '@/components/Buttons';
import { useGetWalletQuery, useGetPayoutStatusQuery } from '@/redux/payment';
import { currencySymbol } from '@/pages/home/vendorHome/components/utils';
import { Info, RefreshCw } from 'lucide-react';
import PayoutRequestModal from '@/components/Modal/PayoutRequestModal';

const Earnings = () => {
  const navigate = useNavigate();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const { data, isLoading, refetch, isFetching } = useGetWalletQuery();
  const { data: payoutStatusData } = useGetPayoutStatusQuery();

  const wallet = data?.data?.wallet;
  const currency = wallet?.currency || 'NGN';
  const hasPendingPayout = payoutStatusData?.data?.hasPendingPayout;
  const pendingPayout = payoutStatusData?.data?.pendingPayout;

  const handleViewHistory = () => {
    navigate('/earnings/history', {
      state: {
        availableBalance: wallet?.totalLifetimeEarnings ?? 0,
        pendingBalance: wallet?.pendingBalance ?? 0,
        currency,
      },
    });
  };

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F0F0F0] bg-white px-6 py-4">
          <GoBack />
          <h1 className="flex-1 text-center text-[20px] font-semibold text-[#101828] font-[lora] tracking-tight">
            Earnings
          </h1>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-5 w-5 text-[#101828] ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div
          className="overflow-y-auto px-6 py-6 max-w-[600px]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
        >
          <div className="space-y-6">
            <div className="py-6">
              <p className="text-[16px] font-medium text-[#6C6C6C] mb-2">
                Current payout balance
              </p>
              {isLoading ? (
                <div className="h-8 w-32 rounded bg-[#F0F0F0] animate-pulse" />
              ) : (
                <p className="text-[24px] font-semibold text-[#101828]">
                  {`${currencySymbol(currency)}${(wallet?.availableBalance ?? 0).toLocaleString()}`}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="cancel"
                className="flex-1"
                onClick={handleViewHistory}
              >
                View history
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowPayoutModal(true)}
                disabled={hasPendingPayout}
              >
                {hasPendingPayout ? 'Payout pending' : 'Request payout'}
              </Button>
            </div>

            <div className="flex gap-4 rounded-xl bg-[#F2FAFF] p-4">
              <div className="shrink-0">
                <Info className="h-4 w-4 text-[#4A85E4] mt-1" />
              </div>
              <p className="text-[14px] font-medium text-[#3B3B3B] leading-relaxed">
                {hasPendingPayout && pendingPayout ? (
                  `Your payout request of ${currencySymbol(pendingPayout.currency)}${(pendingPayout.amount ?? 0).toLocaleString()} is ${pendingPayout.status === 'pending_approval' ? 'pending approval' : 'being processed'}. You will be notified when it's completed. Please note that processing time may vary and it may take 1-5 business days to complete.`
                ) : (
                  "Your next payout will be processed within 1-5 business days from the date of request. Transfers take 2-5 business days to reach your account. Please note that only completed transactions are available for payout."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <PayoutRequestModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        availableBalance={wallet?.availableBalance ?? 0}
        currency={currency}
        onSuccess={() => {
          setShowPayoutModal(false);
          refetch();
        }}
      />
    </HomeLayout>
  );
};

export default Earnings;
