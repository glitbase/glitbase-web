import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../configure";

export const entityApi = createApi({
  reducerPath: "entityApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getProducts: builder.query({
        query: (params) => ({
            url: "/api/v1/products",
            params: {
              page: params.page || 1,
              limit: params.limit || 10,
              ...(params.searchTerm && { searchTerm: params.searchTerm }),
              ...(params.startDate && { startDate: params.startDate }),
              ...(params.endDate && { endDate: params.endDate }),
              ...(params.category && { category: params.category }),
              ...(params.subCategory && { subCategory: params.subCategory }),
              ...(params.status && { status: params.status }),
              ...(params.minPrice && { minPrice: params.minPrice }),
              ...(params.maxPrice && { maxPrice: params.maxPrice }),
            },
          }),
        transformResponse: (response: any) => {
            return response.data
        },
    }),
    getServices: builder.query({
        query: (params) => ({
            url: "/api/v1/services",
            params: {
              page: params.page || 1,
              limit: params.limit || 10,
              ...(params.searchTerm && { searchTerm: params.searchTerm }),
              ...(params.startDate && { startDate: params.startDate }),
              ...(params.endDate && { endDate: params.endDate }),
              ...(params.category && { category: params.category }),
              ...(params.subCategory && { subCategory: params.subCategory }),
              ...(params.status && { status: params.status }),
              ...(params.minPrice && { minPrice: params.minPrice }),
              ...(params.maxPrice && { maxPrice: params.maxPrice }),
            },
          }),
        transformResponse: (response: any) => {
            return response.data
        },
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetServicesQuery
} = entityApi;
