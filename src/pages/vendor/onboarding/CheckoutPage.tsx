/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/Buttons';
import AuthLayout from '@/layout/auth';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { toast } from 'react-toastify';
import { useUserProfileQuery } from '@/redux/auth';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setReload } from '@/redux/auth/authSlice';
import {
  completeStep,
  OnboardingStep,
  clearOnboardingState,
} from '@/utils/vendorOnboarding';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  clientSecret: string;
  planName: string;
  planPrice: string;
}

const CheckoutForm = ({
  clientSecret,
  planName,
  planPrice,
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { refetch: refetchProfile } = useUserProfileQuery(undefined, {});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Check if it's a setup intent or payment intent
      const isSetupIntent = clientSecret.startsWith('seti_');
      const isPaymentIntent = clientSecret.startsWith('pi_');

      console.log(
        'Client secret type:',
        isSetupIntent
          ? 'Setup Intent'
          : isPaymentIntent
            ? 'Payment Intent'
            : 'Unknown'
      );

      let result;

      if (isSetupIntent) {
        // Use confirmSetup for Setup Intents (saving card for future use)
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/vendor/onboarding/checkout/success`,
          },
          redirect: 'if_required',
        });
      } else if (isPaymentIntent) {
        // Use confirmPayment for Payment Intents (immediate charge)
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/vendor/onboarding/checkout/success`,
          },
          redirect: 'if_required',
        });
      } else {
        throw new Error('Invalid client secret type');
      }

      if (result.error) {
        console.error('Payment/Setup error:', result.error);
        setErrorMessage(
          result.error.message || 'Payment failed. Please try again.'
        );
        setIsProcessing(false);
      } else {
        // Payment/Setup succeeded
        console.log('Payment/Setup successful');
        toast.success('Subscription created successfully!');

        // Mark step as completed
        completeStep(OnboardingStep.SUBSCRIPTION_SETUP);

        // Refetch user profile
        await refetchProfile();

        // Trigger Redux reload
        dispatch(setReload(true));

        // Clear onboarding state
        clearOnboardingState();

        // Clear session storage
        sessionStorage.removeItem('vendorStoreData');

        // Navigate to success page
        navigate('/vendor/onboarding/checkout/success');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/vendor/onboarding/subscription');
    toast.warning('Payment cancelled.');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-[lora] text-gray-900 mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600">
            Please enter your payment details to complete the subscription.
          </p>
        </div>

        {/* Plan Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">{planName}</h3>
              <p className="text-sm text-gray-600">7-day free trial included</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{planPrice}</p>
              <p className="text-sm text-gray-600">after trial</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <PaymentElement />
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              size="full"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="full"
              disabled={!stripe || isProcessing}
              loading={isProcessing}
              className="flex-1 bg-[#60983C] hover:bg-[#4d7a30]"
            >
              {isProcessing ? 'Processing...' : 'Start Free Trial'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your payment information is secure and encrypted. You won't be
            charged until after your 7-day free trial ends.
          </p>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientSecret, planName, planPrice } = location.state || {};

  useEffect(() => {
    // Redirect back if no clientSecret
    if (!clientSecret) {
      toast.error('Invalid checkout session. Please try again.');
      navigate('/vendor/onboarding/subscription');
    }
  }, [clientSecret, navigate]);

  if (!clientSecret) {
    return null;
  }

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={100} currentStep={8} showLogout={false}>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#60983C',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '8px',
              },
            },
          }}
        >
          <CheckoutForm
            clientSecret={clientSecret}
            planName={planName || 'Subscription'}
            planPrice={planPrice || ''}
          />
        </Elements>
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default CheckoutPage;
