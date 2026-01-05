import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import AuthLayout from '@/layout/auth';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import success from '@/assets/images/success.png';

const CheckoutSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any checkout-related session data
    sessionStorage.removeItem('checkoutSession');
  }, []);

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={100} currentStep={8} showLogout={false}>
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <img src={success} alt="success" />
            </div>

            <h1 className="text-3xl font-semibold font-[lora] mb-3">
              Your store is now live on Glitbase!
            </h1>

            <p className="text-gray-600 mb-2">
              Your 7-day free trial has started
            </p>

            <p className="text-sm text-gray-500 mb-8">
              You won't be charged until your trial ends. Start accepting bookings and growing your business today!
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
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default CheckoutSuccess;
