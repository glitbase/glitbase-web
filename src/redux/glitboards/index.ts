/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export interface Glitboard {
  id: string;
  user: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  glits?: any[];
  glitsCount: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlitboardsListResponse {
  status: boolean;
  message: string;
  data: {
    docs: Glitboard[];
    meta: {
      page: number;
      limit: number;
      totalDocs: number;
      totalPages: number;
      hasPrevPage: boolean;
      hasNextPage: boolean;
    };
  };
}

export interface GetGlitboardsFeedParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface CreateGlitboardRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface GlitboardResponse {
  status: boolean;
  message: string;
  data: { glitboard?: Glitboard; board?: Glitboard };
}

export interface AddGlitToBoardRequest {
  glitId: string;
}

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.append(key, String(value));
  });
  const q = search.toString();
  return q ? `?${q}` : '';
};

export const glitboardsApi = createApi({
  reducerPath: 'glitboardsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Glitboard'],
  endpoints: (builder) => ({
    getMyGlitboards: builder.query<
      GlitboardsListResponse,
      { page?: number; limit?: number; search?: string } | void
    >({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params?.page != null) q.set('page', String(params.page));
        if (params?.limit != null) q.set('limit', String(params.limit));
        if (params?.search != null && params.search !== '') q.set('search', params.search);
        const s = q.toString();
        return { url: `/api/v1/glitboards${s ? `?${s}` : ''}`, method: 'GET' };
      },
      providesTags: ['Glitboard'],
    }),
    getUserGlitboards: builder.query<
      GlitboardsListResponse,
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page, limit }) => {
        const q = new URLSearchParams();
        if (page != null) q.set('page', String(page));
        if (limit != null) q.set('limit', String(limit));
        const s = q.toString();
        return { url: `/api/v1/glitboards/user/${encodeURIComponent(userId)}${s ? `?${s}` : ''}`, method: 'GET' };
      },
      providesTags: ['Glitboard'],
    }),
    getGlitboardsFeed: builder.query<GlitboardsListResponse, GetGlitboardsFeedParams | void>({
      query: (params = {}) => ({
        url: `/api/v1/glitboards/feed${buildQueryString({
          page: params.page,
          limit: params.limit,
          search: params.search,
          category: params.category,
        })}`,
        method: 'GET',
      }),
      providesTags: ['Glitboard'],
    }),
    getGlitboardById: builder.query<GlitboardResponse, string>({
      query: (id) => ({ url: `/api/v1/glitboards/${id}`, method: 'GET' }),
      providesTags: (_, __, id) => [{ type: 'Glitboard', id }],
    }),
    createGlitboard: builder.mutation<GlitboardResponse, CreateGlitboardRequest>({
      query: (body) => ({ url: '/api/v1/glitboards', method: 'POST', body }),
      invalidatesTags: ['Glitboard'],
    }),
    addGlitToBoard: builder.mutation<
      { status: boolean; message: string },
      { boardId: string; data: AddGlitToBoardRequest }
    >({
      query: ({ boardId, data }) => ({
        url: `/api/v1/glitboards/${boardId}/glits`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Glitboard'],
    }),
    updateGlitboard: builder.mutation<
      GlitboardResponse,
      { id: string; data: { name?: string; description?: string; isPrivate?: boolean } }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/glitboards/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Glitboard', id }, 'Glitboard'],
    }),
    deleteGlitboard: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glitboards/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Glitboard'],
    }),
  }),
});

export const {
  useGetMyGlitboardsQuery,
  useGetUserGlitboardsQuery,
  useGetGlitboardsFeedQuery,
  useGetGlitboardByIdQuery,
  useLazyGetGlitboardsFeedQuery,
  useCreateGlitboardMutation,
  useAddGlitToBoardMutation,
  useUpdateGlitboardMutation,
  useDeleteGlitboardMutation,
} = glitboardsApi;
