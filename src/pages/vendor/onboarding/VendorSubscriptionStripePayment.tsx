/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/Buttons';
import { toast } from 'react-toastify';
import { useUserProfileQuery } from '@/redux/auth';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setReload } from '@/redux/auth/authSlice';
import {
  completeStep,
  OnboardingStep,
  clearOnboardingState,
} from '@/utils/vendorOnboarding';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
export const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : Promise.resolve(null);

/** Normalize API shapes: `{ data: { clientSecret } }` or nested `data.data`. */
export function extractSubscriptionClientSecret(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const r = result as Record<string, unknown>;
  const d = r.data as Record<string, unknown> | undefined;
  if (!d) return undefined;
  if (typeof d.clientSecret === 'string' && d.clientSecret.length > 0) {
    return d.clientSecret;
  }
  const inner = d.data as Record<string, unknown> | undefined;
  if (inner && typeof inner.clientSecret === 'string' && inner.clientSecret.length > 0) {
    return inner.clientSecret as string;
  }
  return undefined;
}

function isSetupIntentSecret(secret: string): boolean {
  return secret.startsWith('seti_');
}

function isPaymentIntentSecret(secret: string): boolean {
  return secret.startsWith('pi_');
}

interface InnerProps {
  clientSecret: string;
  planName: string;
  planPrice: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SubscriptionPaymentInner = ({
  clientSecret,
  planName,
  planPrice,
  onSuccess,
  onCancel,
}: InnerProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useAppDispatch();
  const { refetch: refetchProfile } = useUserProfileQuery(undefined, {});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const returnUrl = `${window.location.origin}/vendor/onboarding/checkout/success`;

    try {
      let result;

      if (isSetupIntentSecret(clientSecret)) {
        result = await stripe.confirmSetup({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: 'if_required',
        });
      } else if (isPaymentIntentSecret(clientSecret)) {
        result = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: 'if_required',
        });
      } else {
        throw new Error(
          'Unrecognized payment client secret. Expected a Stripe Setup or Payment Intent secret.'
        );
      }

      if (result.error) {
        setErrorMessage(
          result.error.message || 'Payment failed. Please try again.'
        );
        setIsProcessing(false);
        return;
      }

      await refetchProfile();
      dispatch(setReload(true));
      completeStep(OnboardingStep.SUBSCRIPTION_SETUP);
      clearOnboardingState();
      sessionStorage.removeItem('vendorStoreData');
      toast.success('Subscription created successfully!');
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  return (
    <div className={''}>
      <div className="mb-6">
        <h2 className="text-xl font-bold font-[lora] text-gray-900 mb-2 tracking-tight">
          Add payment method
        </h2>
        <p className="text-[#6C6C6C] font-medium text-sm">
          Enter your card details to start your trial. You won&apos;t be charged
          until after the trial ends.
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-[#0A0A0A] font-[lora] tracking-tight truncate">
              {planName}
            </h3>
            <p className="text-sm text-[#6C6C6C] font-medium">
              7-day free trial included
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#0A0A0A] font-[lora] tracking-tight">
              {planPrice}
            </p>
            <p className="text-sm text-[#6C6C6C] font-medium">after trial</p>
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

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            size="full"
            onClick={onCancel}
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
            Start free trial
          </Button>
        </div>
      </form>
    </div>
  );
};

type Variant = 'modal' | 'inline';

export interface VendorSubscriptionStripePaymentProps {
  clientSecret: string;
  planName: string;
  planPrice: string;
  variant?: Variant;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VendorSubscriptionStripePayment({
  clientSecret,
  planName,
  planPrice,
  variant = 'inline',
  onSuccess,
  onCancel,
}: VendorSubscriptionStripePaymentProps) {
  if (!publishableKey) {
    return (
      <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
        Stripe is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY). Add your
        publishable key to the environment and reload.
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#60983C',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
    },
  };

  const flow = (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <SubscriptionPaymentInner
        clientSecret={clientSecret}
        planName={planName}
        planPrice={planPrice}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[min(92dvh,720px)] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] relative my-auto sm:my-0">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg leading-none text-gray-600 hover:bg-gray-200"
            aria-label="Close"
          >
            ×
          </button>
          {flow}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {flow}
      </div>
    </div>
  );
}
