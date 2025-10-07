import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../configure";

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    fileUpload: builder.mutation({
      query: (payload) => {
        return {
          url: "/api/v1/file-upload/single",
          method: "POST",
          body: payload,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    enrolUser: builder.mutation({
      query: (payload) => {
        return {
          url: "/api/v1/users/onboard",
          method: "POST",
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    verifyQuestions: builder.mutation({
      query: (payload) => {
        return {
          url: "/api/v1/users/verify",
          method: "POST",
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    fetchCategories: builder.query({
      query: (type: string) => ({
        url: `/api/v1/marketplace-categories?type=${type}`,
        method: "GET",
      }),
      transformResponse: (response: any) => {
        return response.data.categories.map((category: any) => ({
          value: category.name,
          label: category.name,
          subcategories: category.subcategories,
        }));
      },
    }),
  }),
});

export const {
  useFileUploadMutation,
  useEnrolUserMutation,
  useVerifyQuestionsMutation,
  useFetchCategoriesQuery,
} = appApi;
