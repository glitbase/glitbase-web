/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Booking', 'Bookings', 'Pricing', 'PaymentCards'],
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
    getUserBookings: builder.query({
      query: ({
        page = 1,
        limit = 10,
        status = 'all',
      }: {
        page?: number;
        limit?: number;
        status?: 'all' | 'pending' | 'ongoing' | 'completed' | 'rejected';
      }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (status && status !== 'all') params.append('status', status);

        return {
          url: `/api/v1/bookings?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any) => response.data,
      providesTags: ['Bookings'],
    }),
    getBookingByReference: builder.query({
      query: (reference: string) => ({
        url: `/api/v1/bookings/${reference}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, reference) => [
        { type: 'Booking' as const, id: reference },
      ],
    }),
    cancelBooking: builder.mutation({
      query: ({ bookingId, reason }: { bookingId: string; reason: string }) => ({
        url: `/api/v1/bookings/${bookingId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, arg) => [
        'Bookings',
        { type: 'Booking' as const, id: arg.bookingId },
      ],
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
  useGetUserBookingsQuery,
  useGetBookingByReferenceQuery,
  useCancelBookingMutation,
  useGetPaymentCardsQuery,
  useInitiatePaymentMutation,
  useCompletePaymentMutation,
  useVerifyPaymentMutation,
} = bookingApi;
