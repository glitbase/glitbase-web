import { useState, useEffect, useCallback, useRef } from 'react';
import {
  VendorOnboardingMachine,
  OnboardingState,
  OnboardingContext,
} from '@/state/vendorOnboardingMachine';
import { useAppSelector } from './redux-hooks';

interface UseOnboardingStateMachineReturn {
  currentState: OnboardingState;
  completedSteps: OnboardingState[];
  canGoBack: boolean;
  canGoNext: boolean;
  progress: number;
  next: () => boolean;
  previous: () => boolean;
  jumpTo: (state: OnboardingState) => boolean;
  complete: () => boolean;
  reset: () => boolean;
  isStepCompleted: (state: OnboardingState) => boolean;
}

/**
 * useOnboardingStateMachine
 *
 * React hook that manages the vendor onboarding state machine.
 * Provides state and actions for controlling onboarding flow.
 *
 * Usage:
 * ```tsx
 * const { currentState, next, previous, canGoNext } = useOnboardingStateMachine();
 *
 * // In a form submission handler:
 * if (formIsValid) {
 *   next(); // Automatically moves to next step
 * }
 * ```
 *
 * @returns State machine interface with current state and actions
 */
export function useOnboardingStateMachine(): UseOnboardingStateMachineReturn {
  const user = useAppSelector((state) => state.auth.user);
  const machineRef = useRef<VendorOnboardingMachine | null>(null);

  // Initialize state from server if available
  const getInitialState = useCallback((): OnboardingState => {
    if (!user || user.activeRole !== 'vendor') {
      return OnboardingState.NOT_STARTED;
    }

    // If onboarding is completed on server, return COMPLETED
    if (user.vendorOnboardingStatus === 'completed') {
      return OnboardingState.COMPLETED;
    }

    // Determine current step based on what's completed
    const hasProfile =
      user.firstName &&
      user.lastName &&
      user.phoneNumber &&
      user.countryCode &&
      user.countryName;

    if (!hasProfile) {
      return OnboardingState.PROFILE_SETUP;
    } else if (!user.hasStoreInfo) {
      return OnboardingState.STORE_SETUP;
    } else if (!user.hasCategoriesInfo) {
      return OnboardingState.CATEGORIES_SETUP;
    } else if (!user.hasVisibilityInfo) {
      return OnboardingState.VISIBILITY_SETUP;
    } else if (!user.hasLocationInfo) {
      return OnboardingState.LOCATION_SETUP;
    } else if (!user.hasPayoutInfo) {
      return OnboardingState.PAYOUT_SETUP;
    } else if (!user.hasSubInfo) {
      return OnboardingState.SUBSCRIPTION_SETUP;
    } else {
      return OnboardingState.STORE_SETUP; // Default to first step
    }
  }, [user]);

  // Initialize or update machine when user changes
  useEffect(() => {
    const initialState = getInitialState();

    if (!machineRef.current) {
      machineRef.current = new VendorOnboardingMachine(initialState);
    } else {
      // Update machine if server state changed
      const currentMachineState = machineRef.current.getCurrentState();
      if (currentMachineState !== initialState) {
        machineRef.current.jumpTo(initialState);
      }
    }
  }, [getInitialState]);

  // Subscribe to machine state changes
  const [context, setContext] = useState<OnboardingContext>(() => {
    if (!machineRef.current) {
      machineRef.current = new VendorOnboardingMachine(getInitialState());
    }
    return machineRef.current.getContext();
  });

  useEffect(() => {
    if (!machineRef.current) return;

    const unsubscribe = machineRef.current.subscribe((newContext) => {
      setContext(newContext);
    });

    return unsubscribe;
  }, []);

  // Actions
  const next = useCallback(() => {
    return machineRef.current?.next() ?? false;
  }, []);

  const previous = useCallback(() => {
    return machineRef.current?.previous() ?? false;
  }, []);

  const jumpTo = useCallback((state: OnboardingState) => {
    return machineRef.current?.jumpTo(state) ?? false;
  }, []);

  const complete = useCallback(() => {
    return machineRef.current?.complete() ?? false;
  }, []);

  const reset = useCallback(() => {
    return machineRef.current?.reset() ?? false;
  }, []);

  const isStepCompleted = useCallback(
    (state: OnboardingState) => {
      return machineRef.current?.isStepCompleted(state) ?? false;
    },
    [context.completedSteps] // Re-evaluate when completed steps change
  );

  return {
    currentState: context.currentState,
    completedSteps: context.completedSteps,
    canGoBack: context.canGoBack,
    canGoNext: context.canGoNext,
    progress: context.progress,
    next,
    previous,
    jumpTo,
    complete,
    reset,
    isStepCompleted,
  };
}
