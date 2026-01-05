import { useAppSelector } from './redux-hooks';
import { useMemo } from 'react';
import { 
  selectUser, 
  selectHasTokens, 
  selectIsInitialized 
} from '@/redux/auth/authSlice';
import { OnboardingStep, determineCurrentStep } from '@/utils/vendorOnboarding';

interface VendorOnboardingStatus {
  /**
   * Whether the vendor has completed all onboarding steps
   */
  isComplete: boolean;

  /**
   * Current onboarding step the vendor should be on
   * Returns null if onboarding is complete or user is not a vendor
   */
  currentStep: OnboardingStep | null;

  /**
   * Whether the user needs to complete onboarding
   * True if user is a vendor and onboarding is not complete
   */
  needsOnboarding: boolean;

  /**
   * Whether we're still loading user data
   */
  isLoading: boolean;

  /**
   * Server's onboarding status
   */
  serverStatus: 'completed' | 'in-progress' | null;
}

/**
 * useVendorOnboardingStatus
 *
 * Centralized hook for determining vendor onboarding status.
 * Single source of truth: server's user.vendorOnboardingStatus field.
 *
 * This hook uses Redux state - NO localStorage.
 *
 * @returns VendorOnboardingStatus object with onboarding state
 */
export const useVendorOnboardingStatus = (): VendorOnboardingStatus => {
  const user = useAppSelector(selectUser);
  const hasTokens = useAppSelector(selectHasTokens);
  const isInitialized = useAppSelector(selectIsInitialized);

  // Consider loading if we have tokens but user data hasn't loaded yet
  const isLoading = hasTokens && !isInitialized;

  return useMemo(() => {
    // If no user or user is not a vendor, return default state
    if (!user || user.activeRole !== 'vendor') {
      return {
        isComplete: false,
        currentStep: null,
        needsOnboarding: false,
        isLoading,
        serverStatus: null,
      };
    }

    // Get server status (single source of truth)
    const serverStatus = user.vendorOnboardingStatus as
      | 'completed'
      | 'in-progress'
      | null;
    const isComplete = serverStatus === 'completed';
    const needsOnboarding = !isComplete;

    // Determine current step based on user data from server
    const currentStep = needsOnboarding ? determineCurrentStep(user) : null;

    return {
      isComplete,
      currentStep,
      needsOnboarding,
      isLoading,
      serverStatus,
    };
  }, [user, isLoading]);
};
