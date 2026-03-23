/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export interface GlitNote {
  id: string;
  user: string;
  glit: { id: string; title?: string; image?: string };
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlitNotesResponse {
  status: boolean;
  message: string;
  data: { notes: GlitNote[] };
}

export interface GlitNoteResponse {
  status: boolean;
  message: string;
  data: { note: GlitNote };
}

export const glitNotesApi = createApi({
  reducerPath: 'glitNotesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['GlitNote'],
  endpoints: (builder) => ({
    getMyGlitNotes: builder.query<GlitNotesResponse, void>({
      query: () => ({ url: '/api/v1/glit-notes', method: 'GET' }),
      providesTags: ['GlitNote'],
    }),
    createGlitNote: builder.mutation<
      GlitNoteResponse,
      { glit: string; note: string }
    >({
      query: (body) => ({
        url: '/api/v1/glit-notes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GlitNote'],
    }),
    updateGlitNote: builder.mutation<
      GlitNoteResponse,
      { id: string; data: { note: string } }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/glit-notes/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['GlitNote'],
    }),
    deleteGlitNote: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({ url: `/api/v1/glit-notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['GlitNote'],
    }),
  }),
});

export const {
  useGetMyGlitNotesQuery,
  useCreateGlitNoteMutation,
  useUpdateGlitNoteMutation,
  useDeleteGlitNoteMutation,
} = glitNotesApi;
