import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export const vendorApi = createApi({
  reducerPath: 'vendorApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Store', 'PayoutInfo', 'SubscriptionPlans'],
  endpoints: (builder) => ({
    // Store Endpoints
    createStore: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/stores',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    getMyStore: builder.query({
      query: () => ({
        url: '/api/v1/stores/my/store',
        method: 'GET',
      }),
      providesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    updateStore: builder.mutation({
      query: ({ storeId, ...payload }) => ({
        url: `/api/v1/stores/${storeId}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    // Marketplace Categories
    getMarketplaceCategories: builder.query({
      query: (type: 'service' | 'product' = 'service') => ({
        url: `/api/v1/marketplace-categories?type=${type}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    // Payout Info Endpoints
    createPayoutInfo: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/payout-info',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['PayoutInfo'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    getPayoutInfo: builder.query({
      query: () => ({
        url: '/api/v1/payout-info',
        method: 'GET',
      }),
      providesTags: ['PayoutInfo'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    updatePayoutInfo: builder.mutation({
      query: ({ ...payload }) => ({
        url: `/api/v1/payout-info`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['PayoutInfo'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    // Subscription Endpoints
    getActiveSubscriptionPlans: builder.query({
      query: () => ({
        url: '/api/v1/subscription-plans/active',
        method: 'GET',
      }),
      providesTags: ['SubscriptionPlans'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    acceptSubscription: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/users/accept-subscription',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => {
        return response;
      },
    }),
  }),
});

export const {
  useCreateStoreMutation,
  useGetMyStoreQuery,
  useUpdateStoreMutation,
  useGetMarketplaceCategoriesQuery,
  useCreatePayoutInfoMutation,
  useGetPayoutInfoQuery,
  useUpdatePayoutInfoMutation,
  useGetActiveSubscriptionPlansQuery,
  useAcceptSubscriptionMutation,
} = vendorApi;
