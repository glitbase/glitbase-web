/**
 * Vendor Onboarding State Machine
 *
 * A lightweight state machine for managing vendor onboarding flow.
 * Provides clear states, transitions, and guards to prevent invalid state changes.
 *
 * No external dependencies (no XState) - simple, maintainable, and easy to understand.
 */

export enum OnboardingState {
  NOT_STARTED = 'NOT_STARTED',
  PROFILE_SETUP = 'PROFILE_SETUP',
  STORE_SETUP = 'STORE_SETUP',
  CATEGORIES_SETUP = 'CATEGORIES_SETUP',
  VISIBILITY_SETUP = 'VISIBILITY_SETUP',
  LOCATION_SETUP = 'LOCATION_SETUP',
  PAYOUT_SETUP = 'PAYOUT_SETUP',
  SUBSCRIPTION_SETUP = 'SUBSCRIPTION_SETUP',
  CHECKOUT = 'CHECKOUT',
  CHECKOUT_SUCCESS = 'CHECKOUT_SUCCESS',
  COMPLETED = 'COMPLETED',
}

export interface OnboardingContext {
  currentState: OnboardingState;
  completedSteps: OnboardingState[];
  canGoBack: boolean;
  canGoNext: boolean;
  progress: number; // 0-100
}

export type OnboardingEvent =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'JUMP_TO'; state: OnboardingState }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

/**
 * State machine configuration
 * Maps current state to possible next states
 */
const stateTransitions: Record<OnboardingState, OnboardingState[]> = {
  [OnboardingState.NOT_STARTED]: [OnboardingState.PROFILE_SETUP],
  [OnboardingState.PROFILE_SETUP]: [
    OnboardingState.STORE_SETUP,
    OnboardingState.NOT_STARTED,
  ],
  [OnboardingState.STORE_SETUP]: [
    OnboardingState.CATEGORIES_SETUP,
    OnboardingState.PROFILE_SETUP,
  ],
  [OnboardingState.CATEGORIES_SETUP]: [
    OnboardingState.VISIBILITY_SETUP,
    OnboardingState.STORE_SETUP,
  ],
  [OnboardingState.VISIBILITY_SETUP]: [
    OnboardingState.LOCATION_SETUP,
    OnboardingState.CATEGORIES_SETUP,
  ],
  [OnboardingState.LOCATION_SETUP]: [
    OnboardingState.PAYOUT_SETUP,
    OnboardingState.VISIBILITY_SETUP,
  ],
  [OnboardingState.PAYOUT_SETUP]: [
    OnboardingState.SUBSCRIPTION_SETUP,
    OnboardingState.LOCATION_SETUP,
  ],
  [OnboardingState.SUBSCRIPTION_SETUP]: [
    OnboardingState.CHECKOUT,
    OnboardingState.PAYOUT_SETUP,
  ],
  [OnboardingState.CHECKOUT]: [
    OnboardingState.CHECKOUT_SUCCESS,
    OnboardingState.SUBSCRIPTION_SETUP,
  ],
  [OnboardingState.CHECKOUT_SUCCESS]: [OnboardingState.COMPLETED],
  [OnboardingState.COMPLETED]: [], // Terminal state
};

/**
 * Ordered list of states for progress calculation
 */
const stateOrder = [
  OnboardingState.NOT_STARTED,
  OnboardingState.PROFILE_SETUP,
  OnboardingState.STORE_SETUP,
  OnboardingState.CATEGORIES_SETUP,
  OnboardingState.VISIBILITY_SETUP,
  OnboardingState.LOCATION_SETUP,
  OnboardingState.PAYOUT_SETUP,
  OnboardingState.SUBSCRIPTION_SETUP,
  OnboardingState.CHECKOUT,
  OnboardingState.CHECKOUT_SUCCESS,
  OnboardingState.COMPLETED,
];

/**
 * Calculate progress percentage based on current state
 */
function calculateProgress(state: OnboardingState): number {
  const index = stateOrder.indexOf(state);
  if (index === -1) return 0;
  return Math.round((index / (stateOrder.length - 1)) * 100);
}

/**
 * Check if transition from currentState to nextState is valid
 */
function canTransition(
  currentState: OnboardingState,
  nextState: OnboardingState
): boolean {
  const allowedTransitions = stateTransitions[currentState] || [];
  return allowedTransitions.includes(nextState);
}

/**
 * Get next state in the sequence
 */
function getNextState(currentState: OnboardingState): OnboardingState | null {
  const index = stateOrder.indexOf(currentState);
  if (index === -1 || index === stateOrder.length - 1) return null;
  return stateOrder[index + 1];
}

/**
 * Get previous state in the sequence
 */
function getPreviousState(
  currentState: OnboardingState
): OnboardingState | null {
  const index = stateOrder.indexOf(currentState);
  if (index <= 0) return null;
  return stateOrder[index - 1];
}

/**
 * State machine class
 */
export class VendorOnboardingMachine {
  private context: OnboardingContext;
  private listeners: Set<(context: OnboardingContext) => void> = new Set();

  constructor(initialState: OnboardingState = OnboardingState.NOT_STARTED) {
    this.context = {
      currentState: initialState,
      completedSteps: [],
      canGoBack: getPreviousState(initialState) !== null,
      canGoNext: getNextState(initialState) !== null,
      progress: calculateProgress(initialState),
    };
  }

  /**
   * Get current context
   */
  getContext(): OnboardingContext {
    return { ...this.context };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (context: OnboardingContext) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify() {
    this.listeners.forEach((listener) => listener(this.getContext()));
  }

  /**
   * Transition to a new state
   */
  private transition(newState: OnboardingState): boolean {
    if (!canTransition(this.context.currentState, newState)) {
      console.warn(
        `Invalid transition from ${this.context.currentState} to ${newState}`
      );
      return false;
    }

    // Mark current state as completed before transitioning
    if (!this.context.completedSteps.includes(this.context.currentState)) {
      this.context.completedSteps.push(this.context.currentState);
    }

    this.context.currentState = newState;
    this.context.canGoBack = getPreviousState(newState) !== null;
    this.context.canGoNext = getNextState(newState) !== null;
    this.context.progress = calculateProgress(newState);

    this.notify();
    return true;
  }

  /**
   * Send an event to the state machine
   */
  send(event: OnboardingEvent): boolean {
    switch (event.type) {
      case 'NEXT': {
        const nextState = getNextState(this.context.currentState);
        if (nextState) {
          return this.transition(nextState);
        }
        return false;
      }

      case 'PREVIOUS': {
        const prevState = getPreviousState(this.context.currentState);
        if (prevState) {
          return this.transition(prevState);
        }
        return false;
      }

      case 'JUMP_TO': {
        return this.transition(event.state);
      }

      case 'COMPLETE': {
        return this.transition(OnboardingState.COMPLETED);
      }

      case 'RESET': {
        this.context = {
          currentState: OnboardingState.NOT_STARTED,
          completedSteps: [],
          canGoBack: false,
          canGoNext: true,
          progress: 0,
        };
        this.notify();
        return true;
      }

      default:
        return false;
    }
  }

  /**
   * Go to next step
   */
  next(): boolean {
    return this.send({ type: 'NEXT' });
  }

  /**
   * Go to previous step
   */
  previous(): boolean {
    return this.send({ type: 'PREVIOUS' });
  }

  /**
   * Jump to a specific step (if valid transition)
   */
  jumpTo(state: OnboardingState): boolean {
    return this.send({ type: 'JUMP_TO', state });
  }

  /**
   * Complete onboarding
   */
  complete(): boolean {
    return this.send({ type: 'COMPLETE' });
  }

  /**
   * Reset to initial state
   */
  reset(): boolean {
    return this.send({ type: 'RESET' });
  }

  /**
   * Check if a specific step is completed
   */
  isStepCompleted(state: OnboardingState): boolean {
    return this.context.completedSteps.includes(state);
  }

  /**
   * Get current state
   */
  getCurrentState(): OnboardingState {
    return this.context.currentState;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return this.context.progress;
  }
}

/**
 * Singleton instance for global state machine
 * (can be replaced with React Context or Redux if needed)
 */
let globalMachine: VendorOnboardingMachine | null = null;

export function getGlobalMachine(): VendorOnboardingMachine {
  if (!globalMachine) {
    globalMachine = new VendorOnboardingMachine();
  }
  return globalMachine;
}

export function resetGlobalMachine() {
  globalMachine = null;
}
