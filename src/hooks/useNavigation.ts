import { useCallback } from 'react';
import { useNavigate as useReactRouterNavigate } from 'react-router-dom';

interface NavigateOptions {
  replace?: boolean;
}

interface UseNavigationReturn {
  navigate: (path: string, options?: NavigateOptions) => void;
}

/**
 * useNavigation
 *
 * Simple wrapper around react-router's useNavigate.
 * The complex navigation service with priority system has been removed
 * since routing is now handled properly by unified route guards.
 *
 * Usage:
 * ```tsx
 * const { navigate } = useNavigation();
 * navigate('/vendor/onboarding');
 * navigate('/auth/login', { replace: true });
 * ```
 */
export function useNavigation(): UseNavigationReturn {
  const reactRouterNavigate = useReactRouterNavigate();

  const navigate = useCallback(
    (path: string, options: NavigateOptions = {}) => {
      const { replace = false } = options;
      reactRouterNavigate(path, { replace });
    },
    [reactRouterNavigate]
  );

  return {
    navigate,
  };
}

export default useNavigation;
