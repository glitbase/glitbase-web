import DashboardLayout from '@/layout/dashboard';

import React, { useEffect } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { useUserProfileQuery } from '@/redux/auth';
import {
  setUser,
  setReload,
  setEmail,
  setArrayUserToken,
  setInitialized,
  selectHasTokens,
  selectIsInitialized,
} from '@/redux/auth/authSlice';
import * as amplitude from '@amplitude/analytics-browser';
import Profile from '@/pages/profileInformation';
import OrderDetails from '@/pages/profileInformation/orderHistory/orderDetails';
import ProtectedRouteProvider from './ProtectedRouteProvider';
import VendorRouteGuard from './VendorRouteGuard';
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
const StorePage = React.lazy(() => import('@/pages/vendor/store'));
const CreateBooking = React.lazy(() => import('@/pages/booking/CreateBooking'));
const Bookings = React.lazy(() => import('@/pages/bookings'));

const Dashboard = () => {
  const Comp = DashboardLayout;
  const dispatch = useAppDispatch();

  // Use Redux selectors instead of localStorage
  const hasTokens = useAppSelector(selectHasTokens);
  const isInitialized = useAppSelector(selectIsInitialized);
  const reload = useAppSelector((state) => state.auth.reload);

  const {
    data: userProfile,
    isLoading: userLoading,
    refetch,
    error,
  } = useUserProfileQuery(undefined, {
    skip: !hasTokens, // Skip the query if there's no token
    refetchOnMountOrArgChange: true,
  });

  // Only show loading state if we have a token and are actually fetching user data
  const shouldShowLoading = hasTokens && userLoading && !isInitialized;

  useEffect(() => {
    if (reload) {
      refetch();
    }
  }, [reload, refetch]);

  // Handle user profile data
  useEffect(() => {
    if (!hasTokens) {
      // Mark as initialized even without tokens (public access is okay)
      if (!isInitialized) {
        dispatch(setInitialized(true));
      }
      return;
    }

    if (!userProfile && userLoading) {
      return;
    }

    const apiUser = userProfile?.data?.user;

    if (!apiUser) {
      // No user data but we have tokens - wait a bit more
      if (!userLoading && !isInitialized) {
        dispatch(setInitialized(true));
      }
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
      // Email not verified - mark as initialized but don't set user
      // Don't logout - just keep them in an unauthenticated state
      // They'll be redirected to verification by route guards if they try to access protected routes
      dispatch(setInitialized(true));
    }
  }, [userProfile, userLoading, dispatch, hasTokens, isInitialized]);

  // Handle profile query errors gracefully
  // The dashboard is publicly accessible, so users can stay on it without being logged in
  // We do NOT clear tokens on errors - the baseQueryWithReauth handles token refresh
  // Only mark as initialized so the UI can proceed
  useEffect(() => {
    if (error && !userLoading && !isInitialized) {
      // Don't logout on errors - just mark as initialized
      // The user might have invalid/expired tokens, but we shouldn't clear them
      // as the refresh mechanism might handle it on subsequent requests
      dispatch(setInitialized(true));
    }
  }, [error, userLoading, dispatch, isInitialized]);

  return (
    <Comp isLoading={shouldShowLoading}>
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/store/:storeId" element={<StorePage />} />
        <Route path="/booking/create" element={<CreateBooking />} />

        {/* Protected routes - authentication required */}
        <Route
          path="/bookings"
          element={
            <ProtectedRouteProvider>
              <Bookings />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/home/profile"
          element={
            <ProtectedRouteProvider>
              <Profile />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRouteProvider>
              <Settings />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/payment-billings/payout-details"
          element={
            <ProtectedRouteProvider>
              <PayoutDetails />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/payment-billings/payment-policy"
          element={
            <ProtectedRouteProvider>
              <PaymentPolicy />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/business-settings/store-info"
          element={
            <ProtectedRouteProvider>
              <StoreInfo />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/business-settings/business-address"
          element={
            <ProtectedRouteProvider>
              <BusinessAddress />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/operations/store-availability"
          element={
            <ProtectedRouteProvider>
              <StoreAvailability />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/operations/booking-policies"
          element={
            <ProtectedRouteProvider>
              <BookingPolicies />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/operations/giftfinder-tags"
          element={
            <ProtectedRouteProvider>
              <GiftfinderTags />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/settings/operations/business-category"
          element={
            <ProtectedRouteProvider>
              <BusinessCategory />
            </ProtectedRouteProvider>
          }
        />
        <Route
          path="/order-details/:orderId"
          element={
            <ProtectedRouteProvider>
              <OrderDetails />
            </ProtectedRouteProvider>
          }
        />

        {/* Vendor routes - authentication + vendor role required */}
        <Route
          path="/vendor/*"
          element={
            <ProtectedRouteProvider>
              <VendorRouteGuard>
                <VendorRoutes />
              </VendorRouteGuard>
            </ProtectedRouteProvider>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Comp>
  );
};

export default Dashboard;
