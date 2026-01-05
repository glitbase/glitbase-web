import { useAppSelector } from '@/hooks/redux-hooks';
import { useLocation, Navigate } from 'react-router-dom';
import { 
  selectUser, 
  selectHasTokens, 
  selectIsInitialized,
  selectIsLoading 
} from '@/redux/auth/authSlice';
import PageLoader from '@/PageLoader';

interface ProtectedRouteProviderProps {
  children: React.ReactNode;
  requireVendor?: boolean;
}

/**
 * ProtectedRouteProvider - Unified auth guard
 * 
 * This is the SINGLE source of truth for route protection.
 * It waits for auth initialization before making redirect decisions.
 * 
 * Features:
 * - Shows loader while auth state is being determined
 * - Only redirects after we know the user is definitely not authenticated
 * - Optionally requires vendor role
 */
const ProtectedRouteProvider = ({
  children,
  requireVendor = false,
}: ProtectedRouteProviderProps) => {
  const user = useAppSelector(selectUser);
  const hasTokens = useAppSelector(selectHasTokens);
  const isInitialized = useAppSelector(selectIsInitialized);
  const isLoading = useAppSelector(selectIsLoading);
  const location = useLocation();

  // If we have tokens but user profile hasn't loaded yet, show loader
  // This prevents premature redirects that cause the sidebar navigation issue
  if (hasTokens && (!isInitialized || isLoading || !user)) {
    return <PageLoader />;
  }

  // If no tokens and not loading, redirect to login
  if (!hasTokens) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?returnUrl=${returnUrl}`} replace />;
  }

  // At this point we have tokens and user data
  // Check vendor requirement if specified
  if (requireVendor && user?.activeRole !== 'vendor') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRouteProvider;
