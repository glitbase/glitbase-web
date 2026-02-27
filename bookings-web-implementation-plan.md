# Bookings Management Module - Web Implementation Plan

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Models & Types](#data-models--types)
5. [Web Implementation Plan](#web-implementation-plan)
6. [Component Structure](#component-structure)
7. [State Management](#state-management)
8. [Features Implementation](#features-implementation)
9. [User Flows](#user-flows)
10. [Timeline & Milestones](#timeline--milestones)

---

Ground Rules:

1. Always reference this file for context.
2. Always use existing colour, components, and approach to preserve continuity.
3. The implementation will be done in granula approach.
4. I will be attaching images of the UI from Figma.
5. In a situation where there's a conflict with the design and the .md file, the.md file takes precedence. (eg. The .md file says All booking | Pending | Ongoing | Completed | Rejected, but the design says Ongoing | Completed | Rejected. In this situation, the .md file takes precedence.
6. Always think like a very senior frontend engineer, always maintain best practise and always write clean and reusable code.
7. The Booking module is for both Customer and Vendor, with slightly different views and different actions.

## Overview

The Bookings Management module handles post-booking operations from both customer and vendor perspectives. It allows users to view, track, update, and manage existing bookings across three service types:

- **Normal Service**: Standard appointments at vendor location
- **Home Service**: Services delivered at customer's location
- **Pick-Drop Service**: Vendor picks up items, services them, and returns

### Scope of This Plan

- ✅ **Customer Booking Management**: View, track, cancel, complete, rate bookings
- ✅ **Vendor Booking Management**: View, accept/reject, update status, manage bookings
- ❌ **Booking Creation**: Out of scope (already implemented)

### Current Implementation Status

- ✅ Mobile implementation fully functional (React Native/Expo)
- ✅ Booking creation flow complete
- ⏳ Web booking management pending

### Key Features

- Real-time booking status tracking with dynamic timelines
- Customer booking dashboard with filtering
- Vendor booking management dashboard
- Advanced filtering and search
- Accept/reject booking workflow
- Stage-based progress tracking
- Dual completion confirmation (vendor + customer)
- Rating and review system
- Rebook functionality

### What This Plan Covers

**Customer Side:**

- View all bookings with status filtering
- View detailed booking information with timeline
- Track booking progress through stages
- Cancel bookings (with restrictions)
- Confirm service completion
- Rate and review completed services

**Vendor Side:**

- View all bookings with advanced filtering
- Accept or reject pending bookings
- Update booking stages as work progresses
- Mark services as complete
- Search and sort bookings
- View booking metrics dashboard

**NOT Covered:**

- Booking creation wizard (already implemented)
- Payment processing (part of creation flow)
- Service catalog browsing (separate module)
- Cart management (part of creation flow)

---

## System Architecture

### Technology Stack (Recommended for Web)

```
Frontend Framework: React + TypeScript
State Management: Redux Toolkit + RTK Query
Routing: React Router v6
UI Library: Material-UI / Tailwind CSS / Chakra UI
Form Management: React Hook Form + Zod
Date/Time Pickers: react-datepicker / @mui/x-date-pickers
Image Upload: react-dropzone
Payment: Stripe React SDK / Paystack Inline
HTTP Client: RTK Query (already configured)
```

### Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                │
│  (React Components, Pages, UI Elements)             │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              Business Logic Layer                   │
│  (Redux Slices, RTK Query, Custom Hooks)            │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                 Data Layer                          │
│  (API Services, Local Storage, Cache)               │
└─────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Base URL

```
Production: https://api.glitbase.com
Development: Configure via environment variable
```

### Customer Endpoints

#### 1. Get User Bookings

```http
GET /bookings?page=1&limit=10&status=pending
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: "all" | "pending" | "ongoing" | "completed" | "rejected"

Response: 200 OK
{
  "bookings": [<Booking Object>],
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalItems": number,
    "hasMore": boolean
  }
}
```

#### 2. Get Single Booking

```http
GET /bookings/{bookingReference}
Authorization: Bearer <token>

Response: 200 OK
{
  "booking": <Booking Object>
}
```

#### 3. Cancel Booking

```http
POST /bookings/{bookingId}/cancel
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "reason": "string"
}

Response: 200 OK
{
  "booking": <Booking Object>,
  "message": "Booking cancelled successfully"
}
```

#### 4. Mark Booking Complete (Customer)

```http
POST /bookings/{bookingReference}/complete/customer
Authorization: Bearer <token>

Response: 200 OK
{
  "booking": <Booking Object>,
  "message": "Booking marked as complete"
}
```

### Vendor Endpoints

#### 5. Get Vendor Bookings

```http
GET /bookings/vendor/all?page=1&limit=10&status=all&sortBy=newest
Authorization: Bearer <token>

Query Parameters:
- page: number
- limit: number
- status: "all" | "pending" | "fulfilled" | "cancelled" | "rejected"
- sortBy: "newest" | "oldest" | "customerName"
- serviceType: "normal" | "home" | "pickDrop"
- durationRange: "under30" | "30to60" | "1to2hr" | "3to4hr" | "5plus"
- valueRange: "under5000" | "5000to10000" | "10000to20000" | "20000plus"
- search: string

Response: 200 OK
{
  "bookings": [<Booking Object>],
  "pagination": { ... }
}
```

#### 6. Confirm Booking

```http
POST /bookings/{bookingReference}/confirm
Authorization: Bearer <token>

Response: 200 OK
{
  "booking": <Booking Object>,
  "message": "Booking confirmed successfully"
}
```

#### 7. Update Booking Stage

```http
PATCH /bookings/{bookingReference}/stage
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "stage": "confirmed" | "readyToServe" | "vendorEnroute" | "vendorArrived" |
          "itemReceived" | "inProgress" | "readyForPickup" | "completed"
}

Response: 200 OK
{
  "booking": <Booking Object>
}
```

#### 8. Mark Booking Complete (Vendor)

```http
POST /bookings/{bookingReference}/complete/vendor
Authorization: Bearer <token>

Response: 200 OK
{
  "booking": <Booking Object>
}
```

#### 9. Reject Booking

```http
POST /bookings/{bookingReference}/reject
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "reason": "string"
}

Response: 200 OK
{
  "booking": <Booking Object>,
  "message": "Booking rejected"
}
```

### Shared Endpoints

#### 10. Get Vendor Metrics

```http
GET /bookings/vendor/metrics
Authorization: Bearer <token>

Response: 200 OK
{
  "metrics": {
    "totalBookings": number,
    "pendingBookings": number,
    "completedBookings": number,
    "totalRevenue": number,
    "averageRating": number
  }
}
```

---

## Data Models & Types

### TypeScript Interfaces

```typescript
// Core Booking Interface
interface Booking {
  _id: string;
  bookingReference: string;
  user: string; // Customer ID
  store: {
    id: string;
    name: string;
    bannerImageUrl?: string;
    location?: {
      address: string;
      city: string;
      postalCode: string;
    };
  };
  serviceType: 'normal' | 'home' | 'pickDrop';
  serviceDate: string; // ISO format
  serviceTime: string; // "HH:MM AM/PM"
  status:
    | 'pending'
    | 'confirmed'
    | 'ongoing'
    | 'completed'
    | 'rejected'
    | 'refunded'
    | 'cancelled';
  bookingStage: BookingStage;
  stageHistory?: StageHistoryItem[];
  items: BookingItem[];
  pricing: BookingPricing;
  payment?: {
    paymentReference: string;
    status: 'pending' | 'success' | 'failed';
    paidAt?: string;
  };
  contactInfo?: ContactInfo;
  homeServiceAddress?: Address;
  pickupInfo?: PickupDropoffInfo;
  dropoffInfo?: PickupDropoffInfo;
  additionalInfo?: {
    notes?: string;
    images?: string[];
  };
  vendorMarkedComplete: boolean;
  customerMarkedComplete: boolean;
  vendorCompletedAt?: string | null;
  customerCompletedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Booking Stage Types
type BookingStage =
  | 'pending'
  | 'confirmed'
  | 'readyToServe'
  | 'vendorEnroute'
  | 'vendorArrived'
  | 'itemReceived'
  | 'inProgress'
  | 'readyForPickup'
  | 'completed'
  | 'rejected';

interface StageHistoryItem {
  stage: BookingStage;
  timestamp: string;
  updatedBy: string;
}

// Booking Items
interface BookingItem {
  service: {
    id: string;
    name: string;
    description?: string;
    category: string;
    imageUrl?: string;
    price: number;
    currency: string;
    durationInMinutes: number;
    pricingType: 'fixed' | 'variable';
    isDelivery: boolean;
  };
  quantity: number;
  addOns?: AddOn[];
  subtotal: number;
  totalDuration: number;
}

interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationInMinutes: number;
}

// Pricing
interface BookingPricing {
  subtotal: number;
  totalDuration: number;
  paymentTerm: 'full' | 'deposit';
  depositPercentage?: number;
  amountPaid: number;
  remainingBalance: number;
  currency: string;
  commissionRate: number;
  commissionAmount: number;
  vendorPayout: number;
}

// Contact & Address
interface ContactInfo {
  name: string;
  email: string;
  phoneNumber: string;
}

interface Address {
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  additionalDirections?: string;
}

interface PickupDropoffInfo {
  address: Address;
  date: string;
  notes?: string;
}

// Cart Types
interface CartItem {
  service: Service;
  quantity: number;
  selectedAddOns: AddOn[];
}

interface CartState {
  items: Record<string, CartItem[]>; // storeId -> items
}

// Create Booking Request
interface CreateBookingRequest {
  storeId: string;
  serviceType: 'normal' | 'home' | 'pickDrop';
  serviceDate: string;
  serviceTime: string;
  cartItems: {
    serviceId: string;
    quantity: number;
    addOnIds: string[];
  }[];
  paymentMethod: 'card' | 'wallet';
  paymentGateway: 'stripe' | 'paystack';
  currency: string;
  pricing: {
    paymentTerm: 'full' | 'deposit';
    subtotal: number;
    totalDuration: number;
    amountToPay: number;
    remainingBalance: number;
  };
  paymentCardId?: string;
  customerPhone?: string;
  contactInfo?: ContactInfo;
  homeServiceAddress?: Address;
  pickupInfo?: PickupDropoffInfo;
  dropoffInfo?: PickupDropoffInfo;
  additionalInfo?: {
    notes?: string;
    images?: string[];
  };
}

// Pagination
interface PaginationResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
  };
}
```

---

## Web Implementation Plan

### Phase 1: Foundation (Week 1)

**Setup & Infrastructure**

1. **Project Setup**
   - [ ] Configure Redux Toolkit store
   - [ ] Setup RTK Query API service
   - [ ] Configure routing with React Router
   - [ ] Setup environment variables
   - [ ] Configure TypeScript types/interfaces

2. **API Integration**
   - [ ] Create `bookingsApi.ts` RTK Query service
   - [ ] Define all management endpoint queries and mutations
   - [ ] Setup API authentication middleware
   - [ ] Configure tag-based cache invalidation
   - [ ] Add error handling and retry logic

3. **State Management**
   - [ ] Setup Redux store
   - [ ] Configure booking filters state (optional)
   - [ ] Configure store with middleware

### Phase 2: Customer Booking Management (Week 2)

**Customer-Facing Features**

1. **Bookings List Page** (`/bookings`)
   - [ ] Create bookings list layout
   - [ ] Implement status tabs (All, Pending, Ongoing, Completed, Rejected)
   - [ ] Build booking card component
     - Booking reference display
     - Store name and image
     - Service date and time
     - Current status badge
     - Progress indicator for ongoing bookings
   - [ ] Add search functionality
   - [ ] Implement pagination
   - [ ] Add refresh button
   - [ ] Loading skeletons
   - [ ] Empty states for no bookings

2. **Booking Details Page** (`/bookings/:reference`)
   - [ ] Create booking details layout
   - [ ] Header section
     - Booking reference
     - Status badge
     - Store information
   - [ ] Build dynamic timeline component (varies by service type)
     - Normal service timeline
     - Home service timeline
     - Pick-drop service timeline
   - [ ] Service items section
     - Display services with quantities
     - Show add-ons for each service
     - Individual item pricing
   - [ ] Pricing breakdown
     - Subtotal
     - Commission/service charge
     - Payment term (Full/Deposit)
     - Amount paid
     - Remaining balance
   - [ ] Address information section (conditional)
     - Home service address
     - Pickup address (pick-drop)
     - Dropoff address (pick-drop)
   - [ ] Additional info accordion
     - Customer notes
     - Image gallery
   - [ ] Contact information
   - [ ] Action buttons
     - **Cancel Booking** (if status allows)
     - **Mark as Complete** (if vendor marked complete)
     - **Rebook** (if completed)
   - [ ] Implement cancel booking modal
     - Reason input
     - Confirmation
     - API call
   - [ ] Implement complete booking confirmation
   - [ ] Real-time status updates

3. **Booking Rating** (`/bookings/:reference/rate`)
   - [ ] Star rating component (1-5 stars)
   - [ ] Review textarea (500 char limit)
   - [ ] Character counter
   - [ ] Submit review integration
   - [ ] Success message
   - [ ] Redirect to booking details

### Phase 3: Vendor Booking Management (Week 3)

**Vendor Dashboard Features**

1. **Vendor Bookings List** (`/vendor/bookings`)
   - [ ] Create vendor bookings list layout
   - [ ] Status tabs (All, Pending, Fulfilled, Cancelled, Rejected)
   - [ ] Advanced filters sidebar/drawer
     - **Sort by**: Newest, Oldest, Customer Name
     - **Service type**: Normal, Home, Pick-Drop
     - **Duration range**: Under 30min, 30-60min, 1-2hr, 3-4hr, 5+hr
     - **Value range**: Currency-aware ranges
     - Reset filters button
   - [ ] Search with debounce (customer name, booking ref)
   - [ ] Booking cards with reference & customer info
     - Booking reference (clickable)
     - Customer name
     - Service type badge
     - Date and time
     - Total value
     - Status
   - [ ] Pagination
   - [ ] Loading states
   - [ ] Empty states
   - [ ] Export functionality (CSV/PDF) - optional

2. **Vendor Booking Details** (`/vendor/bookings/:reference`)
   - [ ] Booking information display (similar to customer view)
   - [ ] Customer information section
     - Name, email, phone
   - [ ] Accept/Reject booking actions (for pending bookings)
     - **Accept button** → calls confirm endpoint
     - **Reject button** → opens modal
       - Reason textarea
       - Confirmation
       - API call
   - [ ] Stage update section (for confirmed bookings)
     - Dropdown/stepper to update stage
     - Available stages based on service type
     - Update button
     - Confirmation before update
   - [ ] Timeline with stage progression
     - Visual timeline
     - Stage history with timestamps
   - [ ] Mark as complete button
     - Only show if in progress/ready
     - Confirmation modal
     - API call
   - [ ] Contact customer button
     - Link to chat/messaging
     - Create booking chat
   - [ ] Action history log

3. **Vendor Metrics Dashboard** (`/vendor/dashboard`) - Optional
   - [ ] Metrics cards
     - Total bookings
     - Pending bookings
     - Completed bookings
     - Total revenue
     - Average rating
   - [ ] Charts and graphs
     - Bookings over time
     - Revenue trends
   - [ ] Recent bookings list (quick view)

### Phase 4: Shared Components & Features (Week 4)

**Reusable Components**

1. **UI Components**
   - [ ] `BookingCard` - Reusable booking display card
     - Customer variant (shows store info)
     - Vendor variant (shows customer info)
   - [ ] `BookingTimeline` - Dynamic timeline based on service type
     - Stepper component
     - Stage icons and labels
     - Timestamps from stage history
   - [ ] `ServiceItemCard` - Service with add-ons display
     - Service name, image, price
     - Quantity
     - Add-ons list
     - Subtotal
   - [ ] `PricingBreakdown` - Detailed pricing table
     - Line items
     - Subtotal
     - Commission
     - Total
     - Payment term indicator
   - [ ] `AddressDisplay` - Formatted address component
     - Single-line or multi-line format
     - Google Maps link (optional)
   - [ ] `StatusBadge` - Color-coded status indicators
     - Different colors for each status
     - Icon + text
   - [ ] `ImageGallery` - Image viewer with lightbox
     - Thumbnail grid
     - Lightbox on click
     - Navigation between images
   - [ ] `ConfirmationModal` - Reusable confirmation dialogs
     - Title, message, actions
     - Confirm/cancel buttons
   - [ ] `LoadingSkeleton` - Loading placeholders
     - Card skeleton
     - List skeleton
     - Detail page skeleton

2. **Custom Hooks**
   - [ ] `useBookingFilters` - Filter state management
     - Filter values
     - Update filters
     - Reset filters
   - [ ] `useBookingPagination` - Pagination logic
     - Current page
     - Page size
     - Total pages
     - Next/prev handlers
   - [ ] `useBookingActions` - Common booking actions
     - Cancel booking
     - Complete booking
     - Refresh booking
   - [ ] `useBookingPolling` - Auto-refresh for real-time updates (optional)

3. **Utilities**
   - [ ] `formatDuration(minutes)` - Duration formatter
     - "30 min", "1 hr 30 min", "2 hr"
   - [ ] `getCurrencySymbol(currency)` - Currency helper
     - ₦ for NGN, £ for GBP, $ for USD
   - [ ] `formatBookingTime()` - Time formatting
     - 12-hour format with AM/PM
   - [ ] `getTimelineStages(serviceType)` - Timeline generator
     - Returns stages array for service type
   - [ ] `formatPrice(amount, currency)` - Price formatter
   - [ ] `getStatusColor(status)` - Status color mapping

### Phase 5: Polish & Optimization (Week 5)

**Performance & UX**

1. **Performance**
   - [ ] Implement code splitting by route
   - [ ] Lazy load images
   - [ ] Optimize bundle size
   - [ ] Add request caching strategies (RTK Query handles this)
   - [ ] Debounce search and filters

2. **UX Enhancements**
   - [ ] Loading states and skeletons
   - [ ] Error boundaries
   - [ ] Toast notifications for actions
     - Booking cancelled
     - Booking confirmed
     - Stage updated
     - Rating submitted
   - [ ] Empty states
     - No bookings yet
     - No results from filters
   - [ ] Responsive design (mobile, tablet, desktop)
   - [ ] Accessibility
     - ARIA labels
     - Keyboard navigation
     - Screen reader support
   - [ ] Pull-to-refresh on mobile

3. **Testing**
   - [ ] Unit tests for components
   - [ ] Integration tests for booking management flows
   - [ ] API mocking for tests
   - [ ] E2E tests for critical paths
     - View bookings
     - View details
     - Cancel booking
     - Vendor accept/reject
     - Stage updates

---

## Component Structure

### Directory Layout

```
src/
├── features/
│   └── bookings/
│       ├── api/
│       │   └── bookingsApi.ts          # RTK Query API
│       ├── components/
│       │   ├── BookingCard.tsx         # Reusable booking card (customer/vendor variants)
│       │   ├── BookingTimeline.tsx     # Dynamic timeline by service type
│       │   ├── ServiceItemCard.tsx     # Service display with add-ons
│       │   ├── PricingBreakdown.tsx    # Pricing table component
│       │   ├── AddressDisplay.tsx      # Address formatting component
│       │   ├── StatusBadge.tsx         # Status indicator badge
│       │   ├── ImageGallery.tsx        # Image viewer with lightbox
│       │   ├── ConfirmationModal.tsx   # Reusable confirmation dialog
│       │   ├── CancelBookingModal.tsx  # Cancel booking modal
│       │   ├── RejectBookingModal.tsx  # Reject booking modal (vendor)
│       │   └── BookingFilters.tsx      # Filters sidebar/drawer
│       ├── pages/
│       │   ├── customer/
│       │   │   ├── BookingsList.tsx    # Customer bookings list
│       │   │   ├── BookingDetails.tsx  # Customer booking detail view
│       │   │   └── BookingRating.tsx   # Rate booking page
│       │   └── vendor/
│       │       ├── VendorBookingsList.tsx    # Vendor bookings list
│       │       ├── VendorBookingDetails.tsx  # Vendor booking detail view
│       │       └── VendorDashboard.tsx       # Metrics dashboard (optional)
│       ├── hooks/
│       │   ├── useBookingFilters.ts    # Filter state management
│       │   ├── useBookingPagination.ts # Pagination logic
│       │   ├── useBookingActions.ts    # Common booking actions
│       │   └── useBookingPolling.ts    # Real-time updates (optional)
│       ├── utils/
│       │   ├── formatters.ts           # Date, time, currency, duration formatters
│       │   ├── timeline.ts             # Timeline stage generation
│       │   └── constants.ts            # Booking constants (statuses, types, etc.)
│       └── types/
│           └── booking.types.ts        # TypeScript interfaces
├── store/
│   └── store.ts                        # Redux store configuration
└── routes/
    └── bookingsRoutes.tsx              # Booking routes configuration
```

---

## State Management

### Redux Store Configuration

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { bookingsApi } from '@/features/bookings/api/bookingsApi';

export const store = configureStore({
  reducer: {
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    // Add other slices as needed (auth, user, etc.)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(bookingsApi.middleware),
});

// Enable refetchOnFocus and refetchOnReconnect for real-time updates
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Notes:**

- No need for Redux Persist for booking management (data comes from API)
- RTK Query handles caching automatically
- `setupListeners` enables auto-refetch on window focus and network reconnect

### RTK Query API Setup

```typescript
// features/bookings/api/bookingsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Booking, PaginationResponse } from '../types/booking.types';

export const bookingsApi = createApi({
  reducerPath: 'bookingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Bookings', 'Booking', 'VendorBookings', 'VendorMetrics'],
  endpoints: (builder) => ({
    // Customer Management Endpoints
    getUserBookings: builder.query<
      PaginationResponse<Booking>,
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 10, status = 'all' }) => ({
        url: '/bookings',
        params: { page, limit, status: status === 'all' ? undefined : status },
      }),
      providesTags: ['Bookings'],
    }),

    getBookingByReference: builder.query<{ booking: Booking }, string>({
      query: (reference) => `/bookings/${reference}`,
      providesTags: (result, error, reference) => [
        { type: 'Booking', id: reference },
      ],
    }),

    cancelBooking: builder.mutation<
      { booking: Booking; message: string },
      { bookingId: string; reason: string }
    >({
      query: ({ bookingId, reason }) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Bookings', 'Booking'],
    }),

    completeBookingCustomer: builder.mutation<
      { booking: Booking; message: string },
      string
    >({
      query: (reference) => ({
        url: `/bookings/${reference}/complete/customer`,
        method: 'POST',
      }),
      invalidatesTags: ['Bookings', 'Booking'],
    }),

    // Vendor Management Endpoints
    getVendorBookings: builder.query<
      PaginationResponse<Booking>,
      {
        page?: number;
        limit?: number;
        status?: string;
        sortBy?: 'newest' | 'oldest' | 'customerName';
        serviceType?: string;
        durationRange?: string;
        valueRange?: string;
        search?: string;
      }
    >({
      query: (params) => ({
        url: '/bookings/vendor/all',
        params: {
          ...params,
          status: params.status === 'all' ? undefined : params.status,
        },
      }),
      providesTags: ['VendorBookings'],
    }),

    confirmBooking: builder.mutation<
      { booking: Booking; message: string },
      string
    >({
      query: (reference) => ({
        url: `/bookings/${reference}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: ['VendorBookings', 'Booking', 'VendorMetrics'],
    }),

    updateBookingStage: builder.mutation<
      { booking: Booking },
      { reference: string; stage: string }
    >({
      query: ({ reference, stage }) => ({
        url: `/bookings/${reference}/stage`,
        method: 'PATCH',
        body: { stage },
      }),
      invalidatesTags: ['VendorBookings', 'Booking'],
    }),

    completeBookingVendor: builder.mutation<
      { booking: Booking; message: string },
      string
    >({
      query: (reference) => ({
        url: `/bookings/${reference}/complete/vendor`,
        method: 'POST',
      }),
      invalidatesTags: ['VendorBookings', 'Booking', 'VendorMetrics'],
    }),

    rejectBooking: builder.mutation<
      { booking: Booking; message: string },
      { reference: string; reason: string }
    >({
      query: ({ reference, reason }) => ({
        url: `/bookings/${reference}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['VendorBookings', 'Booking', 'VendorMetrics'],
    }),

    // Shared Endpoints
    getVendorMetrics: builder.query<
      {
        metrics: {
          totalBookings: number;
          pendingBookings: number;
          completedBookings: number;
          totalRevenue: number;
          averageRating: number;
        };
      },
      void
    >({
      query: () => '/bookings/vendor/metrics',
      providesTags: ['VendorMetrics'],
    }),
  }),
});

export const {
  // Customer hooks
  useGetUserBookingsQuery,
  useGetBookingByReferenceQuery,
  useCancelBookingMutation,
  useCompleteBookingCustomerMutation,

  // Vendor hooks
  useGetVendorBookingsQuery,
  useConfirmBookingMutation,
  useUpdateBookingStageMutation,
  useCompleteBookingVendorMutation,
  useRejectBookingMutation,

  // Shared hooks
  useGetVendorMetricsQuery,
} = bookingsApi;
```

---

## Features Implementation

### Feature 1: Dynamic Timeline

**Component**: `BookingTimeline.tsx`

```tsx
function getTimelineStages(serviceType: string, bookingStage: string) {
  const stages = {
    normal: [
      { key: 'pending', label: 'Booking Placed', icon: <CheckCircle /> },
      { key: 'confirmed', label: 'Confirmed', icon: <ThumbUp /> },
      { key: 'readyToServe', label: 'Ready to Serve', icon: <Schedule /> },
      { key: 'inProgress', label: 'In Progress', icon: <Build /> },
      { key: 'completed', label: 'Completed', icon: <Done /> },
    ],
    home: [
      { key: 'pending', label: 'Booking Placed', icon: <CheckCircle /> },
      { key: 'confirmed', label: 'Confirmed', icon: <ThumbUp /> },
      {
        key: 'vendorEnroute',
        label: 'Vendor En route',
        icon: <DirectionsCar />,
      },
      { key: 'vendorArrived', label: 'Vendor Arrived', icon: <LocationOn /> },
      { key: 'inProgress', label: 'In Progress', icon: <Build /> },
      { key: 'completed', label: 'Completed', icon: <Done /> },
    ],
    pickDrop: [
      { key: 'pending', label: 'Booking Placed', icon: <CheckCircle /> },
      { key: 'confirmed', label: 'Confirmed', icon: <ThumbUp /> },
      { key: 'itemReceived', label: 'Item Received', icon: <Inbox /> },
      { key: 'inProgress', label: 'Work in Progress', icon: <Build /> },
      {
        key: 'readyForPickup',
        label: 'Ready for Collection',
        icon: <CheckCircle />,
      },
      { key: 'completed', label: 'Completed', icon: <Done /> },
    ],
  };

  return stages[serviceType] || stages.normal;
}

function BookingTimeline({ booking }: { booking: Booking }) {
  const stages = getTimelineStages(booking.serviceType, booking.bookingStage);
  const currentStageIndex = stages.findIndex(
    (s) => s.key === booking.bookingStage,
  );

  return (
    <Stepper activeStep={currentStageIndex} orientation="vertical">
      {stages.map((stage, index) => (
        <Step key={stage.key} completed={index < currentStageIndex}>
          <StepLabel icon={stage.icon}>
            <Typography variant="body1">{stage.label}</Typography>
            {booking.stageHistory?.find((h) => h.stage === stage.key) && (
              <Typography variant="caption" color="text.secondary">
                {formatDate(
                  booking.stageHistory.find((h) => h.stage === stage.key)
                    ?.timestamp,
                )}
              </Typography>
            )}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
```

### Feature 2: Booking Actions

**Hook**: `useBookingActions.ts`

```tsx
import { useCallback } from 'react';
import {
  useCancelBookingMutation,
  useCompleteBookingCustomerMutation,
} from '../api/bookingsApi';
import { useToast } from '@/hooks/useToast'; // Your toast implementation

export function useBookingActions() {
  const [cancelBooking, { isLoading: isCancelling }] =
    useCancelBookingMutation();
  const [completeBooking, { isLoading: isCompleting }] =
    useCompleteBookingCustomerMutation();
  const toast = useToast();

  const handleCancelBooking = useCallback(
    async (bookingId: string, reason: string) => {
      try {
        const result = await cancelBooking({ bookingId, reason }).unwrap();
        toast.success(result.message || 'Booking cancelled successfully');
        return result.booking;
      } catch (error) {
        toast.error('Failed to cancel booking');
        throw error;
      }
    },
    [cancelBooking, toast],
  );

  const handleCompleteBooking = useCallback(
    async (reference: string) => {
      try {
        const result = await completeBooking(reference).unwrap();
        toast.success(result.message || 'Booking marked as complete');
        return result.booking;
      } catch (error) {
        toast.error('Failed to complete booking');
        throw error;
      }
    },
    [completeBooking, toast],
  );

  return {
    cancelBooking: handleCancelBooking,
    completeBooking: handleCompleteBooking,
    isCancelling,
    isCompleting,
  };
}
```

### Feature 3: Image Gallery

**Component**: `ImageGallery.tsx`

```tsx
import { useState } from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Thumbnail Grid */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
        {images.map((url, index) => (
          <Box
            key={index}
            onClick={() => setSelectedIndex(index)}
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              aspectRatio: '1',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <img
              src={url}
              alt={`Image ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        ))}
      </Box>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        maxWidth="lg"
        fullWidth
      >
        {selectedIndex !== null && (
          <Box position="relative" bgcolor="black" minHeight="400px">
            <IconButton
              onClick={() => setSelectedIndex(null)}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
            >
              <Close />
            </IconButton>

            {/* Navigation */}
            {selectedIndex > 0 && (
              <IconButton
                onClick={() => setSelectedIndex(selectedIndex - 1)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  color: 'white',
                }}
              >
                <ArrowBack />
              </IconButton>
            )}
            {selectedIndex < images.length - 1 && (
              <IconButton
                onClick={() => setSelectedIndex(selectedIndex + 1)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  color: 'white',
                }}
              >
                <ArrowForward />
              </IconButton>
            )}

            {/* Image */}
            <img
              src={images[selectedIndex]}
              alt={`Image ${selectedIndex + 1}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
        )}
      </Dialog>
    </>
  );
}
```

---

## User Flows

### Customer Booking Management Flow

```
1. View My Bookings (/bookings)
   └─> Filter by Status
       ├─> All Bookings
       ├─> Pending (awaiting vendor confirmation)
       ├─> Ongoing (confirmed and in progress)
       ├─> Completed (service finished)
       └─> Rejected (vendor declined)
   └─> Click Booking Card
       └─> View Booking Details (/bookings/:reference)
           ├─> View Timeline (track progress)
           │   └─> Dynamic stages based on service type
           ├─> View Service Items
           │   ├─> Services with quantities
           │   ├─> Add-ons
           │   └─> Pricing breakdown
           ├─> View Address (if home/pick-drop service)
           ├─> View Additional Info
           │   ├─> Customer notes
           │   └─> Image gallery
           ├─> Cancel Booking (if status = pending/confirmed)
           │   └─> Enter cancellation reason
           │       └─> Confirm cancellation
           │           └─> Status: Cancelled
           ├─> Mark as Complete (if vendor marked complete)
           │   └─> Confirm completion
           │       └─> Both parties confirmed → Status: Completed
           │           └─> Redirect to Rate Booking
           └─> Rebook (if status = completed)
               └─> Navigate to booking creation with pre-filled data

2. Rate Completed Booking (/bookings/:reference/rate)
   └─> Select Star Rating (1-5)
   └─> Write Review (optional, max 500 chars)
   └─> Submit Review
       └─> Success → Return to Booking Details
```

### Vendor Booking Management Flow

```
1. View Vendor Bookings Dashboard (/vendor/bookings)
   └─> View Metrics (optional dashboard)
       ├─> Total Bookings
       ├─> Pending Bookings
       ├─> Completed Bookings
       ├─> Total Revenue
       └─> Average Rating

   └─> Filter & Search Bookings
       ├─> Status Tabs
       │   ├─> All
       │   ├─> Pending
       │   ├─> Fulfilled
       │   ├─> Cancelled
       │   └─> Rejected
       ├─> Sort By
       │   ├─> Newest First
       │   ├─> Oldest First
       │   └─> Customer Name (A-Z)
       ├─> Service Type
       │   ├─> Normal Service
       │   ├─> Home Service
       │   └─> Pick-Drop Service
       ├─> Duration Range
       │   ├─> Under 30 min
       │   ├─> 30-60 min
       │   ├─> 1-2 hours
       │   ├─> 3-4 hours
       │   └─> 5+ hours
       ├─> Value Range (currency-aware)
       │   └─> Custom ranges based on currency
       └─> Search (customer name, booking reference)

   └─> Click Booking Card
       └─> View Booking Details (/vendor/bookings/:reference)

           [If Status = Pending]
           ├─> Accept Booking
           │   └─> Confirm acceptance
           │       └─> Status: Confirmed
           │           └─> Enable stage updates
           └─> Reject Booking
               └─> Enter rejection reason
                   └─> Confirm rejection
                       └─> Status: Rejected

           [If Status = Confirmed or Ongoing]
           ├─> Update Booking Stage
           │   └─> Select next stage (service type dependent)
           │       ├─> [Normal] Ready to Serve → In Progress → Completed
           │       ├─> [Home] Vendor En route → Vendor Arrived → In Progress → Completed
           │       └─> [Pick-Drop] Item Received → In Progress → Ready for Pickup → Completed
           │   └─> Confirm stage update
           │       └─> Stage updated + Timeline refreshed
           │
           ├─> Mark as Complete
           │   └─> Confirm vendor completion
           │       └─> vendorMarkedComplete = true
           │           └─> Await customer confirmation
           │               └─> Both confirmed → Status: Completed
           │
           └─> Contact Customer
               └─> Open chat/messaging
                   └─> Create booking chat thread

2. Monitor Booking Progress
   └─> Receive notifications for
       ├─> New bookings
       ├─> Customer cancellations
       └─> Customer completion confirmations
```

---

## Timeline & Milestones

### Week 1: Foundation

- [ ] Redux Toolkit + RTK Query setup
- [ ] API integration complete (management endpoints only)
- [ ] TypeScript types defined
- [ ] Routing configured

### Week 2: Customer Management Features

- [ ] Customer bookings list page
- [ ] Booking details page with timeline
- [ ] Cancel booking functionality
- [ ] Complete booking confirmation
- [ ] Rating/review system

### Week 3: Vendor Management Features

- [ ] Vendor bookings list with filters
- [ ] Vendor booking details
- [ ] Accept/reject functionality
- [ ] Stage update system
- [ ] Advanced filters and search
- [ ] Vendor metrics dashboard (optional)

### Week 4: Shared Components

- [ ] Reusable components library
  - BookingCard (customer/vendor variants)
  - BookingTimeline
  - ServiceItemCard
  - PricingBreakdown
  - StatusBadge
  - ImageGallery
- [ ] Custom hooks
  - useBookingActions
  - useBookingFilters
  - useBookingPagination

### Week 5: Testing & Polish

- [ ] Unit tests for components
- [ ] Integration tests for flows
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states and error handling
- [ ] Toast notifications
- [ ] Performance optimization
- [ ] Accessibility improvements

---

**Total Implementation Time**: 5 weeks
**Team Size**: 2-3 developers recommended

---

## Key Differences: Web vs Mobile

| Feature         | Mobile (React Native)          | Web (React)                      |
| --------------- | ------------------------------ | -------------------------------- |
| Navigation      | React Navigation (Stack, Tabs) | React Router (Routes, Links)     |
| UI Components   | React Native components        | HTML + CSS/Material-UI/Chakra UI |
| Storage         | AsyncStorage + Redux Persist   | localStorage (if needed)         |
| Pull-to-Refresh | RefreshControl                 | Button/manual refresh            |
| Gestures        | react-native-gesture-handler   | Mouse/Touch events               |
| Image Viewing   | react-native-image-viewing     | Lightbox modal                   |
| Modals          | React Native Modal             | Dialog/Modal component           |
| Lists           | FlatList with lazy loading     | Virtual scroll or pagination     |
| Loading States  | ActivityIndicator              | Spinner/Skeleton components      |

---

## Critical Implementation Notes

### 1. Service Type Logic

- **Normal Service**: No address required, only contact info
- **Home Service**: Requires `homeServiceAddress`
- **Pick-Drop Service**: Requires both `pickupInfo` and `dropoffInfo`

### 2. Booking Stages

Each service type has different valid stages:

- **Normal**: pending → confirmed → readyToServe → inProgress → completed
- **Home**: pending → confirmed → vendorEnroute → vendorArrived → inProgress → completed
- **Pick-Drop**: pending → confirmed → itemReceived → inProgress → readyForPickup → completed

### 3. Completion Flow

- Booking is only marked as `completed` when BOTH vendor and customer confirm
- Either party can mark complete first
- Track separately: `vendorMarkedComplete`, `customerMarkedComplete`
- Final `completedAt` timestamp set when both true
- Customer can only mark complete after vendor has marked complete
- After both confirm, customer is prompted to rate the service

### 4. Cancellation Rules

- **Customer can cancel**: Only when status is `pending` or `confirmed`
- **Cannot cancel**: Once service is `ongoing` or `completed`
- Cancellation requires a reason
- Consider implementing cancellation fees based on timing

### 5. Stage Update Authorization

- Only vendors can update booking stages
- Customers can only view stage progression
- Stage updates must follow logical order (no skipping stages)
- Each stage update should validate against service type

### 6. Image Display

- Bookings may have up to 3 images in `additionalInfo.images`
- Display in a gallery with lightbox for full view
- Images were uploaded during booking creation

### 7. Real-time Updates (Optional but Recommended)

- Implement WebSocket/SSE for live booking status updates
- Vendor receives notifications for:
  - New bookings
  - Customer cancellations
  - Customer completion confirmations
- Customer receives notifications for:
  - Booking confirmed by vendor
  - Booking rejected by vendor
  - Stage updates
  - Vendor completion confirmation

### 8. Rebook Functionality

- Only available for completed bookings
- Pre-fills booking creation form with previous booking details
- Customer can modify before submitting
- Links to booking creation flow (out of scope for this plan)

---

## Additional Resources

### API Documentation

- Base URL: `https://api.glitbase.com`
- Authentication: Bearer token in Authorization header
- Content-Type: `application/json`

### Mobile Reference Implementation (React Native)

**Customer Management:**

- `/src/screens/Bookings/index.tsx` - Bookings list
- `/src/screens/Bookings/BookingDetails.tsx` - Booking detail view
- `/src/screens/Bookings/BookingRating.tsx` - Rating screen

**Vendor Management:**

- `/src/screens/VendorManage/Bookings/VendorBookings.tsx` - Vendor bookings list
- `/src/screens/VendorManage/Bookings/VendorBookingDetails.tsx` - Vendor detail view
- `/src/screens/VendorManage/Bookings/VendorBookingsFilters.tsx` - Filters component

**API Service:**

- `/src/services/bookingsApi.ts` - RTK Query endpoints

### Design Considerations

- **Responsive Design**: Mobile-first approach, optimize for tablet and desktop
- **Accessibility**: WCAG 2.1 AA compliance
  - Keyboard navigation
  - Screen reader support
  - Focus management
  - Color contrast
- **Loading States**: Skeleton screens, spinners, progress indicators
- **Empty States**: Clear messaging when no bookings exist
- **Error Handling**: Toast notifications, inline error messages, retry actions
- **Confirmation Dialogs**: Modal confirmations for destructive actions (cancel, reject)
- **Status Indicators**: Color-coded badges, progress bars for ongoing bookings
- **Real-time Updates**: Auto-refresh on focus, manual refresh button

---

## Next Steps

1. **Review this plan** with the development team
2. **Setup development environment**
   - Configure React app with TypeScript
   - Install dependencies (Redux Toolkit, React Router, UI library)
   - Setup API base URL and authentication
3. **Begin Week 1: Foundation**
   - Create project structure
   - Setup Redux store and RTK Query
   - Define TypeScript types
4. **Progress through implementation phases**
   - Week 2: Customer management
   - Week 3: Vendor management
   - Week 4: Shared components
   - Week 5: Testing & polish
5. **Quality assurance**
   - Code reviews at each milestone
   - User acceptance testing
   - Performance testing
6. **Production deployment**

---

**Document Version**: 2.0 - Management Focus
**Last Updated**: 2026-01-27
**Author**: Claude Code
**Scope**: Booking Management (Customer & Vendor POV) - Excludes Booking Creation
**Status**: Ready for Implementation
