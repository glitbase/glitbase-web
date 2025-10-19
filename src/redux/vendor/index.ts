/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export const vendorApi = createApi({
  reducerPath: 'vendorApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Store', 'Services', 'Reviews', 'PayoutInfo', 'SubscriptionPlans'],
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

    // Gallery Management
    addGalleryImage: builder.mutation({
      query: ({ storeId, imageURL }) => ({
        url: `/api/v1/stores/${storeId}/gallery/images`,
        method: 'POST',
        body: { imageURL },
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    removeGalleryImage: builder.mutation({
      query: ({ storeId, imageId }) => ({
        url: `/api/v1/stores/${storeId}/gallery/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    // FAQ Management
    addFaq: builder.mutation({
      query: ({ storeId, question, answer }) => ({
        url: `/api/v1/stores/${storeId}/faqs`,
        method: 'POST',
        body: { question, answer },
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    updateFaq: builder.mutation({
      query: ({ storeId, faqId, question, answer }) => ({
        url: `/api/v1/stores/${storeId}/faqs/${faqId}`,
        method: 'PATCH',
        body: { question, answer },
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    removeFaq: builder.mutation({
      query: ({ storeId, faqId }) => ({
        url: `/api/v1/stores/${storeId}/faqs/${faqId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Store'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    // Services Management
    getServices: builder.query({
      query: ({ storeId, page = 1, limit = 10, category, status, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        return {
          url: `/api/v1/services/store/${storeId}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Services'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    createService: builder.mutation({
      query: ({ storeId, ...payload }) => ({
        url: `/api/v1/services/${storeId}`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Services'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    updateService: builder.mutation({
      query: ({ serviceId, ...payload }) => ({
        url: `/api/v1/services/${serviceId}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Services'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    deleteService: builder.mutation({
      query: (serviceId) => ({
        url: `/api/v1/services/${serviceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Services'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),

    // Reviews Management
    getStoreReviews: builder.query({
      query: ({ storeId, page = 1, limit = 10, sortBy = 'latest', rating }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
        });
        if (rating) params.append('rating', rating.toString());

        return {
          url: `/api/v1/reviews/stores/${storeId}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Reviews'],
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    getStoreReviewMetrics: builder.query({
      query: (storeId) => ({
        url: `/api/v1/reviews/stores/${storeId}/metrics`,
        method: 'GET',
      }),
      providesTags: ['Reviews'],
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
  useLazyGetMyStoreQuery,
  useUpdateStoreMutation,
  useAddGalleryImageMutation,
  useRemoveGalleryImageMutation,
  useAddFaqMutation,
  useUpdateFaqMutation,
  useRemoveFaqMutation,
  useGetServicesQuery,
  useLazyGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetStoreReviewsQuery,
  useLazyGetStoreReviewsQuery,
  useGetStoreReviewMetricsQuery,
  useGetMarketplaceCategoriesQuery,
  useCreatePayoutInfoMutation,
  useGetPayoutInfoQuery,
  useUpdatePayoutInfoMutation,
  useGetActiveSubscriptionPlansQuery,
  useAcceptSubscriptionMutation,
} = vendorApi;
