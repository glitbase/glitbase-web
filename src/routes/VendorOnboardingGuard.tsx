import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  getOnboardingState,
  getStepRoute,
  OnboardingStep,
} from '@/utils/vendorOnboarding';
import { useState, useEffect } from 'react';
import PageLoader from '@/PageLoader';

interface VendorOnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * A guard component that checks if the user should be redirected to a specific onboarding step
 * based on their vendorOnboardingStatus and the current onboarding state in localStorage
 */
const VendorOnboardingGuard = ({ children }: VendorOnboardingGuardProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  console.log('VendorOnboardingGuard - Current location:', location.pathname);
  console.log('VendorOnboardingGuard - User:', user);

  // Use effect to handle the checking delay for smooth transitions
  useEffect(() => {
    // Small delay to allow smooth transitions
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [user, location.pathname]);

  // If user is not logged in or not a vendor, just render children
  if (!user || user.activeRole !== 'vendor') {
    console.log(
      'VendorOnboardingGuard - Not a vendor or not logged in, rendering children'
    );
    return <>{children}</>;
  }

  // If vendor onboarding is already completed, render children
  if (user.vendorOnboardingStatus === 'completed') {
    console.log(
      'VendorOnboardingGuard - Onboarding completed, rendering children'
    );
    return <>{children}</>;
  }

  // Check if user is already on a vendor onboarding route or profile setup
  const isOnOnboardingRoute =
    location.pathname.startsWith('/vendor/onboarding') ||
    location.pathname.startsWith('/auth/signup/profile');

  console.log(
    'VendorOnboardingGuard - Is on onboarding route:',
    isOnOnboardingRoute
  );

  // If already on an onboarding route, let them stay there
  if (isOnOnboardingRoute) {
    console.log(
      'VendorOnboardingGuard - Already on onboarding route, rendering children'
    );
    return <>{children}</>;
  }

  // Check localStorage for the current onboarding step
  const onboardingState = getOnboardingState();
  console.log('VendorOnboardingGuard - Onboarding state:', onboardingState);

  // If localStorage has been cleared (no currentStep and no completed steps),
  // it means onboarding is complete, so render children
  if (
    !onboardingState.currentStep &&
    onboardingState.completed.length === 0 &&
    Object.keys(onboardingState.data).length === 0
  ) {
    console.log(
      'VendorOnboardingGuard - localStorage cleared, assuming onboarding complete'
    );
    return <>{children}</>;
  }

  // Show loader while checking to prevent flash of dashboard
  if (isChecking) {
    console.log('VendorOnboardingGuard - Showing loader during check');
    return <PageLoader />;
  }

  // If there's a current step saved, redirect to that step
  if (onboardingState.currentStep) {
    const stepRoute = getStepRoute(onboardingState.currentStep);
    console.log(
      'VendorOnboardingGuard - Redirecting to step route:',
      stepRoute
    );
    return <Navigate to={stepRoute} replace />;
  }

  // Default: redirect to the first vendor onboarding step
  const defaultRoute = getStepRoute(OnboardingStep.STORE_SETUP);
  console.log(
    'VendorOnboardingGuard - Redirecting to default route:',
    defaultRoute
  );
  return <Navigate to={defaultRoute} replace />;
};

export default VendorOnboardingGuard;
