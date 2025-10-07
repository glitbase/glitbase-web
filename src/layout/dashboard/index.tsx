import ProtectedRouteProvider from "@/routes/ProtectedRouteProvider";
import { useAppSelector } from "@/hooks/redux-hooks";

const DashboardLayout = ({
  children,
  isLoading,
}: {
  children?: React.ReactNode;
  isLoading: boolean;
}) => {
  const user = useAppSelector((state) => state.auth.user);
  console.log(user);

  console.log(user);

  return (
    <ProtectedRouteProvider isLoading={isLoading}>
      {children}
    </ProtectedRouteProvider>
  );
};
export default DashboardLayout;
