import DashboardLayout from '@/layout/dashboard';

import React, { useEffect, useState } from 'react';

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { useUserProfileQuery } from '@/redux/auth';
import {
  setUser,
  setReload,
  setEmail,
  setArrayUserToken,
  setUnauthenticated,
} from '@/redux/auth/authSlice';
import * as amplitude from '@amplitude/analytics-browser';
import Profile from '@/pages/profileInformation';
import OrderDetails from '@/pages/profileInformation/orderHistory/orderDetails';
import VendorOnboardingGuard from './VendorOnboardingGuard';
import Settings from '@/pages/settings';
import {
  PayoutDetails,
  PaymentPolicy,
} from '@/pages/settings/payment-billings';
import { StoreInfo, BusinessAddress } from '@/pages/settings/business-settings';
import {
  StoreAvailability,
  BookingPolicies,
  GiftfinderTags,
  BusinessCategory,
} from '@/pages/settings/operations';

const Home = React.lazy(() => import('@/pages/home'));
const SearchResults = React.lazy(() => import('@/pages/home/SearchResults'));
const VendorRoutes = React.lazy(() => import('./vendor'));

const Dashhboard = () => {
  const Comp = DashboardLayout;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const reload = useAppSelector((state) => state.auth.reload);
  const isAuth = useAppSelector((state) => state.auth.isAuth);

  const [loadAccount, setLoadAccount] = useState(false);
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('tokens'));

  // Update hasToken when auth state changes
  useEffect(() => {
    const tokenExists = !!localStorage.getItem('tokens');
    setHasToken(tokenExists);
  }, [isAuth]);

  const {
    data: userProfile,
    isLoading: userLoading,
    refetch,
    error,
  } = useUserProfileQuery(undefined, {
    skip: !hasToken, // Skip the query if there's no token
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (reload) {
      refetch();
    }
  }, [reload, refetch]);

  useEffect(() => {
    if (!loadAccount) {
      setLoadAccount(true);
    }
  }, [loadAccount]);

  useEffect(() => {
    if (!hasToken) {
      return;
    }

    if (!userProfile && userLoading) {
      return;
    }

    const apiUser = userProfile?.data?.user;

    if (!apiUser) {
      return;
    }

    if (apiUser.isEmailVerified) {
      dispatch(setUser(apiUser));
      if (apiUser.email) {
        amplitude.setUserId(apiUser.email);
        dispatch(setEmail(apiUser.email));
      }
      if (apiUser.arrayUserToken) {
        dispatch(setArrayUserToken(apiUser.arrayUserToken));
      }
      dispatch(setReload(false));
    } else {
      dispatch(setUnauthenticated());
      logoutUser();
    }
  }, [userProfile, userLoading, dispatch, hasToken, refetch]);

  // Redirect to auth page if user is not authenticated and has no token
  useEffect(() => {
    if (!isAuth && !hasToken && !userLoading) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuth, hasToken, userLoading, navigate]);

  // Handle profile query errors (e.g., 401)
  useEffect(() => {
    if (error && !userLoading) {
      dispatch(setUnauthenticated());
      localStorage.removeItem('token');
      localStorage.removeItem('tokens');
      navigate('/auth/login', { replace: true });
    }
  }, [error, userLoading, navigate, dispatch]);

  const logoutUser = async () => {
    dispatch(setUnauthenticated());
    localStorage.removeItem('token');
  };

  return (
    <Comp isLoading={userLoading}>
      <VendorOnboardingGuard>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/home/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/settings/payment-billings/payout-details"
            element={<PayoutDetails />}
          />
          <Route
            path="/settings/payment-billings/payment-policy"
            element={<PaymentPolicy />}
          />
          <Route
            path="/settings/business-settings/store-info"
            element={<StoreInfo />}
          />
          <Route
            path="/settings/business-settings/business-address"
            element={<BusinessAddress />}
          />
          <Route
            path="/settings/operations/store-availability"
            element={<StoreAvailability />}
          />
          <Route
            path="/settings/operations/booking-policies"
            element={<BookingPolicies />}
          />
          <Route
            path="/settings/operations/giftfinder-tags"
            element={<GiftfinderTags />}
          />
          <Route
            path="/settings/operations/business-category"
            element={<BusinessCategory />}
          />
          <Route path="/order-details/:orderId" element={<OrderDetails />} />
          <Route path="/vendor/*" element={<VendorRoutes />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </VendorOnboardingGuard>
    </Comp>
  );
};

export default Dashhboard;
