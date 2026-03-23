import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

// Types for Services
export interface ServiceAddOn {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  duration?: ServiceDuration;
}

export interface ServiceDuration {
  hours: number;
  minutes: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  type: string[];
  category: string;
  imageUrl: string;
  pricingType: 'fixed' | 'free' | 'from';
  maxBookingPerTimeSlot: number;
  price: number;
  currency: 'NGN' | 'GBP' | 'USD';
  durationInMinutes: number;
  addOns?: ServiceAddOn[];
  status: 'pending' | 'approved' | 'rejected';
  isDelivery?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request Types
export interface CreateServiceRequest {
  name: string;
  description?: string;
  type: string[];
  category: string;
  imageUrl: string;
  pricingType: 'fixed' | 'free' | 'from';
  maxBookingPerTimeSlot: number;
  price: number;
  currency: 'NGN' | 'GBP' | 'USD';
  duration: ServiceDuration;
  addOns?: Omit<ServiceAddOn, 'id'>[];
  isDelivery: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  type?: string[];
  category?: string;
  imageUrl?: string;
  pricingType?: 'fixed' | 'free' | 'from';
  maxBookingPerTimeSlot?: number;
  price?: number;
  currency?: 'NGN' | 'GBP' | 'USD';
  duration?: ServiceDuration;
  addOns?: Omit<ServiceAddOn, 'id'>[];
  isDelivery?: boolean;
}

export interface GetServicesRequest {
  storeId: string;
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  searchTerm?: string;
  durationInMinutes?: number;
  maxPrice?: number;
  isSuspended?: boolean;
}

// Response Types
export interface ServicesResponse {
  status: boolean;
  message: string;
  data: {
    services: Service[];
    meta: {
      totalDocs: number;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface ServiceResponse {
  status: boolean;
  message: string;
  data: {
    service: Service;
  };
}

export interface ErrorResponse {
  status: boolean;
  message: string | string[];
  data: Record<string, unknown>;
}

// Add-on Request Types
export interface CreateAddOnRequest {
  name: string;
  description?: string;
  price: number;
  duration?: ServiceDuration;
}

export interface UpdateAddOnRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: ServiceDuration;
}

// Add-on Response Types
export interface AddOnResponse {
  status: boolean;
  message: string;
  data: {
    addOn: ServiceAddOn;
  };
}

export const servicesApi = createApi({
  reducerPath: 'servicesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Service', 'AddOn'],
  endpoints: (builder) => ({
    // Get services with pagination and filtering
    getServices: builder.query<ServicesResponse, GetServicesRequest>({
      query: ({ storeId, page = 1, limit = 10, category, search, searchTerm, durationInMinutes, maxPrice, isSuspended }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (category) {
          params.append('category', category);
        }
        if (search) {
          params.append('search', search);
        }
        if (searchTerm) {
          params.append('searchTerm', searchTerm);
        }
        if (durationInMinutes) {
          params.append('durationInMinutes', durationInMinutes.toString());
        }
        if (maxPrice) {
          params.append('maxPrice', maxPrice.toString());
        }
        if (isSuspended !== undefined) {
          params.append('isSuspended', isSuspended ? 'true' : 'false');
        }

        console.log('API endpoint URL:', `services/store/${storeId}?${params.toString()}`);
        console.log('isSuspended parameter:', isSuspended, 'type:', typeof isSuspended);
        return `services/store/${storeId}?${params.toString()}`;
      },
      providesTags: (result, error, { storeId }) => [
        { type: 'Service', id: storeId },
        'Service',
      ],
    }),

    // Get single service
    getService: builder.query<ServiceResponse, string>({
      query: (serviceId) => `services/${serviceId}`,
      providesTags: (result, error, serviceId) => [
        { type: 'Service', id: serviceId },
        'Service',
      ],
    }),

    // Create service
    createService: builder.mutation<ServiceResponse, { storeId: string; data: CreateServiceRequest }>({
      query: ({ storeId, data }) => ({
        url: `services/${storeId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { storeId }) => [
        { type: 'Service', id: storeId },
        'Service',
      ],
    }),

    // Update service
    updateService: builder.mutation<ServiceResponse, { serviceId: string; data: UpdateServiceRequest }>({
      query: ({ serviceId, data }) => ({
        url: `services/${serviceId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { serviceId }) => [
        { type: 'Service', id: serviceId },
        'Service',
      ],
    }),

    // Delete service
    deleteService: builder.mutation<ErrorResponse, string>({
      query: (serviceId) => ({
        url: `services/${serviceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, serviceId) => [
        { type: 'Service', id: serviceId },
        'Service',
      ],
    }),

    // Toggle service suspension (archive/unarchive)
    toggleServiceSuspension: builder.mutation<ErrorResponse, string>({
      query: (serviceId) => ({
        url: `services/${serviceId}/toggle-suspension`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, serviceId) => [
        { type: 'Service', id: serviceId },
        'Service',
      ],
    }),

    // Reorder services
    reorderServices: builder.mutation<
      { status: boolean; message: string; data: object }, 
      { serviceIds: string[] }
    >({
      query: ({ serviceIds }) => ({
        url: 'services/reorder',
        method: 'PATCH',
        body: { serviceIds },
      }),
      invalidatesTags: ['Service'],
    }),

    // Add-on endpoints
    // Create add-on
    createAddOn: builder.mutation<AddOnResponse, { serviceId: string; data: CreateAddOnRequest }>({
      query: ({ serviceId, data }) => ({
        url: `services/${serviceId}/add-ons`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { serviceId }) => [
        { type: 'Service', id: serviceId },
        { type: 'AddOn', id: serviceId },
        'Service',
        'AddOn',
      ],
    }),

    // Update add-on
    updateAddOn: builder.mutation<AddOnResponse, { serviceId: string; addOnId: string; data: UpdateAddOnRequest }>({
      query: ({ serviceId, addOnId, data }) => ({
        url: `services/${serviceId}/add-ons/${addOnId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { serviceId, addOnId }) => [
        { type: 'Service', id: serviceId },
        { type: 'AddOn', id: addOnId },
        { type: 'AddOn', id: serviceId },
        'Service',
        'AddOn',
      ],
    }),

    // Delete add-on
    deleteAddOn: builder.mutation<ErrorResponse, { serviceId: string; addOnId: string }>({
      query: ({ serviceId, addOnId }) => ({
        url: `services/${serviceId}/add-ons/${addOnId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { serviceId, addOnId }) => [
        { type: 'Service', id: serviceId },
        { type: 'AddOn', id: addOnId },
        { type: 'AddOn', id: serviceId },
        'Service',
        'AddOn',
      ],
    }),
  }),
});

export const {
  // Queries
  useGetServicesQuery,
  useLazyGetServicesQuery,
  useGetServiceQuery,
  useLazyGetServiceQuery,

  // Service Mutations
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useToggleServiceSuspensionMutation,
  useReorderServicesMutation,

  // Add-on Mutations
  useCreateAddOnMutation,
  useUpdateAddOnMutation,
  useDeleteAddOnMutation,
} = servicesApi;