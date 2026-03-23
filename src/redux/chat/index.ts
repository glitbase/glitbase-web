/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';
import type { Chat, Message, ChatsMeta, CreateChatPayload, SendMessagePayload } from './types';

interface GetChatsResponse {
  chats: Chat[];
  meta: ChatsMeta;
}

interface GetMessagesResponse {
  messages: Message[];
  meta: { totalDocs: number; limit: number; page: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Chats', 'Chat', 'Messages'],
  endpoints: (builder) => ({
    getChats: builder.query<GetChatsResponse, { page?: number; limit?: number } | void>({
      query: (params = {}) => ({
        url: '/api/v1/chats',
        params: params?.page != null ? { page: params.page, limit: params.limit ?? 50 } : undefined,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.chats.map((c) => ({ type: 'Chats' as const, id: c.id })),
              { type: 'Chats', id: 'LIST' },
            ]
          : [{ type: 'Chats', id: 'LIST' }],
    }),
    createChat: builder.mutation<{ chat: Chat }, CreateChatPayload>({
      query: (body) => ({
        url: '/api/v1/chats',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: [{ type: 'Chats', id: 'LIST' }],
    }),
    getMessages: builder.query<
      GetMessagesResponse,
      { chatId: string; page?: number; limit?: number; before?: string }
    >({
      query: ({ chatId, page = 1, limit = 20, before }) => ({
        url: `/api/v1/chats/${chatId}/messages`,
        params: { page, limit, ...(before && { before }) },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (result, _err, { chatId }) =>
        result
          ? [
              ...result.messages.map((m) => ({ type: 'Messages' as const, id: `${chatId}-${m.id}` })),
              { type: 'Messages', id: chatId },
            ]
          : [{ type: 'Messages', id: chatId }],
    }),
    sendMessage: builder.mutation<{ message: Message }, { chatId: string; payload: SendMessagePayload }>({
      query: ({ chatId, payload }) => ({
        url: `/api/v1/chats/${chatId}/messages`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => response.data,
      // Only invalidate chat list so sidebar updates; don't refetch messages (we update cache in component)
      invalidatesTags: [{ type: 'Chats', id: 'LIST' }],
    }),
    markChatRead: builder.mutation<Record<string, never>, string>({
      query: (chatId) => ({
        url: `/api/v1/chats/${chatId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _err, chatId) => [
        { type: 'Chats', id: 'LIST' },
        { type: 'Chats', id: chatId },
      ],
    }),
    deleteMessage: builder.mutation<Record<string, never>, { chatId: string; messageId: string }>({
      query: ({ messageId }) => ({
        url: `/api/v1/chats/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { chatId }) => [
        { type: 'Chats', id: 'LIST' },
        { type: 'Messages', id: chatId },
      ],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useCreateChatMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkChatReadMutation,
  useDeleteMessageMutation,
} = chatApi;
