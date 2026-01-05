import { ReactNode } from 'react';
import PageLoader from '@/PageLoader';

interface OnboardingLayoutProps {
  children: ReactNode;
  isLoading?: boolean;
}

/**
 * OnboardingLayout
 *
 * Simple layout wrapper for onboarding routes (ProfileSetup, InterestsSelection, etc.)
 * This layout is specifically for authenticated users completing their onboarding flow.
 *
 * No complex navigation logic - just a clean container for onboarding pages.
 * The pages themselves handle their own navigation after completion.
 */
const OnboardingLayout = ({ children, isLoading = false }: OnboardingLayoutProps) => {
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {children}
    </div>
  );
};

export default OnboardingLayout;
