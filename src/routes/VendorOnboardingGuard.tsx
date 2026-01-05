import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux-hooks';
import { selectUser, selectIsInitialized, selectHasTokens } from '@/redux/auth/authSlice';
import { determineCurrentStep, getStepRoute } from '@/utils/vendorOnboarding';
import PageLoader from '@/PageLoader';

interface VendorOnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * VendorOnboardingGuard
 *
 * Guard for vendor dashboard routes that require completed onboarding.
 * Uses server data (user profile) to determine onboarding status.
 *
 * Logic:
 * - Wait for user data to load before making decisions
 * - Non-vendors → allow access (they'll be caught by VendorRouteGuard)
 * - Vendors with completed onboarding → allow access
 * - Vendors with incomplete onboarding → redirect to current step
 * - Already on onboarding route → allow access (safety check)
 */
const VendorOnboardingGuard = ({ children }: VendorOnboardingGuardProps) => {
  const location = useLocation();
  const user = useAppSelector(selectUser);
  const isInitialized = useAppSelector(selectIsInitialized);
  const hasTokens = useAppSelector(selectHasTokens);

  // Wait for user data to load before making decisions
  if (hasTokens && !isInitialized) {
    return <PageLoader />;
  }

  if (hasTokens && !user) {
    return <PageLoader />;
  }

  // Safety check: if already on onboarding route, allow access
  const isOnOnboardingRoute =
    location.pathname.startsWith('/vendor/onboarding') ||
    location.pathname.startsWith('/auth/signup');

  if (isOnOnboardingRoute) {
    return <>{children}</>;
  }

  // Non-vendors pass through (VendorRouteGuard handles this)
  if (!user || user.activeRole !== 'vendor') {
    return <>{children}</>;
  }

  // Check onboarding status from server data
  const isComplete = user.vendorOnboardingStatus === 'completed';

  // If onboarding is complete, allow access
  if (isComplete) {
    return <>{children}</>;
  }

  // Determine current step from server user data
  const currentStep = determineCurrentStep(user);
  
  if (currentStep) {
    const stepRoute = getStepRoute(currentStep);
    return <Navigate to={stepRoute} replace />;
  }

  // Default: redirect to first onboarding step
  return <Navigate to="/vendor/onboarding" replace />;
};

export default VendorOnboardingGuard;
