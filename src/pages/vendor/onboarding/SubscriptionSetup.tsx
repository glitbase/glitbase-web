/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import {
  useGetActiveSubscriptionPlansQuery,
  useAcceptSubscriptionMutation,
  useCreateSubscriptionMutation,
} from '@/redux/vendor';
import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { toast } from 'react-toastify';
import { useUserProfileQuery } from '@/redux/auth';
import { setReload } from '@/redux/auth/authSlice';
import AuthLayout from '@/layout/auth';
import success from '@/assets/images/success.png';

const SubscriptionSetup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const country = user?.countryCode || 'NG';

  // Form state - no localStorage needed
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: plans, isLoading } =
    useGetActiveSubscriptionPlansQuery(undefined);
  const [acceptSubscription, { isLoading: isAccepting }] =
    useAcceptSubscriptionMutation();
  const [createSubscription, { isLoading: isCreatingSubscription }] =
    useCreateSubscriptionMutation();
  const { refetch: refetchProfile } = useUserProfileQuery(undefined, {});

  const isNigeria = country === 'NG';

  // The API returns plans directly (already transformed by RTK Query)
  const plansArray = useMemo(() => {
    return Array.isArray(plans) ? plans : [];
  }, [plans]);

  const monthlyPlan = useMemo(() => {
    return plansArray.find((p: any) => p.type === 'monthly');
  }, [plansArray]);

  const yearlyPlan = useMemo(() => {
    return plansArray.find((p: any) => p.type === 'yearly');
  }, [plansArray]);

  // Debug logging
  console.log('SubscriptionSetup Debug:', {
    country,
    isNigeria,
    plansRaw: plans,
    plansArray,
    monthlyPlan,
    yearlyPlan,
    selectedPlan,
    isLoading,
  });

  useEffect(() => {
    if (isNigeria) {
      // For Nigeria, auto-select commission plan
      setSelectedPlan({ type: 'commission' });
    } else if (plansArray.length > 0 && !selectedPlan) {
      // For UK, auto-select monthly plan on load
      const monthly = plansArray.find(
        (p: any) => p.type.toLowerCase() === 'monthly'
      );
      if (monthly) {
        setSelectedPlan(monthly);
      }
    }
    // We intentionally omit `selectedPlan` from dependencies to avoid
    // re-running when the user manually changes their selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNigeria, plansArray]);

  const formatPrice = (price: number, currency: string) => {
    const formattedPrice = (price / 100).toFixed(2);
    const symbol = currency === 'NGN' ? '₦' : '£';
    return `${symbol}${formattedPrice}`;
  };

  const handleSubscriptionSuccess = async () => {
    try {
      // Refetch user profile
      console.log('Refetching user profile after subscription...');
      await refetchProfile();

      // Trigger Redux reload
      dispatch(setReload(true));

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error completing subscription:', error);
      toast.error('Subscription created but profile update failed');
    }
  };


  const handleStartTrial = async () => {
    try {
      let payload: any;

      if (isNigeria) {
        // Commission-based for Nigeria
        payload = {
          subscriptionType: 'commission',
        };

        await acceptSubscription(payload).unwrap();

        // Refetch user profile to get updated vendorOnboardingStatus
        console.log('Refetching user profile after subscription...');
        await refetchProfile();

        // Trigger Redux reload to update user state
        dispatch(setReload(true));

        // Show success modal
        setShowSuccessModal(true);
      } else {
        // UK - Monthly/Yearly with Stripe
        if (!selectedPlan) {
          toast.error('Please select a plan');
          return;
        }

        // Prepare subscription payload
        payload = {
          subscriptionType: selectedPlan.type,
          planId: selectedPlan._id,
        };

        // Create subscription (backend will handle Stripe)
        const result = await createSubscription(payload).unwrap();

        console.log('Subscription result:', result);

        if (result.status) {
          // Handle 3D Secure if clientSecret is provided
          if (result.data?.clientSecret) {
            console.log('Client secret received:', result.data.clientSecret);

            // Check if it's a setup intent or payment intent
            const isSetupIntent = result.data.clientSecret.startsWith('seti_');
            const isPaymentIntent = result.data.clientSecret.startsWith('pi_');

            console.log(
              'Client secret type:',
              isSetupIntent
                ? 'Setup Intent'
                : isPaymentIntent
                  ? 'Payment Intent'
                  : 'Unknown'
            );

            // Navigate to checkout page to handle 3DS
            navigate('/vendor/onboarding/checkout', {
              state: {
                clientSecret: result.data.clientSecret,
                planName: `${selectedPlan.name}`,
                planPrice: formatPrice(selectedPlan.price, selectedPlan.currency),
              },
            });
          } else {
            console.log(
              'No client secret provided, subscription created without payment'
            );
            // No 3D Secure required, subscription created successfully
            await handleSubscriptionSuccess();
          }
        } else {
          toast.error(result.message || 'Failed to create subscription');
        }
      }
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
                <h3 className="font-semibold text-[#0A0A0A] text-[18px] font-[lora] mb-2">
                  Commission details
                </h3>
                <p className="text-[14px] text-[#6C6C6C] font-medium mb-1">
                  After your trial ends, a small commission of 5%-12% per
                  transaction based on your category is applied
                </p>
                <p className="text-[14px] text-[#6C6C6C] font-medium mt-3">
                  Billed after every earning
                </p>
              </div>

              <div className="space-y-2 flex flex-col items-center text-center mb-8">
                <Typography
                  variant="heading"
                  className="!text-[2rem] font-medium font-[lora] tracking-tight"
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

          {/* UK Pricing Cards - Debug Info */}
          {!isNigeria && !monthlyPlan && !yearlyPlan && !isLoading && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug:</strong> No subscription plans found. Please
                check if plans are configured in the backend.
                <br />
                Plans data: {JSON.stringify(plans)}
              </p>
            </div>
          )}

          {/* UK Pricing Cards */}
          {!isNigeria && (monthlyPlan || yearlyPlan) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Monthly Plan */}
              {monthlyPlan && (
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
              )}

              {/* Yearly Plan */}
              {yearlyPlan && (
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
              )}
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-8">
            <Button
              variant="default"
              size="full"
              onClick={handleStartTrial}
              disabled={
                (!isNigeria && !selectedPlan) ||
                isAccepting ||
                isCreatingSubscription
              }
              loading={isAccepting || isCreatingSubscription}
              className="bg-[#60983C] hover:bg-[#4d7a30] text-lg py-4"
            >
              {isNigeria
                ? 'Start free - 0% commission for 30 days'
                : 'Start a 7-day free trial'}
            </Button>
            {isNigeria && (
              <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                Pay only when you earn.
              </p>
            )}
          </div>


          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
                <div className="flex flex-col items-center text-center">
                  {/* Success Icon */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <img src={success} alt="success" />
                  </div>

                  <h2 className="text-2xl font-semibold font-[lora] mb-2">
                    Your store is now live on Glitbase
                  </h2>
                  <p className="text-[14px] text-[#6C6C6C] font-medium mb-6">
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
