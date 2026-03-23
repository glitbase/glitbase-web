/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export interface Glit {
  creatorType: string;
  glitProfile: any;
  id: string;
  user: string;
  image: string;
  title: string;
  description: string;
  category?: string;
  tags: string[];
  taggedServices?: string[];
  creatorCredited: boolean;
  isPrivate: boolean;
  likes: number;
  saves: number;
  views: number;
  shares?: number;
  createdAt: string;
  updatedAt: string;
  likedBy?: string[];
  savedBy?: string[];
}

export interface GlitsListResponse {
  status: boolean;
  message: string;
  data: {
    docs: Glit[];
    meta: {
      hasNextPage: boolean;
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetGlitsParams {
  page?: number;
  limit?: number;
  includePrivate?: boolean;
}

export interface GetGlitsFeedParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  creatorType?: 'personal' | 'verifiedPro';
  glitboardSize?: string;
  followerCount?: string;
}

export interface GetUserGlitsParams {
  userId: string;
  page?: number;
  limit?: number;
}

export interface CreateGlitRequest {
  image: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  taggedServices?: string[];
  creatorCredited: boolean;
  isPrivate: boolean;
}

export interface UpdateGlitRequest {
  image?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  taggedServices?: string[];
  creatorCredited?: boolean;
  isPrivate?: boolean;
}

export interface GlitResponse {
  status: boolean;
  message: string;
  data: { glit: Glit };
}

const buildQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.append(key, String(value));
  });
  const q = search.toString();
  return q ? `?${q}` : '';
};

export const glitsApi = createApi({
  reducerPath: 'glitsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Glit', 'MyGlits', 'Feed'],
  endpoints: (builder) => ({
    getMySavedGlits: builder.query<GlitsListResponse, GetGlitsParams | void>({
      query: (params = {}) => ({
        url: `/api/v1/glits/me/saved${buildQueryString({
          page: params.page,
          limit: params.limit,
          includePrivate: params.includePrivate,
        })}`,
        method: 'GET',
      }),
      providesTags: ['MyGlits'],
    }),
    getMyGlits: builder.query<GlitsListResponse, GetGlitsParams | void>({
      query: (params = {}) => ({
        url: `/api/v1/glits/me${buildQueryString({
          page: params.page,
          limit: params.limit,
          includePrivate: params.includePrivate,
        })}`,
        method: 'GET',
      }),
      providesTags: ['MyGlits'],
    }),
    getUserGlits: builder.query<GlitsListResponse, GetUserGlitsParams>({
      query: ({ userId, page, limit }) => ({
        url: `/api/v1/glits/user/${encodeURIComponent(userId)}${buildQueryString({ page, limit })}`,
        method: 'GET',
      }),
      providesTags: ['Feed'],
    }),
    getGlitsFeed: builder.query<GlitsListResponse, GetGlitsFeedParams | void>({
      query: (params = {}) => ({
        url: `/api/v1/glits/feed${buildQueryString({
          page: params.page,
          limit: params.limit,
          category: params.category,
          search: params.search,
          creatorType: params.creatorType,
          glitboardSize: params.glitboardSize,
          followerCount: params.followerCount,
        })}`,
        method: 'GET',
      }),
      providesTags: ['Feed'],
    }),
    getGlitById: builder.query<{ status: boolean; message: string; data: { glit: Glit } }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}`, method: 'GET' }),
      providesTags: (_, __, id) => [{ type: 'Glit', id }],
    }),
    createGlit: builder.mutation<GlitResponse, CreateGlitRequest>({
      query: (body) => ({ url: '/api/v1/glits', method: 'POST', body }),
      invalidatesTags: ['MyGlits', 'Feed'],
    }),
    getMyLikedGlits: builder.query<GlitsListResponse, GetGlitsParams | void>({
      query: (params = {}) => ({
        url: `/api/v1/glits/me/liked${buildQueryString({
          page: params.page,
          limit: params.limit,
          includePrivate: params.includePrivate,
        })}`,
        method: 'GET',
      }),
      providesTags: ['MyGlits'],
    }),
    likeGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}/like`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }, 'Feed', 'MyGlits'],
    }),
    unlikeGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}/like`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }, 'Feed', 'MyGlits'],
    }),
    saveGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}/save`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }, 'Feed', 'MyGlits'],
    }),
    unsaveGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}/save`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }, 'Feed', 'MyGlits'],
    }),
    shareGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}/share`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }],
    }),
    viewGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}/view`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }],
    }),
    updateGlit: builder.mutation<GlitResponse, { id: string; data: UpdateGlitRequest }>({
      query: ({ id, data }) => ({
        url: `/api/v1/glits/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Glit', id }, 'MyGlits', 'Feed'],
    }),
    deleteGlit: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glits/${id}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [{ type: 'Glit', id }, 'MyGlits', 'Feed'],
    }),
  }),
});

export const {
  useGetMySavedGlitsQuery,
  useLazyGetMySavedGlitsQuery,
  useGetMyGlitsQuery,
  useGetUserGlitsQuery,
  useGetGlitsFeedQuery,
  useLazyGetGlitsFeedQuery,
  useGetGlitByIdQuery,
  useLazyGetGlitByIdQuery,
  useCreateGlitMutation,
  useGetMyLikedGlitsQuery,
  useLikeGlitMutation,
  useUnlikeGlitMutation,
  useSaveGlitMutation,
  useUnsaveGlitMutation,
  useShareGlitMutation,
  useViewGlitMutation,
  useUpdateGlitMutation,
  useDeleteGlitMutation,
} = glitsApi;
