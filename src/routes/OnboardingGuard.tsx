import { useAppSelector } from '@/hooks/redux-hooks';
import { useLocation, Navigate } from 'react-router-dom';
import { selectHasTokens, selectIsInitialized } from '@/redux/auth/authSlice';
import PageLoader from '@/PageLoader';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard
 *
 * Simple authentication guard for onboarding routes.
 * Purpose: Ensure user is authenticated before accessing onboarding steps.
 *
 * Logic:
 * - If user has tokens → allow access
 * - If no tokens → redirect to login with return URL
 */
const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const hasTokens = useAppSelector(selectHasTokens);
  const isInitialized = useAppSelector(selectIsInitialized);
  const location = useLocation();

  // Wait for auth to initialize
  if (!isInitialized && hasTokens) {
    return <PageLoader />;
  }

  if (!hasTokens) {
    // Redirect to login with return URL so user can come back after logging in
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?returnUrl=${returnUrl}`} replace />;
  }

  // User is authenticated, allow access to onboarding
  return <>{children}</>;
};

export default OnboardingGuard;
