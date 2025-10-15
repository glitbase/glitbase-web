/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../configure';

export const appApi = createApi({
  reducerPath: 'appApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    fileUpload: builder.mutation({
      query: (payload) => {
        return {
          url: '/api/v1/upload/single',
          method: 'POST',
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    enrolUser: builder.mutation({
      query: (payload) => {
        return {
          url: '/api/v1/users/onboard',
          method: 'POST',
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
          url: '/api/v1/users/verify',
          method: 'POST',
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
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        return response.data.categories.map((category: any) => ({
          value: category.name,
          label: category.name,
          subcategories: category.subcategories,
        }));
      },
    }),
    fetchMarketplace: builder.query({
      query: (limit: number = 10) => ({
        url: `/api/v1/marketplace?limit=${limit}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    fetchMarketplaceCategories: builder.query({
      query: ({ limit = 20, type = 'service' }) => ({
        url: `/api/v1/marketplace-categories?limit=${limit}&type=${type}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    recommendProvider: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/recommended-providers',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    searchMarketplace: builder.query({
      query: (params: {
        query?: string;
        sortBy?: 'latest' | 'highest_rating' | 'lowest_rating';
        bookingType?: string | string[];
        category?: string;
        storeAvailability?: string;
        distance?: number;
        duration?: string;
        maxPrice?: number;
        limit?: number;
        page?: number;
      }) => {
        const queryParams = new URLSearchParams();

        if (params.query) queryParams.append('query', params.query);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);

        // Handle bookingType as array or single value
        if (params.bookingType) {
          if (Array.isArray(params.bookingType)) {
            params.bookingType.forEach((type) =>
              queryParams.append('bookingType', type)
            );
          } else {
            queryParams.append('bookingType', params.bookingType);
          }
        }

        if (params.category) queryParams.append('category', params.category);
        if (params.storeAvailability)
          queryParams.append('storeAvailability', params.storeAvailability);
        if (params.distance)
          queryParams.append('distance', params.distance.toString());
        if (params.duration) queryParams.append('duration', params.duration);
        if (params.maxPrice)
          queryParams.append('maxPrice', params.maxPrice.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.page) queryParams.append('page', params.page.toString());

        return {
          url: `/api/v1/marketplace/search?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
    fetchCountries: builder.query({
      query: () => ({
        url: '/api/v1/countries',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        // Map country codes to dial codes and flags
        const countryMetadata: Record<
          string,
          { dialCode: string; flag: string }
        > = {
          NG: { dialCode: '+234', flag: '🇳🇬' },
          GB: { dialCode: '+44', flag: '🇬🇧' },
          US: { dialCode: '+1', flag: '🇺🇸' },
          CA: { dialCode: '+1', flag: '🇨🇦' },
          // Add more countries as needed
        };

        return response.data.countries.map((country: any) => ({
          name: country.name,
          code: country.code,
          currency: country.currency,
          dialCode: countryMetadata[country.code]?.dialCode || '+000',
          flag: countryMetadata[country.code]?.flag || '🏳️',
        }));
      },
    }),
    updateProfile: builder.mutation({
      query: (payload) => ({
        url: '/api/v1/users/profile',
        method: 'PATCH',
        body: payload,
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useFileUploadMutation,
  useEnrolUserMutation,
  useVerifyQuestionsMutation,
  useFetchCategoriesQuery,
  useFetchMarketplaceQuery,
  useFetchMarketplaceCategoriesQuery,
  useRecommendProviderMutation,
  useSearchMarketplaceQuery,
  useLazySearchMarketplaceQuery,
  useFetchCountriesQuery,
  useUpdateProfileMutation,
} = appApi;
