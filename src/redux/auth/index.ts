/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';
import { setAuthenticated, setUnauthenticated, setUser } from './authSlice';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.user.isEmailVerified) {
            dispatch(setAuthenticated());
          } else {
            window.location.replace(
              `${data.user.email}/${data.user.activeRole[0]}/onboard-otp`
            );
          }
        } catch {
          dispatch(setUnauthenticated());
        }
      },
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    registerAgent: builder.mutation({
      query: (newUser) => ({
        url: '/api/v1/auth/sign-up',
        method: 'POST',
        body: newUser,
      }),
    }),
    initiateSignup: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/auth/initiate-signup',
        method: 'POST',
        body: payload,
      }),
    }),
    completeProfile: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/auth/complete-profile',
        method: 'POST',
        body: payload,
      }),
    }),
    googleAuth: builder.mutation({
      query: (newUser) => ({
        url: '/api/v1/auth/google',
        method: 'POST',
        body: newUser,
      }),
    }),
    verifyEmail: builder.mutation({
      query: (verificationData) => ({
        url: '/api/v1/auth/verify-email',
        method: 'POST',
        body: verificationData,
      }),
    }),
    resendEmailOtp: builder.mutation({
      query: (verificationData) => ({
        url: '/api/v1/auth/resend-email-verification-token',
        method: 'POST',
        body: verificationData,
      }),
    }),

    // resend password reset token
    resendPasswordResetToken: builder.mutation({
      query: (email) => ({
        url: '/api/v1/auth/resend-password-reset-otp',
        method: 'POST',
        body: { email },
      }),
    }),
    getUserToken: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/users/regenerate-user-token',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    logout: builder.mutation({
      query: (verificationData) => ({
        url: '/api/v1/auth/logout',
        method: 'POST',
        body: verificationData,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(setUnauthenticated());
          // Reset the entire auth API cache on logout
          dispatch(authApi.util.resetApiState());
        } catch {
          /* empty */
        }
      },
    }),
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: '/api/v1/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),
    validateOtp: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/auth/validate-otp',
        method: 'POST',
        body: payload,
      }),
    }),
    resetPassword: builder.mutation({
      query: (resetData) => ({
        url: '/api/v1/auth/reset-password',
        method: 'POST',
        body: resetData,
      }),
    }),
    changePassword: builder.mutation({
      query: (resetData) => ({
        url: '/api/v1/users/change-password',
        method: 'PATCH',
        body: resetData,
      }),
    }),
    updateUser: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/users/add-role',
        method: 'PATCH',
        body: payload,
      }),
    }),
    userProfile: builder.query({
      query: () => ({
        url: '/api/v1/users/profile',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // console.log('user profile:', data?.data?.user)
          dispatch(setAuthenticated());
          dispatch(setUser(data.data.user));
        } catch {
          dispatch(setUnauthenticated());
        }
      },
    }),
    listProduct: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/products',
        method: 'POST',
        body: payload,
      }),
    }),
    listService: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/services',
        method: 'POST',
        body: payload,
      }),
    }),
    switchActiveRole: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/auth/switch-role',
        method: 'POST',
        body: payload,
      }),
    }),
    getInspirationCategories: builder.query({
      query: () => ({
        url: '/api/v1/inspiration-categories',
        method: 'GET',
      }),
    }),
    updateUserProfile: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/users/profile',
        method: 'PATCH',
        body: payload,
      }),
    }),
    updateNotificationPreferences: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/users/notification-preferences',
        method: 'PATCH',
        body: payload,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterAgentMutation,
  useInitiateSignupMutation,
  useCompleteProfileMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResendPasswordResetTokenMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useResendEmailOtpMutation,
  useUpdateUserMutation,
  useValidateOtpMutation,
  useUserProfileQuery,
  useGetUserTokenMutation,
  useGoogleAuthMutation,
  useListProductMutation,
  useListServiceMutation,
  useSwitchActiveRoleMutation,
  useGetInspirationCategoriesQuery,
  useUpdateNotificationPreferencesMutation,
  useUpdateUserProfileMutation,
} = authApi;
