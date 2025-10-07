// import { createApi } from "@reduxjs/toolkit/query/react";
// import { baseQueryWithReauth } from "../configure";

// export const paymentApi = createApi({
//   reducerPath: "payment",
//   baseQuery: baseQueryWithReauth,
//   endpoints: (builder) => ({
//     intent: builder.mutation({
//       query: (payload) => ({
//         url: "/api/v1/payments/subscriptions/initiate",
//         method: "POST",
//         body: payload,
//       }),
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     upgradeIntent: builder.mutation({
//       query: (payload) => ({
//         url: "/api/v1/payments/subscriptions/initiate-plan-upgrade-payment",
//         method: "POST",
//         body: payload,
//       }),
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     upgradePlan: builder.mutation({
//       query: (payload) => ({
//         url: "/api/v1/payments/subscriptions/upgrade-plan",
//         method: "PATCH",
//         body: payload,
//       }),
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     getSubcription: builder.query({
//       query: () => "/api/v1/payments/subscriptions/plans",
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     getSubcriptionHistory: builder.query({
//       query: () => "/api/v1/payments",
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     getUpgradePrice: builder.query({
//       query: ({ planId }) =>
//         `/api/v1/payments/subscriptions/prorated-plan-upgrade-cost?newPlanId=${planId}`,
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     toggleAutoRenew: builder.mutation({
//       query: (payload) => ({
//         url: "/api/v1/payments/subscriptions/toggle-auto-renew",
//         method: "PATCH",
//         body: payload,
//       }),
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     cancelSubscription: builder.mutation({
//       query: (payload) => ({
//         url: "/api/v1/payments/subscriptions/cancel",
//         method: "PATCH",
//         body: payload,
//       }),
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//     freeSub: builder.mutation({
//       query: (payload) => ({
//         url: "/api/v1/payments/subscriptions/free",
//         method: "POST",
//         body: payload,
//       }),
//       transformResponse: (response: any) => {
//         return response.data;
//       },
//     }),
//   }),
// });

// export const {
//   useGetSubcriptionQuery,
//   useIntentMutation,
//   useToggleAutoRenewMutation,
//   useCancelSubscriptionMutation,
//   useGetSubcriptionHistoryQuery,
//   useUpgradeIntentMutation,
//   useUpgradePlanMutation,
//   useGetUpgradePriceQuery,
//   useFreeSubMutation,
// } = paymentApi;
