import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import analyticsService, { OnboardingMetadata } from '@/services/analytics';
import { useAppSelector } from './redux-hooks';

interface UseOnboardingAnalyticsOptions {
  stepName?: string;
  autoTrackPageView?: boolean;
}

interface UseOnboardingAnalyticsReturn {
  trackStepStarted: (metadata?: OnboardingMetadata) => void;
  trackStepCompleted: (metadata?: OnboardingMetadata) => void;
  trackError: (error: Error | string, metadata?: any) => void;
  trackAbandoned: (reason: string, metadata?: OnboardingMetadata) => void;
  trackFormInteraction: (action: 'start' | 'submit' | 'error', metadata?: any) => void;
  trackButtonClick: (buttonName: string, metadata?: any) => void;
}

/**
 * useOnboardingAnalytics
 *
 * Convenience hook for tracking onboarding events.
 * Automatically tracks page views and provides easy-to-use tracking methods.
 *
 * Usage:
 * ```tsx
 * function ProfileSetup() {
 *   const { trackStepCompleted, trackError } = useOnboardingAnalytics({
 *     stepName: 'ProfileSetup',
 *     autoTrackPageView: true,
 *   });
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await submitProfile();
 *       trackStepCompleted({ hasAllFields: true });
 *       navigate('/next-step');
 *     } catch (error) {
 *       trackError(error);
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useOnboardingAnalytics(
  options: UseOnboardingAnalyticsOptions = {}
): UseOnboardingAnalyticsReturn {
  const { stepName, autoTrackPageView = true } = options;
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const hasTrackedPageView = useRef(false);

  // Get common metadata
  const getCommonMetadata = (): OnboardingMetadata => {
    return {
      userRole: user?.activeRole,
      userId: user?.id,
      email: user?.email,
      currentPath: location.pathname,
    };
  };

  // Auto-track page view on mount
  useEffect(() => {
    if (autoTrackPageView && !hasTrackedPageView.current) {
      analyticsService.trackPageView(stepName || location.pathname, {
        ...getCommonMetadata(),
      });
      hasTrackedPageView.current = true;
    }
  }, [autoTrackPageView, stepName, location.pathname]);

  // Auto-track step started on mount
  useEffect(() => {
    if (stepName) {
      analyticsService.trackOnboardingStepStarted(stepName, getCommonMetadata());
    }
  }, [stepName]);

  // Track step completed
  const trackStepCompleted = (metadata: OnboardingMetadata = {}) => {
    if (!stepName) {
      console.warn('trackStepCompleted called without stepName');
      return;
    }
    analyticsService.trackOnboardingStepCompleted(stepName, {
      ...getCommonMetadata(),
      ...metadata,
    });
  };

  // Track step started (manual, if auto-track is not enough)
  const trackStepStarted = (metadata: OnboardingMetadata = {}) => {
    if (!stepName) {
      console.warn('trackStepStarted called without stepName');
      return;
    }
    analyticsService.trackOnboardingStepStarted(stepName, {
      ...getCommonMetadata(),
      ...metadata,
    });
  };

  // Track error
  const trackError = (error: Error | string, metadata: any = {}) => {
    analyticsService.trackOnboardingError(
      stepName || location.pathname,
      error,
      {
        ...getCommonMetadata(),
        ...metadata,
      }
    );
  };

  // Track abandoned
  const trackAbandoned = (reason: string, metadata: OnboardingMetadata = {}) => {
    analyticsService.trackOnboardingAbandoned(
      stepName || location.pathname,
      reason,
      {
        ...getCommonMetadata(),
        ...metadata,
      }
    );
  };

  // Track form interaction
  const trackFormInteraction = (
    action: 'start' | 'submit' | 'error',
    metadata: any = {}
  ) => {
    analyticsService.trackFormInteraction(
      stepName || location.pathname,
      action,
      {
        ...getCommonMetadata(),
        ...metadata,
      }
    );
  };

  // Track button click
  const trackButtonClick = (buttonName: string, metadata: any = {}) => {
    analyticsService.trackButtonClick(
      buttonName,
      stepName || location.pathname,
      {
        ...getCommonMetadata(),
        ...metadata,
      }
    );
  };

  return {
    trackStepStarted,
    trackStepCompleted,
    trackError,
    trackAbandoned,
    trackFormInteraction,
    trackButtonClick,
  };
}
