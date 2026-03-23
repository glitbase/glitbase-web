import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

interface SubscriptionPlan {
  id: string;
  type: string;
  price: number;
  currency: string;
  durationInMonths: number;
  features?: string[];
}

interface SubscriptionPlansResponse {
  status: boolean;
  message: string;
  data: SubscriptionPlan[];
}

interface CancelSubscriptionResponse {
  status: boolean;
  message: string;
}

// Wallet types
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
  data: { wallet: Wallet };
}

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
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionsResponse {
  status: boolean;
  message: string;
  data: {
    transactions: WalletTransaction[];
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

export interface PayoutRequestPayload {
  amount: number;
  payoutMethod: 'bank_transfer';
  bankAccount: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
    sortCode?: string;
    country?: string;
  };
  notes: string;
}

export interface PayoutRequestApiResponse {
  status: boolean;
  message: string;
  data: {
    payout: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      payoutMethod: string;
      paymentGateway: string;
      bankAccount: { accountName: string; accountNumber: string; bankName: string };
      requestedAt: string;
      estimatedProcessingTime: string;
    };
    transaction: Record<string, unknown>;
  };
}

export interface PayoutStatusResponse {
  status: boolean;
  message: string;
  data: {
    hasPendingPayout: boolean;
    pendingPayout?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      bankAccount: { accountName: string; accountNumber: string; bankName: string };
      requestedAt: string;
    };
  };
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subscription', 'Wallet', 'WalletTransactions', 'PayoutStatus'],
  endpoints: (builder) => ({
    getActiveSubscriptionPlans: builder.query<SubscriptionPlansResponse, void>({
      query: () => '/api/v1/payments/subscriptions/plans',
      providesTags: ['Subscription'],
    }),
    cancelSubscription: builder.mutation<CancelSubscriptionResponse, void>({
      query: () => ({
        url: '/api/v1/payments/subscriptions/cancel',
        method: 'PATCH',
      }),
      invalidatesTags: ['Subscription'],
    }),
    getWallet: builder.query<WalletResponse, void>({
      query: () => '/api/v1/wallet',
      providesTags: ['Wallet'],
    }),
    getWalletTransactions: builder.query<
      WalletTransactionsResponse,
      {
        period?: 'all_time' | 'today' | 'last_7_days' | 'last_30_days' | 'last_3_months' | 'this_year';
        page?: number;
        limit?: number;
      }
    >({
      query: (params = {}) => ({
        url: '/api/v1/wallet/transactions',
        params,
      }),
      providesTags: ['WalletTransactions'],
    }),
    requestPayout: builder.mutation<PayoutRequestApiResponse, PayoutRequestPayload>({
      query: (data) => ({
        url: '/api/v1/wallet/payouts/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'WalletTransactions', 'PayoutStatus'],
    }),
    getPayoutStatus: builder.query<PayoutStatusResponse, void>({
      query: () => '/api/v1/wallet/payouts/status',
      providesTags: ['PayoutStatus'],
    }),
  }),
});

export const {
  useGetActiveSubscriptionPlansQuery,
  useCancelSubscriptionMutation,
  useGetWalletQuery,
  useLazyGetWalletQuery,
  useGetWalletTransactionsQuery,
  useLazyGetWalletTransactionsQuery,
  useRequestPayoutMutation,
  useGetPayoutStatusQuery,
  useLazyGetPayoutStatusQuery,
} = paymentApi;
