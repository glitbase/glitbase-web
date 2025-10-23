// import { useAppSelector } from "@/hooks/redux-hooks";
// import { useLocation, useNavigate } from "react-router-dom";

const ProtectedRouteProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};

export default ProtectedRouteProvider;
