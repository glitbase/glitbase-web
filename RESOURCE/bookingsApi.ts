import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// Request Types
export interface CreateBookingRequest {
  storeId: string;
  serviceType: string;
  serviceDate: string;
  serviceTime: string;
  cartItems: {
    serviceId: string;
    quantity: number;
    addOnIds: string[];
  }[];
  paymentMethod: string;
  paymentGateway: string;
  currency: string;
  pricing: {
    paymentTerm: string;
    subtotal: number;
    totalDuration: number;
    amountToPay: number;
    remainingBalance: number;
  };
  paymentCardId?: string;
  customerPhone?: string;
  contactInfo?: {
    address: string;
    notes?: string;
  };
  pickupInfo?: {
    address: string;
    date: string;
    notes?: string;
  };
  dropoffInfo?: {
    address: string;
    date: string;
    notes?: string;
  };
}

// Response Types
export interface Booking {
  _id: string;
  bookingReference: string;
  user: string;
  stageHistory?: {
    stage: string;
    timestamp: string;
    updatedBy: string;
  }[];
  store: {
    id: string;
    name: string;
    bannerImageUrl?: string;
    location: any;
  };
  serviceType: 'normal' | 'home' | 'pickDrop';
  serviceDate: string;
  serviceTime: string;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'rejected' |'refunded' | 'cancelled';
  bookingStage: 'pending' | 'confirmed' | 'readyToServe' | 'vendorEnroute' | 'vendorArrived' | 'itemReceived' | 'inProgress' | 'readyForPickup' | 'completed' | 'rejected';
  items: {
    service: {
      isDelivery: unknown;
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
    addOns?: {
      id: string;
      name: string;
      description?: string;
      price: number;
      durationInMinutes?: number;
    }[];
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
    commissionRate: number;
    commissionAmount: number;
    vendorPayout: number;
  };
  payment?: {
    paymentReference: string;
    status: string;
    paidAt?: string;
  };
  contactInfo?: {
    name: string;
    email: string;
    phoneNumber: string;
  };
  homeServiceAddress?: {
    address: string;
    apartment?: string;
    city: string;
    postalCode: string;
    additionalDirections?: string;
  };
  pickupInfo?: {
    address: {
      apartment: string;
      address: string;
      city: string;
      postalCode: string;
    };
    date: string;
  };
  dropoffInfo?: {
    address: {
      apartment: string;
      address: string;
      city: string;
      postalCode: string;
    };
    date: string;
  };
  additionalInfo?: {
    notes?: string;
    images?: string[];
  };
  vendorMarkedComplete: boolean;
  customerMarkedComplete: boolean;
  vendorCompletedAt?: string | null;
  customerCompletedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingResponse {
  status: boolean;
  message: string;
  data: {
    booking: Booking;
    payment?: any;
  };
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
  data: {
    booking: Booking;
  };
}

export interface VendorMetricsResponse {
  status: boolean;
  message: string;
  data: {
    storefrontClicks: number;
    newCustomers: number;
    totalEarnings: number;
    servicesBooked: number;
    currency: string;
    period: {
      startDate: string;
      endDate: string;
    };
  };
}

// Pricing calculation types
export interface CalculatePricingRequest {
  storeId: string;
  cartItems: {
    serviceId: string;
    quantity: number;
    addOnIds: string[];
  }[];
  paymentTerm: 'full' | 'deposit';
}

export interface CalculatePricingResponse {
  status: boolean;
  message: string;
  data: {
    subtotal: number;
    totalDuration: number;
    serviceChargeRate: number;
    serviceChargeAmount: number;
    totalWithServiceCharge: number;
    amountToPay: number;
    remainingBalance: number;
    currency: string;
  };
}

export const bookingsApi = createApi({
  reducerPath: 'bookingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Bookings', 'Booking'],
  endpoints: (builder) => ({
    // Create booking
    createBooking: builder.mutation<CreateBookingResponse, CreateBookingRequest>({
      query: (data) => ({
        url: 'bookings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Bookings'],
    }),

    // Get user bookings
    getUserBookings: builder.query<
      GetBookingsResponse,
      { page?: number; limit?: number; status?: string }
    >({
      query: (params) => ({
        url: 'bookings',
        params,
      }),
      providesTags: ['Bookings'],
    }),

    // Get single booking by reference
    getBookingByReference: builder.query<GetBookingResponse, string>({
      query: (reference) => `bookings/${reference}`,
      providesTags: (result, error, reference) => [{ type: 'Booking', id: reference }],
    }),

    // Cancel booking
    cancelBooking: builder.mutation<{ status: boolean; message: string }, { bookingId: string; reason: string }>({
      query: ({ bookingId, reason }) => ({
        url: `bookings/${bookingId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        'Bookings',
        { type: 'Booking', id: bookingId },
      ],
    }),

    // Confirm booking (vendor)
    confirmBooking: builder.mutation<{ status: boolean; message: string }, string>({
      query: (reference) => ({
        url: `bookings/${reference}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reference) => [
        'Bookings',
        { type: 'Booking', id: reference },
      ],
    }),

    // Get vendor bookings
    getVendorBookings: builder.query<
      GetBookingsResponse,
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
        url: 'bookings/vendor/all',
        params,
      }),
      providesTags: ['Bookings'],
    }),

    // Update booking stage (vendor)
    updateBookingStage: builder.mutation<
      { status: boolean; message: string },
      { reference: string; stage: string }
    >({
      query: ({ reference, stage }) => ({
        url: `bookings/${reference}/stage`,
        method: 'PATCH',
        body: { stage },
      }),
      invalidatesTags: (result, error, { reference }) => [
        'Bookings',
        { type: 'Booking', id: reference },
      ],
    }),

    // Mark booking as completed (vendor)
    completeBookingVendor: builder.mutation<{ status: boolean; message: string }, string>({
      query: (reference) => ({
        url: `bookings/${reference}/complete/vendor`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reference) => [
        'Bookings',
        { type: 'Booking', id: reference },
      ],
    }),

    // Mark booking as completed (customer)
    completeBookingCustomer: builder.mutation<{ status: boolean; message: string }, string>({
      query: (reference) => ({
        url: `bookings/${reference}/complete/customer`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, reference) => [
        'Bookings',
        { type: 'Booking', id: reference },
      ],
    }),

    // Reject booking (vendor)
    rejectBooking: builder.mutation<{ status: boolean; message: string }, { reference: string; reason: string }>({
      query: ({ reference, reason }) => ({
        url: `bookings/${reference}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { reference }) => [
        'Bookings',
        { type: 'Booking', id: reference },
      ],
    }),

    // Get vendor metrics
    getVendorMetrics: builder.query<
      VendorMetricsResponse,
      { startDate?: string; endDate?: string }
    >({
      query: (params = {}) => ({
        url: 'bookings/vendor/metrics',
        params,
      }),
      providesTags: ['Bookings'],
    }),

    // Calculate pricing
    calculatePricing: builder.mutation<CalculatePricingResponse, CalculatePricingRequest>({
      query: (data) => ({
        url: 'bookings/calculate-pricing',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useLazyGetUserBookingsQuery,
  useGetBookingByReferenceQuery,
  useLazyGetBookingByReferenceQuery,
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useGetVendorBookingsQuery,
  useLazyGetVendorBookingsQuery,
  useUpdateBookingStageMutation,
  useCompleteBookingVendorMutation,
  useCompleteBookingCustomerMutation,
  useRejectBookingMutation,
  useGetVendorMetricsQuery,
  useLazyGetVendorMetricsQuery,
  useCalculatePricingMutation,
} = bookingsApi;
