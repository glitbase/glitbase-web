/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

// ---- Shared Types ----
/** Store location on booking payloads — GeoJSON Point is [longitude, latitude]. */
export interface BookingStoreLocation {
  geoPoint?: { type?: string; coordinates?: [number, number] };
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface Booking {
  _id: string;
  bookingReference: string;
  user: string;
  store: {
    id: string;
    name: string;
    bannerImageUrl?: string;
    location?: BookingStoreLocation;
  };
  serviceType: 'normal' | 'home' | 'pickDrop';
  serviceDate: string;
  serviceTime: string;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'rejected' | 'refunded' | 'cancelled';
  bookingStage: string;
  items: {
    service: {
      id: string;
      name: string;
      description?: string;
      category?: string;
      imageUrl?: string;
      price: number;
      currency: string;
      durationInMinutes: number;
      pricingType: 'fixed' | 'hourly';
    };
    quantity: number;
    addOns?: { id: string; name: string; price: number; durationInMinutes?: number }[];
    subtotal: number;
    totalDuration: number;
  }[];
  pricing: {
    subtotal: number;
    totalDuration: number;
    paymentTerm: 'full' | 'deposit';
    depositPercentage?: number;
    amountPaid: number;
    remainingBalance: number;
    currency: string;
    commissionRate?: number;
    commissionAmount?: number;
    vendorPayout?: number;
  };
  payment?: { paymentReference: string; status: string; paidAt?: string };
  contactInfo?: { name?: string; email?: string; phoneNumber?: string };
  homeServiceAddress?: {
    address: string;
    apartment?: string;
    city: string;
    postalCode?: string;
    additionalDirections?: string;
  };
  additionalInfo?: { notes?: string; images?: string[] };
  completedAt?: string | null;
  stageHistory?: { stage: string; timestamp: string; updatedBy?: string }[];
  createdAt: string;
  updatedAt: string;
  /** Vendor-set attendance flag (PATCH provider-update) */
  providerUpdate?: 'late' | 'noshow';
  /** Customer arrival / presence (PATCH customer-present) */
  customerPresent?: boolean;
}

export interface GetBookingsResponse {
  status: boolean;
  message: string;
  data: {
    bookings: Booking[];
    meta?: {
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface GetBookingResponse {
  status: boolean;
  message: string;
  data: { booking: Booking };
}

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Booking', 'Bookings', 'Pricing', 'PaymentCards'],
  endpoints: (builder) => ({
    // Minimal vendor booking shape used by Vendor Home
    // (Full booking types live in the mobile RESOURCE; we only type what we render here.)
    getVendorMetrics: builder.query<
      {
        storefrontClicks: number;
        newCustomers: number;
        totalEarnings: number;
        servicesBooked: number;
        currency: string;
        period?: { startDate: string; endDate: string };
      },
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/bookings/vendor/metrics',
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (response: any) => response.data?.data ?? response.data,
      providesTags: ['Booking'],
    }),
    getVendorBookings: builder.query<
      {
        bookings: Array<{
          _id?: string;
          id?: string;
          status?: string;
          serviceDate?: string;
          serviceTime?: string;
          contactInfo?: { name?: string };
          customer?: { name?: string };
          pricing?: {
            currency?: string;
            vendorPayout?: number;
            totalDuration?: number;
          };
          totalDuration?: number;
        }>;
        meta?: {
          totalDocs: number;
          limit: number;
          page: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      },
      {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        sortBy?: string;
        serviceType?: string;
        minDuration?: number;
        maxDuration?: number;
        minValue?: number;
        maxValue?: number;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({
        url: '/api/v1/bookings/vendor/all',
        method: 'GET',
        params,
      }),
      transformResponse: (response: any) => response.data?.data ?? response.data,
      providesTags: ['Booking'],
    }),
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
    getUserBookings: builder.query<
      GetBookingsResponse,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: (params) => ({
        url: '/api/v1/bookings',
        method: 'GET',
        params,
      }),
      providesTags: ['Booking'],
    }),
    getBookingByReference: builder.query<GetBookingResponse, string>({
      query: (reference) => ({
        url: `/api/v1/bookings/${reference}`,
        method: 'GET',
      }),
      providesTags: (result, error, reference) => [{ type: 'Booking', id: reference }],
    }),
    cancelBooking: builder.mutation<
      { status: boolean; message: string },
      { bookingId: string; reason: string }
    >({
      query: ({ bookingId, reason }) => ({
        url: `/api/v1/bookings/${bookingId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Booking'],
    }),
    // Vendor: confirm booking
    confirmBooking: builder.mutation<{ status: boolean; message: string }, string>({
      query: (reference) => ({
        url: `/api/v1/bookings/${reference}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reference) => ['Booking', { type: 'Booking', id: reference }],
    }),
    // Vendor: update booking stage
    updateBookingStage: builder.mutation<
      { status: boolean; message: string },
      { reference: string; stage: string }
    >({
      query: ({ reference, stage }) => ({
        url: `/api/v1/bookings/${reference}/stage`,
        method: 'PATCH',
        body: { stage },
      }),
      invalidatesTags: (result, error, { reference }) => ['Booking', { type: 'Booking', id: reference }],
    }),
    // Vendor: mark booking as completed
    completeBookingVendor: builder.mutation<{ status: boolean; message: string }, string>({
      query: (reference) => ({
        url: `/api/v1/bookings/${reference}/complete/vendor`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reference) => ['Booking', { type: 'Booking', id: reference }],
    }),
    // Vendor: reject booking
    rejectBooking: builder.mutation<
      { status: boolean; message: string },
      { reference: string; reason: string }
    >({
      query: ({ reference, reason }) => ({
        url: `/api/v1/bookings/${reference}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { reference }) => ['Booking', { type: 'Booking', id: reference }],
    }),
    /** Vendor (store owner): mark late or no-show */
    providerBookingUpdate: builder.mutation<
      GetBookingResponse,
      { reference: string; providerUpdate: 'late' | 'noshow' }
    >({
      query: ({ reference, providerUpdate }) => ({
        url: `/api/v1/bookings/${reference}/provider-update`,
        method: 'PATCH',
        body: { providerUpdate },
      }),
      invalidatesTags: (result, error, { reference }) => ['Booking', { type: 'Booking', id: reference }],
    }),
    /** Customer: set presence (e.g. "I'm here"); UI should only call when within store radius */
    customerPresentBooking: builder.mutation<
      GetBookingResponse,
      { reference: string; customerPresent: boolean }
    >({
      query: ({ reference, customerPresent }) => ({
        url: `/api/v1/bookings/${reference}/customer-present`,
        method: 'PATCH',
        body: { customerPresent },
      }),
      invalidatesTags: (result, error, { reference }) => ['Booking', { type: 'Booking', id: reference }],
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
  useGetVendorMetricsQuery,
  useLazyGetVendorMetricsQuery,
  useGetVendorBookingsQuery,
  useLazyGetVendorBookingsQuery,
  useGetUserBookingsQuery,
  useGetBookingByReferenceQuery,
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useUpdateBookingStageMutation,
  useCompleteBookingVendorMutation,
  useRejectBookingMutation,
  useProviderBookingUpdateMutation,
  useCustomerPresentBookingMutation,
} = bookingApi;
