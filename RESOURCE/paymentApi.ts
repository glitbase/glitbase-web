import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { authApi } from './authApi';
import { updateUser } from '../store/userSlice';

// Request Types
export interface CreatePayoutInfoRequest {
  country: 'NG' | 'GB';
  fullName: string;
  accountNumber: string;
  bankName: string;
  sortCode?: string;
}

export interface UpdatePayoutInfoRequest {
  fullName?: string;
  accountNumber?: string;
  bankName?: string;
  sortCode?: string;
}

// Response Types
export interface PayoutInfo {
  id: string;
  country: 'NG' | 'GB';
  fullName: string;
  accountNumber: string;
  bankName: string;
  sortCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutInfoResponse {
  data: {
    payoutInfo: PayoutInfo;
  };
  message: string;
}

export interface PayoutInfoListResponse {
  data: PayoutInfo;
  message: string;
}

export interface MessageResponse {
  message: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  vendor: string;
  pendingBalance: number;
  availableBalance: number;
  totalLifetimeEarnings: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  status: boolean;
  message: string;
  data: {
    wallet: Wallet;
  };
}

// Wallet Transaction Types
export interface WalletTransaction {
  id: string;
  transactionReference: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  metadata: {
    paymentReference?: string;
    commissionRate?: number;
    commissionAmount?: number;
    vendorPayout?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionsResponse {
  status: boolean;
  message: string;
  data: {
    transactions: WalletTransaction[];
    meta: {
      totalDocs: number;
      limit: number;
      page: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// Payout Request Types
export interface PayoutRequestRequest {
  amount: number;
  payoutMethod: 'bank_transfer';
  bankAccount: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
    type?: string;
    currency?: string;
    sortCode?: string;
    country?: string;
  };
  notes: string;
}

export interface PayoutRequestResponse {
  status: boolean;
  message: string;
  data: {
    payout: {
      id: string;
      amount: number;
      currency: string;
      status: 'pending_approval';
      payoutMethod: 'bank_transfer';
      paymentGateway: string;
      bankAccount: {
        accountName: string;
        accountNumber: string;
        bankName: string;
      };
      requestedAt: string;
      estimatedProcessingTime: string;
    };
    transaction: {
      id: string;
      transactionReference: string;
      type: 'debit';
      category: 'payout_pending';
      amount: number;
      description: string;
    };
  };
}

// Payout Status Types
export interface PayoutStatusResponse {
  status: boolean;
  message: string;
  data: {
    hasPendingPayout: boolean;
    pendingPayout?: {
      id: string;
      amount: number;
      currency: string;
      status: 'pending_approval' | 'processing' | 'completed' | 'failed';
      payoutMethod: 'bank_transfer';
      paymentGateway: string;
      bankAccount: {
        accountName: string;
        accountNumber: string;
        bankName: string;
      };
      requestedAt: string;
      processedAt: string | null;
      completedAt: string | null;
      notes: string;
    };
  };
}

// Payment Card Types
export interface PaymentCard {
  id: string;
  cardHolderName: string;
  last4Digits: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  gatewayCardId: string;
}

export interface PaymentCardsResponse {
  status: boolean;
  message: string;
  data: {
    paymentCards: PaymentCard[];
  };
}

// Payment Types
export interface Payment {
  id: string;
  paymentReference: string;
  paymentType: 'booking' | 'product' | 'subscription';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'card' | 'bank_transfer' | 'wallet';
  paymentGateway: 'stripe' | 'paystack' | 'flutterwave';
  clientSecret?: string;
  gatewayPaymentId?: string;
  paidAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  paymentType: string;
  paymentMethod: string;
  paymentGateway: string;
  amount: number;
  currency: string;
  paymentCardId?: string;
  metadata?: {
    storeId: string;
    serviceType: string;
    serviceDate: string;
    serviceTime: string;
    cartItems: {
      serviceId: string;
      quantity: number;
      addOnIds: string[];
    }[];
    pricing: {
      paymentTerm: string;
      subtotal: number;
      totalDuration: number;
      amountToPay: number;
      remainingBalance: number;
    };
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
  };
}

export interface InitiatePaymentResponse {
  status: boolean;
  message: string;
  data: {
    payment: Payment;
    booking?: any;
  };
}

export interface CompletePaymentRequest {
  paymentReference: string;
  gatewayPaymentId?: string;
  gatewayCardId?: string;
  last4Digits?: string;
  cardBrand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardHolderName?: string;
}

export interface CompletePaymentResponse {
  status: boolean;
  message: string;
  data: {
    payment: Payment;
    booking?: any;
  };
}

export interface VerifyPaymentRequest {
  paymentReference: string;
}

export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    payment: Payment;
  };
}

// Subscription Types
export interface AcceptSubscriptionRequest {
  subscriptionType: string;
  planId?: string;
  paymentMethodId?: string;
}

export interface CreateSubscriptionRequest {
  subscriptionType: "Monthly" | "Yearly";
  planId: string;
  paymentMethod?: {
    paymentMethodId: string;
  };
  couponCode?: string;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planId: string;
  subscriptionType: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionResponse {
  status: boolean;
  message: string;
  data: {
    subscription: Subscription;
    clientSecret: string; // for 3D Secure
  };
}

export interface SubscriptionPlan {
  id: any;
  _id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  description: string;
  durationInMonths: number;
}

export interface SubscriptionPlanResponse {
  data: SubscriptionPlan[];
  message: string;
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PayoutInfo', 'PaymentCards', 'Payments', 'Wallet', 'WalletTransactions', 'PayoutStatus', 'User'],
  endpoints: (builder) => ({
    // Get saved payment cards
    getPaymentCards: builder.query<PaymentCardsResponse, void>({
      query: () => 'payment-cards',
      providesTags: ['PaymentCards'],
    }),

    // Initiate payment
    initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (data) => ({
        url: 'payments/initiate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments'],
    }),

    // Complete payment
    completePayment: builder.mutation<CompletePaymentResponse, CompletePaymentRequest>({
      query: (data) => ({
        url: 'payments/complete',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments', 'PaymentCards'],
    }),

    // Verify payment
    verifyPayment: builder.mutation<VerifyPaymentResponse, VerifyPaymentRequest>({
      query: (data) => ({
        url: 'payments/verify',
        method: 'POST',
        body: data,
      }),
    }),
    // Create payout info
    createPayoutInfo: builder.mutation<PayoutInfoResponse, CreatePayoutInfoRequest>({
      query: (data) => ({
        url: 'payout-info',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PayoutInfo'],
    }),

    getPayoutInfo: builder.query<PayoutInfoResponse, void>({
      query: () => 'payout-info',
      providesTags: ['PayoutInfo'],
    }),

    // Update payout info
    updatePayoutInfo: builder.mutation<PayoutInfoResponse, { id: string; data: UpdatePayoutInfoRequest }>({
      query: ({ id, data }) => ({
        url: `payout-info/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['PayoutInfo'],
    }),

    // Set default payout info
    setDefaultPayoutInfo: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `payout-info/${id}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['PayoutInfo'],
    }),

    // Delete payout info
    deletePayoutInfo: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `payout-info/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PayoutInfo'],
    }),

    // Get default payout info
    getDefaultPayoutInfo: builder.query<PayoutInfoResponse, void>({
      query: () => 'payout-info/default',
      providesTags: ['PayoutInfo'],
    }),

    // Accept subscription
    acceptSubscription: builder.mutation<MessageResponse, AcceptSubscriptionRequest>({
      query: (data) => ({
        url: 'users/accept-subscription',
        method: 'POST',
        body: data,
      }),
    }),

    // Get active subscription plans
    getActiveSubscriptionPlans: builder.query<SubscriptionPlanResponse, void>({
      query: () => 'subscriptions/plans',
    }),

    // Create subscription
    createSubscription: builder.mutation<CreateSubscriptionResponse, CreateSubscriptionRequest>({
      query: (data) => ({
        url: 'subscriptions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments'],
    }),

    // Cancel subscription
    cancelSubscription: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: 'subscriptions',
        method: 'DELETE',
      }),
      invalidatesTags: ['Payments', 'User'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Refetch user profile to get updated subscription status
          console.log('Refetching user profile after subscription cancellation');
          const profileResult = await dispatch(
            authApi.endpoints.getProfile.initiate(undefined, { forceRefetch: true })
          );
          if (profileResult.data?.data?.user) {
            dispatch(updateUser(profileResult.data.data.user));
            console.log('User profile updated in Redux store');
          }
        } catch (error) {
          console.error('Error refetching user profile:', error);
        }
      },
    }),

    // Get wallet
    getWallet: builder.query<WalletResponse, void>({
      query: () => 'wallet',
      providesTags: ['Wallet'],
    }),

    // Get wallet transactions
    getWalletTransactions: builder.query<
      WalletTransactionsResponse,
      {
        period?: 'all_time' | 'today' | 'last_7_days' | 'last_30_days' | 'last_3_months' | 'this_year';
        page?: number;
        limit?: number;
      }
    >({
      query: (params = {}) => ({
        url: 'wallet/transactions',
        params,
      }),
      providesTags: ['WalletTransactions'],
    }),

    // Request payout
    requestPayout: builder.mutation<PayoutRequestResponse, PayoutRequestRequest>({
      query: (data) => ({
        url: 'wallet/payouts/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'WalletTransactions', 'PayoutStatus'],
    }),

    // Get payout status
    getPayoutStatus: builder.query<PayoutStatusResponse, void>({
      query: () => 'wallet/payouts/status',
      providesTags: ['PayoutStatus'],
    }),
  }),
});

export const {
  useGetPaymentCardsQuery,
  useLazyGetPaymentCardsQuery,
  useInitiatePaymentMutation,
  useCompletePaymentMutation,
  useVerifyPaymentMutation,
  useCreatePayoutInfoMutation,
  useGetPayoutInfoQuery,
  useLazyGetPayoutInfoQuery,
  useUpdatePayoutInfoMutation,
  useSetDefaultPayoutInfoMutation,
  useDeletePayoutInfoMutation,
  useGetDefaultPayoutInfoQuery,
  useLazyGetDefaultPayoutInfoQuery,
  useAcceptSubscriptionMutation,
  useGetActiveSubscriptionPlansQuery,
  useLazyGetActiveSubscriptionPlansQuery,
  useCreateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useGetWalletQuery,
  useLazyGetWalletQuery,
  useGetWalletTransactionsQuery,
  useLazyGetWalletTransactionsQuery,
  useRequestPayoutMutation,
  useGetPayoutStatusQuery,
  useLazyGetPayoutStatusQuery,
} = paymentApi;