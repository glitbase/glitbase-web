/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';
import type {
  Notification,
  GetNotificationsRequest,
  MarkNotificationsReadRequest,
  NotificationsResponse,
  UnreadCountResponse,
  MarkReadResponse,
} from './types';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, GetNotificationsRequest | void>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params?.page != null) searchParams.set('page', String(params.page));
        if (params?.limit != null) searchParams.set('limit', String(params.limit));
        if (params?.isRead !== undefined) searchParams.set('isRead', String(params.isRead));
        if (params?.type) searchParams.set('type', params.type);
        // userId is only for cache key, not sent to server
        const qs = searchParams.toString();
        return { url: `/api/v1/notifications${qs ? `?${qs}` : ''}` };
      },
      transformResponse: (response: any) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map((n) => ({
                type: 'Notification' as const,
                id: n.id,
              })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    getUnreadCount: builder.query<UnreadCountResponse, string | void>({
      query: () => ({ url: '/api/v1/notifications/unread-count' }),
      transformResponse: (response: any) => response.data,
      providesTags: ['Notification'],
    }),

    markNotificationsRead: builder.mutation<
      MarkReadResponse,
      MarkNotificationsReadRequest
    >({
      query: (body) => ({
        url: '/api/v1/notifications/mark-read',
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsRead: builder.mutation<MarkReadResponse, void>({
      query: () => ({
        url: '/api/v1/notifications/mark-all-read',
        method: 'PATCH',
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

export type { Notification, NotificationType } from './types';
