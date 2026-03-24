/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '@/layout/auth';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { toast } from 'react-toastify';
import {
  VendorSubscriptionStripePayment,
} from './VendorSubscriptionStripePayment';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientSecret, planName, planPrice } = (location.state || {}) as {
    clientSecret?: string;
    planName?: string;
    planPrice?: string;
  };

  useEffect(() => {
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
        <VendorSubscriptionStripePayment
          variant="inline"
          clientSecret={clientSecret}
          planName={planName || 'Subscription'}
          planPrice={planPrice || ''}
          onSuccess={() => navigate('/vendor/onboarding/checkout/success')}
          onCancel={() => {
            navigate('/vendor/onboarding/subscription');
            toast.warning('Payment cancelled.');
          }}
        />
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default CheckoutPage;
