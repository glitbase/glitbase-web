/**
 * Utility functions for vendor onboarding
 * 
 * NOTE: This file has been refactored to REMOVE localStorage usage.
 * The server (user.vendorOnboardingStatus) is now the source of truth for onboarding state.
 * Step determination is based on what user data exists on the server.
 */

export enum OnboardingStep {
  PROFILE_SETUP = 1,
  STORE_SETUP = 3,
  CATEGORIES_SETUP = 4,
  VISIBILITY_SETUP = 5,
  LOCATION_SETUP = 6,
  PAYOUT_SETUP = 7,
  SUBSCRIPTION_SETUP = 8,
}

/**
 * Get the route for the current onboarding step
 */
export const getStepRoute = (step: OnboardingStep): string => {
  switch (step) {
    case OnboardingStep.PROFILE_SETUP:
      return '/auth/signup/profile';
    case OnboardingStep.STORE_SETUP:
      return '/vendor/onboarding';
    case OnboardingStep.CATEGORIES_SETUP:
      return '/vendor/onboarding/categories';
    case OnboardingStep.VISIBILITY_SETUP:
      return '/vendor/onboarding/visibility';
    case OnboardingStep.LOCATION_SETUP:
      return '/vendor/onboarding/location';
    case OnboardingStep.PAYOUT_SETUP:
      return '/vendor/onboarding/payout';
    case OnboardingStep.SUBSCRIPTION_SETUP:
      return '/vendor/onboarding/subscription';
    default:
      return '/vendor/onboarding';
  }
};

/**
 * Get the progress percentage for a given step
 */
export const getStepProgress = (step: OnboardingStep): number => {
  switch (step) {
    case OnboardingStep.PROFILE_SETUP:
      return 0;
    case OnboardingStep.STORE_SETUP:
      return 20;
    case OnboardingStep.CATEGORIES_SETUP:
      return 40;
    case OnboardingStep.VISIBILITY_SETUP:
      return 60;
    case OnboardingStep.LOCATION_SETUP:
      return 80;
    case OnboardingStep.PAYOUT_SETUP:
      return 90;
    case OnboardingStep.SUBSCRIPTION_SETUP:
      return 95;
    default:
      return 0;
  }
};

/**
 * Determine the current onboarding step based on user data from the server.
 * This replaces the localStorage-based state machine.
 * 
 * @param user - The user object from the server
 * @returns The current onboarding step, or null if complete
 */
export const determineCurrentStep = (user: any): OnboardingStep | null => {
  if (!user) return null;
  
  // If onboarding is complete, return null
  if (user.vendorOnboardingStatus === 'completed') {
    return null;
  }
  
  // Check profile completeness
  const hasProfile = user.firstName && user.lastName && user.phoneNumber && user.countryCode;
  if (!hasProfile) {
    return OnboardingStep.PROFILE_SETUP;
  }
  
  // Check if store exists
  if (!user.hasStore) {
    return OnboardingStep.STORE_SETUP;
  }
  
  // Check payout info
  if (!user.hasPayoutInfo) {
    return OnboardingStep.PAYOUT_SETUP;
  }
  
  // Check subscription
  if (!user.hasSubInfo) {
    return OnboardingStep.SUBSCRIPTION_SETUP;
  }
  
  // Default to store setup if status is not 'completed' but all data exists
  return OnboardingStep.STORE_SETUP;
};

/**
 * Check if onboarding is complete
 */
export const isOnboardingComplete = (user: any): boolean => {
  return user?.vendorOnboardingStatus === 'completed';
};

// ============================================================================
// DEPRECATED FUNCTIONS - These used localStorage and are no longer needed
// Kept as no-ops for backwards compatibility during migration
// ============================================================================

/** @deprecated No longer uses localStorage */
export const getOnboardingState = () => ({
  currentStep: OnboardingStep.PROFILE_SETUP,
  completed: [] as OnboardingStep[],
  data: {} as Record<string, any>,
});

/** @deprecated No longer uses localStorage */
export const updateOnboardingState = (_state: any) => ({
  currentStep: OnboardingStep.PROFILE_SETUP,
  completed: [] as OnboardingStep[],
  data: {} as Record<string, any>,
});

/** @deprecated No longer uses localStorage */
export const completeStep = (_step: OnboardingStep, _nextStep?: OnboardingStep) => ({
  currentStep: OnboardingStep.PROFILE_SETUP,
  completed: [] as OnboardingStep[],
  data: {} as Record<string, any>,
});

/** @deprecated No longer uses localStorage */
export const clearOnboardingState = () => {
  // No-op - localStorage is no longer used
};
