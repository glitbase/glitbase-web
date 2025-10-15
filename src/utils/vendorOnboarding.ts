/**
 * Utility functions for managing vendor onboarding state in localStorage
 */

export const VENDOR_ONBOARDING_KEY = 'vendorOnboardingState';

export enum OnboardingStep {
  PROFILE_SETUP = 1,
  STORE_SETUP = 3,
  CATEGORIES_SETUP = 4,
  VISIBILITY_SETUP = 5,
  LOCATION_SETUP = 6,
  PAYOUT_SETUP = 7,
  SUBSCRIPTION_SETUP = 8,
}

export interface VendorOnboardingState {
  currentStep: OnboardingStep;
  completed: OnboardingStep[];
  data: {
    isOnlineOnly?: boolean;
    // Profile data
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    countryName?: string;

    // Store data
    storeName?: string;
    storeTypes?: string[];
    storeDescription?: string;
    bannerImageUrl?: string;
    profileImageUrl?: string;

    // Categories data
    categories?: string[];

    // Visibility data
    tags?: string[];

    // Location data
    location?: {
      name: string;
      address: string;
      city: string;
      state: string;
      zipcode: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };

    // Payout data
    payoutInfo?: {
      fullName: string;
      accountNumber: string;
      bankName: string;
      sortCode?: string;
    };

    // Subscription data
    subscriptionType?: string;
    planId?: string;
  };
}

/**
 * Initialize or get the vendor onboarding state from localStorage
 */
export const getOnboardingState = (): VendorOnboardingState => {
  const storedState = localStorage.getItem(VENDOR_ONBOARDING_KEY);
  if (storedState) {
    return JSON.parse(storedState);
  }

  // Default initial state
  return {
    currentStep: OnboardingStep.PROFILE_SETUP,
    completed: [],
    data: {},
  };
};

/**
 * Update the vendor onboarding state in localStorage
 */
export const updateOnboardingState = (
  state: Partial<VendorOnboardingState>
): VendorOnboardingState => {
  const currentState = getOnboardingState();
  const updatedState = {
    ...currentState,
    ...state,
    data: {
      ...currentState.data,
      ...(state.data || {}),
    },
  };

  localStorage.setItem(VENDOR_ONBOARDING_KEY, JSON.stringify(updatedState));
  return updatedState;
};

/**
 * Mark a step as completed and update the current step
 */
export const completeStep = (
  step: OnboardingStep,
  nextStep?: OnboardingStep
): VendorOnboardingState => {
  const currentState = getOnboardingState();

  // Add the completed step if not already in the list
  const completed = [...currentState.completed];
  if (!completed.includes(step)) {
    completed.push(step);
  }

  // Update the current step if provided
  const updatedState = {
    ...currentState,
    completed,
    currentStep: nextStep || currentState.currentStep,
  };

  localStorage.setItem(VENDOR_ONBOARDING_KEY, JSON.stringify(updatedState));
  return updatedState;
};

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
      return 0; // Profile setup is handled separately
    case OnboardingStep.STORE_SETUP:
      return 20;
    case OnboardingStep.CATEGORIES_SETUP:
      return 66;
    case OnboardingStep.VISIBILITY_SETUP:
      return 83;
    case OnboardingStep.LOCATION_SETUP:
      return 100;
    case OnboardingStep.PAYOUT_SETUP:
      return 100;
    case OnboardingStep.SUBSCRIPTION_SETUP:
      return 100;
    default:
      return 0;
  }
};

/**
 * Clear the onboarding state from localStorage
 */
export const clearOnboardingState = (): void => {
  localStorage.removeItem(VENDOR_ONBOARDING_KEY);
};
