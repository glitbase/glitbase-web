import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export interface CreateReportRequest {
  type: 'glit' | 'store' | 'user' | 'booking' | 'review';
  targetId: string;
  title: string;
  description?: string;
}

export interface ReportResponse {
  status: boolean;
  message: string;
  data?: {
    report: {
      id: string;
      type: string;
      targetId: string;
      title: string;
      description?: string;
      createdAt: string;
    };
  };
}

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    createReport: builder.mutation<ReportResponse, CreateReportRequest>({
      query: (data) => ({
        url: '/api/v1/reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Report'],
    }),
  }),
});

export const { useCreateReportMutation } = reportsApi;
