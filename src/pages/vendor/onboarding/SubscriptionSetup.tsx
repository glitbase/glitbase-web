/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import {
  useGetActiveSubscriptionPlansQuery,
  useAcceptSubscriptionMutation,
} from '@/redux/vendor';
import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { toast } from 'react-toastify';
import { useUserProfileQuery } from '@/redux/auth';
import { setReload } from '@/redux/auth/authSlice';
import {
  getOnboardingState,
  updateOnboardingState,
  completeStep,
  OnboardingStep,
  clearOnboardingState,
} from '@/utils/vendorOnboarding';
import AuthLayout from '@/layout/auth';
import success from '@/assets/images/success.png';

const SubscriptionSetup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const country = user?.countryCode || 'NG';

  // Load saved data from localStorage
  const savedState = getOnboardingState();
  const [selectedPlan, setSelectedPlan] = useState<any>(
    savedState.data.subscriptionType && savedState.data.planId
      ? { type: savedState.data.subscriptionType, _id: savedState.data.planId }
      : null
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: plans, isLoading } =
    useGetActiveSubscriptionPlansQuery(undefined);
  const [acceptSubscription, { isLoading: isAccepting }] =
    useAcceptSubscriptionMutation();
  const { refetch: refetchProfile } = useUserProfileQuery(undefined, {});

  const isNigeria = country === 'NG';
  const monthlyPlan = plans?.data?.find((p: any) => p.type === 'monthly');
  const yearlyPlan = plans?.data?.find((p: any) => p.type === 'yearly');

  useEffect(() => {
    if (isNigeria) {
      // For Nigeria, auto-select commission plan
      setSelectedPlan({ type: 'commission' });
    }
  }, [isNigeria]);

  const formatPrice = (price: number, currency: string) => {
    const formattedPrice = (price / 100).toFixed(2);
    const symbol = currency === 'NGN' ? '₦' : '£';
    return `${symbol}${formattedPrice}`;
  };

  const handleStartTrial = async () => {
    try {
      let payload: any;
      let subscriptionData: any = {};

      if (isNigeria) {
        // Commission-based for Nigeria
        payload = {
          subscriptionType: 'commission',
        };
        subscriptionData = { subscriptionType: 'commission' };
      } else {
        // Monthly/Yearly for UK
        if (!selectedPlan) {
          toast.error('Please select a plan');
          return;
        }

        payload = {
          subscriptionType: selectedPlan.type,
          planId: selectedPlan._id,
          // paymentMethodId would come from a payment provider integration
          paymentMethodId: 'placeholder',
        };

        subscriptionData = {
          subscriptionType: selectedPlan.type,
          planId: selectedPlan._id,
        };
      }

      // Save to localStorage for persistence
      updateOnboardingState({
        data: subscriptionData,
      });

      await acceptSubscription(payload).unwrap();

      // Mark step as completed
      completeStep(OnboardingStep.SUBSCRIPTION_SETUP);

      // Refetch user profile to get updated vendorOnboardingStatus
      console.log('Refetching user profile after subscription...');
      await refetchProfile();

      // Trigger Redux reload to update user state
      dispatch(setReload(true));

      // Clear onboarding state as we're done
      clearOnboardingState();

      // Clear any other onboarding-related data
      sessionStorage.removeItem('vendorStoreData');

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error?.data?.message || 'Failed to activate subscription');
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <AuthLayout isLoading={false}>
        <VendorOnboardingLayout progress={100} currentStep={8}>
          <div className="px-4 mx-auto pb-8 max-w-[700px] flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CC5A88] mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Loading subscription plans...
              </p>
            </div>
          </div>
        </VendorOnboardingLayout>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={100} currentStep={8} showLogout={false}>
        <div className="px-4 mx-auto pb-8 max-w-[700px]">
          {/* Nigeria - Commission Based */}
          {isNigeria ? (
            <>
              {/* Commission Details Box */}
              <div className="mb-6 p-4 bg-[#F9FAFB] rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Commission details
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  After your trial ends, a small commission of 5%-12% per
                  transaction based on your category is applied
                </p>
                <p className="text-sm text-gray-500">
                  Billed after every earning
                </p>
              </div>

              <div className="space-y-2 flex flex-col items-center text-center mb-8">
                <Typography
                  variant="heading"
                  className="!text-[2rem] font-medium font-[lora]"
                >
                  No monthly fees. Only pay when you earn.
                </Typography>
                <p className="font-medium text-[1rem] text-[#667185] !mt-3 max-w-[600px]">
                  Try Glitbase with 0% commission for 30 days. After that, we
                  take a small cut — only 5-12% per booking or sale, depending
                  on your service type.
                </p>
              </div>
            </>
          ) : (
            /* UK - Monthly/Yearly */
            <div className="space-y-2 flex flex-col items-center text-center mb-8">
              <Typography
                variant="heading"
                className="!text-[2rem] font-medium font-[lora]"
              >
                Choose the perfect plan to grow your business
              </Typography>
            </div>
          )}

          {/* Features List */}
          <div className="mb-8 space-y-4">
            {[
              {
                title: 'Unlimited bookings & scheduling',
                description:
                  'Handle all appointments with ease. Calendar integration, automated reminders, and flexible scheduling options.',
              },
              {
                title: 'Real-time analytics and insights',
                description:
                  'Track what matters most. Revenue insights, booking trends, and customer data in easy-to-read reports.',
              },
              {
                title: 'Glitfinder discovery platform',
                description:
                  'Get discovered by new customers. Upload your work, gain followers, and drive traffic to your business.',
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-3">
                <div className="mt-1">
                  <svg
                    className="w-5 h-5 text-[#16A34A]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* UK Pricing Cards */}
          {!isNigeria && monthlyPlan && yearlyPlan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan(monthlyPlan)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  selectedPlan?._id === monthlyPlan._id
                    ? 'border-[#CC5A88] bg-[#FFEFF6]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Monthly
                  </h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(monthlyPlan.price, monthlyPlan.currency)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {monthlyPlan.description}
                </p>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={() => setSelectedPlan(yearlyPlan)}
                className={`p-6 border-2 rounded-lg text-left transition-all relative ${
                  selectedPlan?._id === yearlyPlan._id
                    ? 'border-[#CC5A88] bg-[#FFEFF6]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-[#16A34A] text-white text-xs font-semibold rounded">
                    Save 20%
                  </span>
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Yearly
                  </h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(yearlyPlan.price, yearlyPlan.currency)}
                    </span>
                    <span className="text-gray-600">/year</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {yearlyPlan.description}
                </p>
              </button>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-8">
            <Button
              variant="default"
              size="full"
              onClick={handleStartTrial}
              disabled={(!isNigeria && !selectedPlan) || isAccepting}
              loading={isAccepting}
              className="bg-[#60983C] hover:bg-[#4d7a30] text-lg py-4"
            >
              {isNigeria
                ? 'Start free - 0% commission for 30 days'
                : 'Start a 7-day free trial'}
            </Button>
            {isNigeria && (
              <p className="text-center text-sm text-gray-600 mt-3">
                Pay only when you earn.
              </p>
            )}
          </div>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
                <button
                  onClick={handleGoToDashboard}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="flex flex-col items-center text-center">
                  {/* Success Icon */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <img src={success} alt="success" />
                  </div>

                  <h2 className="text-2xl font-semibold font-[lora] mb-2">
                    Your store is now live on Glitbase
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {isNigeria
                      ? 'Enjoy 0% commission for 30 days!'
                      : 'Your 7-day free trial has started!'}
                  </p>

                  <Button
                    variant="default"
                    size="full"
                    onClick={handleGoToDashboard}
                    className="bg-[#4C9A2A] hover:bg-[#4d7a30] rounded-full py-3"
                  >
                    Go to dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default SubscriptionSetup;
