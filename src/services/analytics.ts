/**
 * Analytics Service
 *
 * Wrapper around amplitude for onboarding-specific tracking.
 * Provides structured event tracking for monitoring and debugging onboarding flow.
 */

import * as amplitude from '@amplitude/analytics-browser';

export interface OnboardingMetadata {
  userRole?: 'vendor' | 'customer';
  userId?: string;
  email?: string;
  stepNumber?: number;
  totalSteps?: number;
  [key: string]: any;
}

export interface ErrorMetadata {
  errorMessage?: string;
  errorStack?: string;
  componentStack?: string;
  [key: string]: any;
}

class AnalyticsService {
  private sessionStartTime: number | null = null;
  private stepStartTimes: Map<string, number> = new Map();

  /**
   * Track onboarding step started
   */
  trackOnboardingStepStarted(
    step: string,
    metadata: OnboardingMetadata = {}
  ): void {
    const now = Date.now();
    this.stepStartTimes.set(step, now);

    amplitude.track('Onboarding Step Started', {
      step,
      timestamp: now,
      ...metadata,
    });

    console.log(`📊 Analytics: Onboarding Step Started - ${step}`, metadata);
  }

  /**
   * Track onboarding step completed
   */
  trackOnboardingStepCompleted(
    step: string,
    metadata: OnboardingMetadata = {}
  ): void {
    const now = Date.now();
    const startTime = this.stepStartTimes.get(step);
    const duration = startTime ? now - startTime : null;

    amplitude.track('Onboarding Step Completed', {
      step,
      duration,
      timestamp: now,
      ...metadata,
    });

    console.log(
      `📊 Analytics: Onboarding Step Completed - ${step}`,
      {
        duration: duration ? `${duration}ms` : 'unknown',
        ...metadata,
      }
    );

    // Clean up
    this.stepStartTimes.delete(step);
  }

  /**
   * Track onboarding abandoned
   */
  trackOnboardingAbandoned(
    step: string,
    reason: string,
    metadata: OnboardingMetadata = {}
  ): void {
    amplitude.track('Onboarding Abandoned', {
      step,
      reason,
      timestamp: Date.now(),
      ...metadata,
    });

    console.log(`📊 Analytics: Onboarding Abandoned at ${step}`, {
      reason,
      ...metadata,
    });
  }

  /**
   * Track entire onboarding completed
   */
  trackOnboardingCompleted(metadata: OnboardingMetadata = {}): void {
    const now = Date.now();
    const totalDuration = this.sessionStartTime ? now - this.sessionStartTime : null;

    amplitude.track('Onboarding Completed', {
      totalDuration,
      timestamp: now,
      ...metadata,
    });

    console.log(`📊 Analytics: Onboarding Completed`, {
      totalDuration: totalDuration ? `${totalDuration}ms` : 'unknown',
      ...metadata,
    });

    // Clean up
    this.sessionStartTime = null;
    this.stepStartTimes.clear();
  }

  /**
   * Track onboarding error
   */
  trackOnboardingError(
    step: string,
    error: Error | string,
    metadata: ErrorMetadata = {}
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    amplitude.track('Onboarding Error', {
      step,
      errorMessage,
      errorStack,
      timestamp: Date.now(),
      ...metadata,
    });

    console.error(`📊 Analytics: Onboarding Error at ${step}`, {
      errorMessage,
      errorStack,
      ...metadata,
    });
  }

  /**
   * Track navigation loop detected
   */
  trackNavigationLoop(
    path: string,
    count: number,
    navigationHistory: any[]
  ): void {
    amplitude.track('Navigation Loop Detected', {
      path,
      count,
      timestamp: Date.now(),
      navigationHistory: navigationHistory.slice(-10), // Last 10 navigations
    });

    console.error(`📊 Analytics: Navigation Loop Detected`, {
      path,
      count,
      recentHistory: navigationHistory.slice(-10),
    });
  }

  /**
   * Track guard redirect
   */
  trackGuardRedirect(
    guardName: string,
    from: string,
    to: string,
    reason: string,
    metadata: Record<string, any> = {}
  ): void {
    amplitude.track('Guard Redirect', {
      guardName,
      from,
      to,
      reason,
      timestamp: Date.now(),
      ...metadata,
    });

    console.log(`📊 Analytics: Guard Redirect - ${guardName}`, {
      from,
      to,
      reason,
      ...metadata,
    });
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata: Record<string, any> = {}): void {
    amplitude.track('Page View', {
      page,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Track form interaction
   */
  trackFormInteraction(
    formName: string,
    action: 'start' | 'submit' | 'error',
    metadata: Record<string, any> = {}
  ): void {
    amplitude.track('Form Interaction', {
      formName,
      action,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Track button click
   */
  trackButtonClick(
    buttonName: string,
    location: string,
    metadata: Record<string, any> = {}
  ): void {
    amplitude.track('Button Click', {
      buttonName,
      location,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Start onboarding session
   */
  startOnboardingSession(): void {
    this.sessionStartTime = Date.now();
    amplitude.track('Onboarding Session Started', {
      timestamp: this.sessionStartTime,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    const identifyEvent = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    amplitude.identify(identifyEvent);
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties: Record<string, any> = {}): void {
    amplitude.track(eventName, {
      ...properties,
      timestamp: Date.now(),
    });
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
