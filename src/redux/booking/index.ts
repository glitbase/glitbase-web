/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Booking', 'Pricing', 'PaymentCards'],
  endpoints: (builder) => ({
    calculatePricing: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/bookings/calculate-pricing',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Pricing'],
    }),
    createBooking: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/bookings',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Booking'],
    }),
    getPaymentCards: builder.query({
      query: () => ({
        url: '/api/v1/payment-cards',
        method: 'GET',
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['PaymentCards'],
    }),
    initiatePayment: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/payments/initiate',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => response.data,
    }),
    completePayment: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/payments/complete',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => response.data,
    }),
    verifyPayment: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/payments/verify',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useCalculatePricingMutation,
  useCreateBookingMutation,
  useGetPaymentCardsQuery,
  useInitiatePaymentMutation,
  useCompletePaymentMutation,
  useVerifyPaymentMutation,
} = bookingApi;
