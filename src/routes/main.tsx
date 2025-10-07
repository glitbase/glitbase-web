import DashboardLayout from "@/layout/dashboard";

import React, { useEffect, useState } from "react";

import { Navigate, Route, Routes } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { useUserProfileQuery } from "@/redux/auth";
import {
  setUser,
  setReload,
  setEmail,
  setArrayUserToken,
  setUnauthenticated,
} from "@/redux/auth/authSlice";
import * as amplitude from "@amplitude/analytics-browser";
import Profile from "@/pages/profileInformation";
import OrderDetails from "@/pages/profileInformation/orderHistory/orderDetails";

const Home = React.lazy(() => import("@/pages/home"));

const Dashhboard = () => {

  const Comp = DashboardLayout;

  const dispatch = useAppDispatch();

  const reload = useAppSelector((state) => state.auth.reload);

  const [loadAccount, setLoadAccount] = useState(false);

  const {
    data: userProfile,
    isLoading: userLoading,
    refetch,
  } = useUserProfileQuery(undefined, {});

  useEffect(() => {
    if (reload) {
      refetch();
    }
  }, [reload]);
  useEffect(() => {
    if (!loadAccount) {
      setLoadAccount(true);
      // refresh();
    }
  }, [loadAccount]);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.data.isEmailVerified) {
        dispatch(setUser(userProfile));
        amplitude.setUserId(userProfile.data.email);
        dispatch(setReload(false));
        dispatch(setEmail(userProfile.data.email));
        dispatch(setArrayUserToken(userProfile.data.arrayUserToken));
      } else {
        dispatch(setUnauthenticated());
        logoutUser();
      }
    }
  }, [userProfile]);

  const logoutUser = async () => {
    dispatch(setUnauthenticated());
    localStorage.removeItem("token");
  };

  return (
    <Comp isLoading={userLoading}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home/profile" element={<Profile />} />
        <Route path="/order-details/:orderId" element={<OrderDetails />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Comp>
  );
};

export default Dashhboard;
