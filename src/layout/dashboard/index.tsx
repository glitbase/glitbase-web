import { useAppSelector } from '@/hooks/redux-hooks';
import PageLoader from '@/PageLoader';

const DashboardLayout = ({
  children,
  isLoading,
}: {
  children?: React.ReactNode;
  isLoading: boolean;
}) => {
  const user = useAppSelector((state) => state.auth.user);

  const shouldShowLoader = isLoading || !user;

  if (shouldShowLoader) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

export default DashboardLayout;
