import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import { GoBack } from '@/components/GoBack';
import { useLazyGetWalletTransactionsQuery, useGetWalletQuery, type WalletTransaction } from '@/redux/payment';
import { currencySymbol } from '@/pages/home/vendorHome/components/utils';
import { ChevronDown, CreditCard } from 'lucide-react';

const TIME_PERIODS = [
  'All time',
  'Today',
  'Last 7 days',
  'Last 30 days',
  'Last 3 months',
  'This year',
] as const;

const PERIOD_MAP: Record<string, 'all_time' | 'today' | 'last_7_days' | 'last_30_days' | 'last_3_months' | 'this_year'> = {
  'All time': 'all_time',
  'Today': 'today',
  'Last 7 days': 'last_7_days',
  'Last 30 days': 'last_30_days',
  'Last 3 months': 'last_3_months',
  'This year': 'this_year',
};

const EarningsHistory = () => {
  const location = useLocation();
  const state = (location.state as {
    availableBalance?: number;
    pendingBalance?: number;
    currency?: string;
  }) ?? {};

  const { data: walletData } = useGetWalletQuery();
  const wallet = walletData?.data?.wallet;

  // Use state from navigation, or fall back to wallet data when accessed directly
  const availableBalance =
    state.availableBalance ?? wallet?.totalLifetimeEarnings ?? 0;
  const pendingBalance = state.pendingBalance ?? wallet?.pendingBalance ?? 0;
  const currency = state.currency ?? wallet?.currency ?? 'NGN';

  const [selectedPeriod, setSelectedPeriod] = useState<string>('All time');
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const [getWalletTransactions, { data, isLoading, error }] = useLazyGetWalletTransactionsQuery();

  useEffect(() => {
    getWalletTransactions({
      period: PERIOD_MAP[selectedPeriod] ?? 'all_time',
      page: 1,
      limit: 20,
    });
  }, [selectedPeriod, getWalletTransactions]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const formatAmount = (amount: number, curr: string) =>
    `${currencySymbol(curr)}${amount.toLocaleString()}`;

  const transactions = data?.data?.transactions ?? [];

  const renderTransaction = (item: WalletTransaction) => (
    <div
      key={item.id}
      className="rounded-xl bg-white py-4 mb-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAFAFA]">
          <CreditCard className="h-5 w-5 text-[#101828]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[14px] font-medium text-[#101828] capitalize truncate">
              {item.type}
            </p>
            <p className="text-[14px] font-semibold text-[#101828] shrink-0">
              {formatAmount(item.amount, item.currency)}
            </p>
          </div>
          <p className="text-[13px] text-[#6C6C6C] mb-2 font-medium">
            {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
          </p>
          <span className="inline-block rounded-full bg-[#EBFEE3] px-3 py-1.5 text-[11px] font-medium text-[#3D7B22]">
            Completed
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-[#F0F0F0] bg-white px-6 py-4">
          <GoBack />
          <h1 className="flex-1 text-[20px] font-semibold text-[#101828] font-[lora] tracking-tight">
            Earnings history
          </h1>
          <div className="w-10" />
        </div>

        <div className="px-6 py-6 space-y-6 max-w-[600px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-[#101828]">Analytics</h2>
            <button
              type="button"
              onClick={() => setShowPeriodModal(true)}
              className="flex items-center gap-1 rounded-full bg-[#F0F0F0] px-4 py-2 text-[14px] font-medium text-[#101828]"
            >
              {selectedPeriod}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#FAFAFA] p-4">
              <p className="text-[14px] font-medium text-[#6C6C6C] mb-2">Earnings</p>
              <p className="text-[18px] font-semibold text-[#101828]">
                {`${currencySymbol(currency)}${availableBalance.toLocaleString()}`}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] p-4">
              <p className="text-[14px] font-medium text-[#6C6C6C] mb-2">Pending</p>
              <p className="text-[18px] font-semibold text-[#101828]">
                {`${currencySymbol(currency)}${pendingBalance.toLocaleString()}`}
              </p>
            </div>
          </div>

          <h2 className="text-[15px] font-semibold text-[#101828] mb-4">
            Transaction history
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-[15px] text-[#6C6C6C]">
              Loading transactions...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-[15px] text-[#BB0A0A]">
              Failed to load transactions
            </div>
          ) : transactions.length > 0 ? (
            <div>{transactions.map(renderTransaction)}</div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FAFAFA]">
                <CreditCard className="h-10 w-10 text-[#101828]" />
              </div>
              <p className="text-[18px] font-medium text-[#101828]">No transactions found</p>
            </div>
          )}
        </div>

        {showPeriodModal && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={() => setShowPeriodModal(false)}
            role="dialog"
            aria-modal
          >
            <div
              className="w-full max-w-md rounded-t-2xl bg-white p-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowPeriodModal(false);
                    }}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    <span className="text-[15px] font-medium text-[#101828]">
                      {period}
                    </span>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPeriod === period
                          ? 'border-[#AE3670] bg-[#AE3670]'
                          : 'border-[#E5E7EB] bg-white'
                      }`}
                    >
                      {selectedPeriod === period && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default EarningsHistory;
