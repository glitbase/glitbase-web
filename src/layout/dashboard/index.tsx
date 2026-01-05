import PageLoader from '@/PageLoader';

const DashboardLayout = ({
  children,
  isLoading,
}: {
  children?: React.ReactNode;
  isLoading: boolean;
}) => {
  // Only show loader during actual loading state
  // The dashboard is publicly accessible, so we don't block rendering for unauthenticated users
  if (isLoading) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

export default DashboardLayout;
