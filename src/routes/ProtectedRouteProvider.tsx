// import { useAppSelector } from "@/hooks/redux-hooks";
// import { useLocation, useNavigate } from "react-router-dom";

import PageLoader from "@/PageLoader";

const ProtectedRouteProvider = ({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) => {
  // const isAuth = useAppSelector((state) => state.auth.isAuth);
  // const navigate = useNavigate();
  // const location = useLocation();
  // console.log(isAuth, isLoading);
  // useEffect(() => {
  //   if (!isAuth && !isLoading) {
  //     const currentURL = location.pathname;
  //     navigate(`/auth/login?next=${currentURL}`, { replace: true });
  //   }
  // }, [isAuth, isLoading]);

  return <>{isLoading ? <PageLoader /> : children}</>;
};

export default ProtectedRouteProvider;
