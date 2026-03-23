/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export const glitfinderApi = createApi({
  reducerPath: 'glitfinderApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['GlitProfile'],
  endpoints: (builder) => ({
    getMyGlitProfile: builder.query<any, void>({
      query: () => ({
        url: '/api/v1/glit-profiles/me',
        method: 'GET',
      }),
      providesTags: ['GlitProfile'],
    }),
    checkUsernameAvailability: builder.query<
      { data: { available: boolean } },
      string
    >({
      query: (username) => ({
        url: `/api/v1/glit-profiles/username-availability/${encodeURIComponent(username)}`,
        method: 'GET',
      }),
    }),
    createGlitProfile: builder.mutation({
      query: (body: {
        profilePicture?: string;
        username: string;
        dateOfBirth?: string;
        bio?: string;
        isPrivate?: boolean;
      }) => ({
        url: '/api/v1/glit-profiles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GlitProfile'],
    }),
    updateGlitProfile: builder.mutation({
      query: (body: {
        profilePicture?: string;
        username?: string;
        dateOfBirth?: string;
        bio?: string;
        isPrivate?: boolean;
      }) => ({
        url: '/api/v1/glit-profiles/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['GlitProfile'],
    }),
    searchGlitProfiles: builder.query<
      { data: { docs: any[]; meta?: { total?: number } } },
      { searchTerm?: string; category?: string; page?: number; limit?: number }
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params.searchTerm != null && params.searchTerm !== '') search.append('searchTerm', params.searchTerm);
        if (params.category != null && params.category !== '') search.append('category', params.category);
        if (params.page != null) search.append('page', String(params.page));
        if (params.limit != null) search.append('limit', String(params.limit));
        const q = search.toString();
        return { url: `/api/v1/glit-profiles/search${q ? `?${q}` : ''}`, method: 'GET' };
      },
    }),
    followProfile: builder.mutation<{ status: boolean; message?: string }, string>({
      query: (profileId) => ({
        url: `/api/v1/glit-profiles/${profileId}/follow`,
        method: 'POST',
      }),
    }),
    unfollowProfile: builder.mutation<{ status: boolean; message?: string }, string>({
      query: (profileId) => ({
        url: `/api/v1/glit-profiles/${profileId}/follow`,
        method: 'DELETE',
      }),
    }),
    getGlitProfileByUsername: builder.query<
      { data: { profile: any } },
      string
    >({
      query: (username) => ({
        url: `/api/v1/glit-profiles/u/${encodeURIComponent(username.replace(/^@/, ''))}`,
        method: 'GET',
      }),
      providesTags: ['GlitProfile'],
    }),
    /** :id = glit profile Mongo _id. Resolves vendor store via StoresRepository.findByOwner. */
    getGlitProfileStore: builder.query<
      { storeId: string; glitProfileId: string },
      string
    >({
      query: (glitProfileId) => ({
        url: `/api/v1/glit-profiles/${encodeURIComponent(glitProfileId)}/store`,
        method: 'GET',
      }),
      transformResponse: (response: {
        data?: { storeId?: string; glitProfileId?: string };
      }) => ({
        storeId: response?.data?.storeId ?? '',
        glitProfileId: response?.data?.glitProfileId ?? '',
      }),
    }),
    getFollowers: builder.query<
      { data: { followers: any[]; count: number } },
      string
    >({
      query: (profileId) => ({
        url: `/api/v1/glit-profiles/${profileId}/followers`,
        method: 'GET',
      }),
      providesTags: (_, __, id) => [{ type: 'GlitProfile', id }],
    }),
    getFollowing: builder.query<
      { data: { following: any[]; count: number } },
      string
    >({
      query: (profileId) => ({
        url: `/api/v1/glit-profiles/${profileId}/following`,
        method: 'GET',
      }),
      providesTags: (_, __, id) => [{ type: 'GlitProfile', id }],
    }),
  }),
});

export const {
  useGetMyGlitProfileQuery,
  useLazyGetMyGlitProfileQuery,
  useLazyCheckUsernameAvailabilityQuery,
  useCreateGlitProfileMutation,
  useUpdateGlitProfileMutation,
  useSearchGlitProfilesQuery,
  useFollowProfileMutation,
  useUnfollowProfileMutation,
  useGetGlitProfileByUsernameQuery,
  useLazyGetGlitProfileByUsernameQuery,
  useGetGlitProfileStoreQuery,
  useLazyGetGlitProfileStoreQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
} = glitfinderApi;

