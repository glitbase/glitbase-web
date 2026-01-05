import { useAppSelector } from '@/hooks/redux-hooks';
import { Navigate } from 'react-router-dom';
import { 
  selectUser, 
  selectHasTokens, 
  selectIsInitialized 
} from '@/redux/auth/authSlice';
import PageLoader from '@/PageLoader';

interface VendorRouteGuardProps {
  children: React.ReactNode;
}

/**
 * VendorRouteGuard
 * 
 * Ensures user has vendor role. Use AFTER ProtectedRouteProvider.
 * This guard assumes authentication is already verified.
 * 
 * Logic:
 * - While loading user data, show loader (don't redirect)
 * - Once loaded, check if user is a vendor
 * - Non-vendors are redirected to homepage
 */
const VendorRouteGuard = ({ children }: VendorRouteGuardProps) => {
  const user = useAppSelector(selectUser);
  const hasTokens = useAppSelector(selectHasTokens);
  const isInitialized = useAppSelector(selectIsInitialized);

  // If we have tokens but user hasn't loaded yet, wait
  // This prevents the redirect loop when user data is still loading
  if (hasTokens && !isInitialized) {
    return <PageLoader />;
  }

  // If we have tokens and user is loaded but not initialized somehow, wait
  if (hasTokens && !user) {
    return <PageLoader />;
  }

  // Check if user has vendor role
  const isVendor = user?.activeRole === 'vendor';

  if (!isVendor) {
    // Redirect non-vendor users to homepage
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default VendorRouteGuard;
