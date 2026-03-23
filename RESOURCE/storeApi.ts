import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { setStore } from '../store/storeSlice';

// Types for Location
export interface StoreLocation {
  geoPoint: any;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Types for Opening Hours
export interface OpeningHour {
  day: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

// Types for Gallery
export interface GalleryImage {
  id: string;
  imageURL: string;
}

// Types for FAQ
export interface StoreFaq {
  id: string;
  question: string;
  answer: string;
}

// Types for StoreOwner
export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string;
}

// Types for Policies
export interface StorePolicies {
  payment?: {
    depositType: 'fixed' | 'percentage';
    amount: number;
    lateFee?: number;
  };
  booking?: {
    cancellation: string;
    rescheduling: string;
  };
  store?: {
    refund?: string;
    exchange?: string;
    shipping?: string;
  };
}

// Store Object Type
export interface Store {
  id: string;
  owner: Owner;
  name: string;
  type: string[];
  description: string;
  bannerImageUrl?: string;
  preferredCategories: string[];
  tags: string[];
  location: StoreLocation;
  openingHours: OpeningHour[];
  gallery: GalleryImage[];
  faqs: StoreFaq[];
  policies?: StorePolicies;
  onboardingStatus: string;
  status: string;
  isPublic: boolean;
  viewCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Request Types
export interface CreateStoreRequest {
  name: string;
  type: string[];
  description: string;
  bannerImageUrl?: string;
  preferredCategories: string[];
  tags: string[];
  location: StoreLocation;
  openingHours: OpeningHour[];
}

export interface UpdateStoreRequest {
  name?: string;
  status?: string;
  type?: string[];
  description?: string;
  bannerImageUrl?: string;
  preferredCategories?: string[];
  tags?: string[];
  location?: StoreLocation;
  openingHours?: OpeningHour[];
  policies?: StorePolicies;
}

export interface AddGalleryImageRequest {
  imageURL: string;
}

export interface AddFaqRequest {
  question: string;
  answer: string;
}

export interface UpdateFaqRequest {
  question?: string;
  answer?: string;
}

// Response Types
export interface StoreResponse {
  status: boolean;
  message: string;
  data: {
    store: Store;
  };
}

export interface StoresResponse {
  status: boolean;
  message: string;
  data: {
    stores: Store[];
  };
}

export interface ErrorResponse {
  status: boolean;
  message: string;
}

export const storeApi = createApi({
  reducerPath: 'storeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Store', 'MyStore', 'StoreGallery', 'StoreFaqs'],
  endpoints: (builder) => ({
    // Public Endpoints
    getAllStores: builder.query<StoresResponse, { category?: string; tags?: string } | void>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params && params.category) queryParams.append('category', params.category);
        if (params && params.tags) queryParams.append('tags', params.tags);
        
        const queryString = queryParams.toString();
        return `stores${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Store'],
    }),

    getStoreById: builder.query<StoreResponse, string>({
      query: (storeId) => `stores/${storeId}`,
      providesTags: (result, error, storeId) => [
        { type: 'Store', id: storeId },
        'Store',
      ],
    }),

    // Vendor Endpoints
    getMyStore: builder.query<StoreResponse, string | undefined>({
      query: (userId) => 'stores/my/store',
      providesTags: (result, error, userId) => [
        { type: 'MyStore', id: userId },
        'StoreGallery', 
        'StoreFaqs'
      ],
    }),

    createStore: builder.mutation<StoreResponse, CreateStoreRequest>({
      query: (data) => ({
        url: 'stores',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MyStore', 'Store'],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),

    updateStore: builder.mutation<StoreResponse, { storeId: string; data: UpdateStoreRequest }>({
      query: ({ storeId, data }) => ({
        url: `stores/${storeId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        'MyStore',
        'Store',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),

    deleteStore: builder.mutation<ErrorResponse, string>({
      query: (storeId) => ({
        url: `stores/${storeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MyStore', 'Store'],
    }),

    // Gallery Management
    addGalleryImage: builder.mutation<StoreResponse, { storeId: string; data: AddGalleryImageRequest }>({
      query: ({ storeId, data }) => ({
        url: `stores/${storeId}/gallery/images`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        'MyStore',
        'StoreGallery',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),

    removeGalleryImage: builder.mutation<StoreResponse, { storeId: string; imageId: string }>({
      query: ({ storeId, imageId }) => ({
        url: `stores/${storeId}/gallery/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        'MyStore',
        'StoreGallery',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),

    // FAQ Management
    addStoreFaq: builder.mutation<StoreResponse, { storeId: string; data: AddFaqRequest }>({
      query: ({ storeId, data }) => ({
        url: `stores/${storeId}/faqs`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        'MyStore',
        'StoreFaqs',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),

    updateStoreFaq: builder.mutation<StoreResponse, { storeId: string; faqId: string; data: UpdateFaqRequest }>({
      query: ({ storeId, faqId, data }) => ({
        url: `stores/${storeId}/faqs/${faqId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        'MyStore',
        'StoreFaqs',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),

    removeStoreFaq: builder.mutation<StoreResponse, { storeId: string; faqId: string }>({
      query: ({ storeId, faqId }) => ({
        url: `stores/${storeId}/faqs/${faqId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Store', id: storeId },
        'MyStore',
        'StoreFaqs',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          // Refetch store and update Redux store
          const userId = (getState() as any).user.user?.id;
          const storeResult = await dispatch(
            storeApi.endpoints.getMyStore.initiate(userId, { forceRefetch: true })
          );
          if (storeResult.data?.data?.store) {
            dispatch(setStore(storeResult.data.data.store));
          }
        } catch {
          // Ignore errors, let the component handle them
        }
      },
    }),
  }),
});

export const {
  // Public queries
  useGetAllStoresQuery,
  useLazyGetAllStoresQuery,
  useGetStoreByIdQuery,
  useLazyGetStoreByIdQuery,

  // Vendor queries
  useGetMyStoreQuery,
  useLazyGetMyStoreQuery,

  // Store management mutations
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,

  // Gallery management mutations
  useAddGalleryImageMutation,
  useRemoveGalleryImageMutation,

  // FAQ management mutations
  useAddStoreFaqMutation,
  useUpdateStoreFaqMutation,
  useRemoveStoreFaqMutation,
} = storeApi;