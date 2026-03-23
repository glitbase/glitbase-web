/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  useGetActiveSubscriptionPlansQuery,
  useCancelSubscriptionMutation,
} from '@/redux/vendor';
import { Button } from '@/components/Buttons';
import { toast } from 'react-toastify';

const ManageSubscriptions = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const { data: plansData, isLoading } = useGetActiveSubscriptionPlansQuery();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  const countryCode: string = user?.countryCode ?? '';
  const isNG = countryCode === 'NG';

  const userSub = user?.userSubscription;

  const userSubData = useMemo(() => {
    if (!plansData?.data || !userSub?.subscriptionType) return null;
    return plansData.data.find(
      (plan: any) =>
        plan.type?.toLowerCase() === userSub.subscriptionType?.toLowerCase()
    );
  }, [plansData, userSub]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getCurrencySymbol = (currency: string) => {
    if (!currency) return '';
    const map: Record<string, string> = { GBP: '£', NGN: '₦', USD: '$' };
    return map[currency.toUpperCase()] ?? currency;
  };

  const isFreeTrial = useMemo(() => {
    if (!userSub?.subscriptionStartDate || !userSub?.subscriptionEndDate) return false;
    const diff =
      new Date(userSub.subscriptionEndDate).getTime() -
      new Date(userSub.subscriptionStartDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 7;
  }, [userSub]);

  const handleCancel = async () => {
    try {
      const result = await cancelSubscription().unwrap();
      toast.success(result.message || 'Subscription cancelled successfully');
      setCancelModalVisible(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel subscription');
    }
  };

  // ── Nigeria layout ────────────────────────────────────────────────
  const renderNigeriaContent = () => (
    <div className="space-y-7">
      <div>
        <p className="text-[14px] font-medium text-[#6C6C6C]">Subscription type</p>
        <p className="font-medium capitalize">
          {user?.subscriptionType || '—'}
        </p>
      </div>
      <div>
        <p className="text-[14px] font-medium text-[#6C6C6C]">Member since</p>
        <p className="font-medium">
          {user?.createdAt ? formatDate(user.createdAt) : '—'}
        </p>
      </div>
      <div>
        <p className="text-[14px] font-medium text-[#6C6C6C]">Billing type</p>
        <p className="font-medium">
          8% – 10% billed on every booking
        </p>
      </div>
    </div>
  );

  // ── UK active subscription layout ─────────────────────────────────
  const renderActiveContent = () => {
    const symbol = getCurrencySymbol(userSubData?.currency ?? '');
    const price = userSubData ? userSubData.price / 100 : null;
    const period = userSubData?.durationInMonths === 1 ? 'month' : 'year';

    return (
      <div>
        <p className="text-[14px] font-medium text-[#6C6C6C] mb-2">Current plan</p>
        <div className="flex items-center gap-2">
          <p className="text-[19px] font-semibold text-[#101828] capitalize">
            {userSub?.subscriptionType}
          </p>
          {userSub?.isCancelled ? (
            <span className="text-[13px] font-medium text-[#D10606] bg-[#FEF2F2] px-2 py-0.5 rounded-full">
              Cancelled
            </span>
          ) : isFreeTrial ? (
            <span className="text-[13px] font-medium text-[#4C9A2A] bg-[#F0FDE4] px-2 py-0.5 rounded-full">
              Free trial
            </span>
          ) : null}
        </div>

        {price !== null && (
          <p className="text-[15px] font-medium text-[#6C6C6C] mt-2">
            {symbol}{price}/{period}
          </p>
        )}

        {userSub?.isCancelled ? (
          <p className="text-[14px] font-medium text-[#6C6C6C] mt-2">
            Your plan will expire on{' '}
            {userSub.subscriptionEndDate ? formatDate(userSub.subscriptionEndDate) : '—'}
          </p>
        ) : (
          <p className="text-[14px] font-medium text-[#6C6C6C] mt-2">
            Your next bill is {price !== null ? `${symbol}${price}` : '—'} on{' '}
            {userSub?.subscriptionEndDate ? formatDate(userSub.subscriptionEndDate) : '—'}
          </p>
        )}

        {!userSub?.isCancelled && (
          <div className="mt-8 w-[160px]">
            <Button
              variant="destructive"
              size="auto"
              onClick={() => setCancelModalVisible(true)}
            >
              Cancel plan
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ── No active subscription ─────────────────────────────────────────
  const renderNoSubscriptionContent = () => (
    <div>
      <p className="text-[14px] font-medium text-[#6C6C6C] mb-2">Current plan</p>
      <p className="text-[17px] font-semibold text-[#101828] mt-1">
        You don't have an active subscription
      </p>
      <div className="mt-8 w-[130px]">
        <Button
          variant="default"
          size="auto"
          onClick={() => navigate('/vendor/onboarding/subscription')}
        >
          Subscribe
        </Button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (isNG) return renderNigeriaContent();
    if (userSub?.isActive) return renderActiveContent();
    return renderNoSubscriptionContent();
  };

  return (
    <HomeLayout isLoading={isLoading} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[500px] px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <button
              onClick={() => navigate('/settings', { state: { tab: 'payment-billings' } })}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Payment & billings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828] font-medium">Manage subscriptions</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Subscription details
          </h1>

          {/* Main content */}
          <div className="mb-10">{renderMainContent()}</div>

          {/* Billing history */}
          <div>
            <p className="text-[17px] font-semibold text-[#101828] mb-6">Billing history</p>
            <p className="text-[16px] font-semibold text-[#0A0A0A] text-center mt-28 font-[lora] tracking-tight">
              No subscription bills yet
            </p>
            <p className="text-[14px] font-medium text-[#6C6C6C] text-center mt-1 max-w-[400px] mx-auto">
            Your subscription payments and billing records will appear here after your first charge
            </p>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {cancelModalVisible && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setCancelModalVisible(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl px-6 pt-7 pb-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[22px] font-semibold text-[#101828] font-[lora] tracking-tight text-center mb-3">
              Cancel your subscription?
            </h2>
            <p className="text-[15px] font-medium text-[#6C6C6C] text-center leading-relaxed mb-6 px-2">
              You'll lose access to premium features at the end of your current billing cycle
              {userSub?.subscriptionEndDate
                ? ` on ${formatDate(userSub.subscriptionEndDate)}`
                : ''}
              . You can reactivate anytime.
            </p>
            <div className="flex gap-3">
              <Button
                variant="cancel"
                size="full"
                onClick={() => setCancelModalVisible(false)}
              >
                Keep subscription
              </Button>
              <Button
                variant="destructive"
                size="full"
                onClick={handleCancel}
                disabled={isCancelling}
                loading={isCancelling}
              >
                Cancel subscription
              </Button>
            </div>
          </div>
        </div>
      )}
    </HomeLayout>
  );
};

export default ManageSubscriptions;
