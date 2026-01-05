/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export type ServiceType = 'normal' | 'home' | 'pickDrop' | 'walkIn' | 'virtual';

export interface BookingAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationInMinutes?: number;
}

export interface BookingItem {
  serviceId: string;
  name: string;
  description?: string;
  pricingType: 'fixed' | 'free' | 'from';
  price: number;
  currency: 'NGN' | 'USD' | 'GBP';
  durationInMinutes: number;
  imageUrl?: string;
  addOns: BookingAddOn[];
  quantity: number;
  availableTypes?: ServiceType[];
}

export interface BookingAddress {
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  additionalDirections?: string;
}

export interface StorePaymentPolicy {
  depositType: 'percentage' | 'fixed';
  amount: number;
}

export interface StoreBookingPolicy {
  cancellation?: string;
  rescheduling?: string;
}

export interface BookingState {
  storeBannerImageUrl: string | undefined;
  storeReviewCount: number | undefined;
  storeId: string | null;
  storeName?: string;
  storeLocation?: string;
  storeRating?: string;
  storeOpeningHours?: Array<{
    day: string;
    isOpen: boolean;
    openingTime?: string;
    closingTime?: string;
  }>;
  storePaymentPolicy?: StorePaymentPolicy;
  storeBookingPolicy?: StoreBookingPolicy;
  items: BookingItem[];
  serviceType?: ServiceType;
  serviceDate?: string;
  serviceTime?: string;
  pickupInfo?: {
    address?: BookingAddress;
    date?: string;
    notes?: string;
  };
  dropoffInfo?: {
    address?: BookingAddress;
    date?: string;
    notes?: string;
  };
  contact?: {
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
  notes?: string;
  additionalImages?: string[];
  paymentTerm?: 'deposit' | 'full';
  paymentMethodId?: string;
  useNewCard?: boolean;
  pricing: {
    subTotal: number;
    deliveryFee: number;
    taxes: number;
    discount: number;
    total: number;
    serviceChargeRate?: number;
    serviceChargeAmount?: number;
    amountToPay?: number;
    remainingBalance?: number;
    currency?: string;
  };
}

const initialState: BookingState = {
  storeId: null,
  items: [],
  pricing: {
    subTotal: 0,
    deliveryFee: 0,
    taxes: 0,
    discount: 0,
    total: 0,
  },
  storeBannerImageUrl: undefined,
  storeReviewCount: undefined,
};

const findItemIndex = (items: BookingItem[], serviceId: string) =>
  items.findIndex((i) => i.serviceId === serviceId);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    resetBooking: () => initialState,
    setStoreContext: (
      state,
      action: PayloadAction<{
        storeId: string;
        storeName?: string;
        storeLocation?: string;
        storeRating?: string;
        storeOpeningHours?: BookingState['storeOpeningHours'];
        storeBannerImageUrl?: string;
        storeReviewCount?: number;
        storePaymentPolicy?: StorePaymentPolicy;
        storeBookingPolicy?: StoreBookingPolicy;
      }>
    ) => {
      // If switching to a different store, reset store-specific booking data
      if (state.storeId && state.storeId !== action.payload.storeId) {
        const preservedUser = state.contact;
        Object.assign(state, initialState);
        state.contact = preservedUser;
      }

      state.storeId = action.payload.storeId;
      state.storeName = action.payload.storeName;
      state.storeLocation = action.payload.storeLocation;
      state.storeRating = action.payload.storeRating;
      state.storeOpeningHours = action.payload.storeOpeningHours;
      state.storeBannerImageUrl = action.payload.storeBannerImageUrl;
      state.storeReviewCount = action.payload.storeReviewCount;
      state.storePaymentPolicy = action.payload.storePaymentPolicy;
      state.storeBookingPolicy = action.payload.storeBookingPolicy;
    },
    addOrUpdateItem: (state, action: PayloadAction<BookingItem>) => {
      const idx = findItemIndex(state.items, action.payload.serviceId);
      if (idx >= 0) {
        state.items[idx] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.serviceId !== action.payload
      );
    },
    toggleAddOn: (
      state,
      action: PayloadAction<{
        serviceId: string;
        addOn: BookingAddOn;
        selected: boolean;
      }>
    ) => {
      const idx = findItemIndex(state.items, action.payload.serviceId);
      if (idx < 0) return;
      const addOns = state.items[idx].addOns || [];
      if (action.payload.selected) {
        const exists = addOns.find((a) => a.id === action.payload.addOn.id);
        if (!exists) {
          addOns.push(action.payload.addOn);
        }
      } else {
        state.items[idx].addOns = addOns.filter(
          (a) => a.id !== action.payload.addOn.id
        );
      }
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ serviceId: string; quantity: number }>
    ) => {
      const idx = findItemIndex(state.items, action.payload.serviceId);
      if (idx < 0) return;
      state.items[idx].quantity = Math.max(1, action.payload.quantity);
    },
    setServiceType: (state, action: PayloadAction<ServiceType | undefined>) => {
      state.serviceType = action.payload;
    },
    setServiceDate: (state, action: PayloadAction<string | undefined>) => {
      state.serviceDate = action.payload;
    },
    setServiceTime: (state, action: PayloadAction<string | undefined>) => {
      state.serviceTime = action.payload;
    },
    setPickupInfo: (
      state,
      action: PayloadAction<BookingState['pickupInfo']>
    ) => {
      state.pickupInfo = action.payload;
    },
    setDropoffInfo: (
      state,
      action: PayloadAction<BookingState['dropoffInfo']>
    ) => {
      state.dropoffInfo = action.payload;
    },
    setContact: (
      state,
      action: PayloadAction<BookingState['contact'] | undefined>
    ) => {
      state.contact = action.payload;
    },
    setNotes: (state, action: PayloadAction<string | undefined>) => {
      state.notes = action.payload;
    },
    setAdditionalImages: (state, action: PayloadAction<string[]>) => {
      state.additionalImages = action.payload;
    },
    setPaymentTerm: (
      state,
      action: PayloadAction<'deposit' | 'full' | undefined>
    ) => {
      state.paymentTerm = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<string | undefined>) => {
      state.paymentMethodId = action.payload;
      if (action.payload) {
        state.useNewCard = false;
      }
    },
    setUseNewCard: (state, action: PayloadAction<boolean>) => {
      state.useNewCard = action.payload;
      if (action.payload) {
        state.paymentMethodId = undefined;
      }
    },
    setPricing: (
      state,
      action: PayloadAction<Partial<BookingState['pricing']>>
    ) => {
      state.pricing = {
        ...state.pricing,
        ...action.payload,
        total:
          (action.payload.subTotal ?? state.pricing.subTotal) +
          (action.payload.deliveryFee ?? state.pricing.deliveryFee) +
          (action.payload.taxes ?? state.pricing.taxes) -
          Math.abs(action.payload.discount ?? state.pricing.discount),
      };
    },
  },
});

export const {
  resetBooking,
  setStoreContext,
  addOrUpdateItem,
  removeItem,
  toggleAddOn,
  updateQuantity,
  setServiceType,
  setServiceDate,
  setServiceTime,
  setPickupInfo,
  setDropoffInfo,
  setContact,
  setNotes,
  setAdditionalImages,
  setPaymentTerm,
  setPaymentMethod,
  setUseNewCard,
  setPricing,
} = bookingSlice.actions;

export const selectBookingState = (state: RootState) => state.booking;

export const selectBookingTotals = createSelector(
  [selectBookingState],
  (booking) => {
    const subTotal = booking.items.reduce((acc, item) => {
      const basePrice = item.pricingType === 'free' ? 0 : item.price;
      const addOnTotal = (item.addOns || []).reduce(
        (sum, addOn) => sum + (addOn.price || 0),
        0
      );
      return acc + (basePrice + addOnTotal) * (item.quantity || 1);
    }, 0);

    const totalDuration = booking.items.reduce((acc, item) => {
      const addOnDuration = (item.addOns || []).reduce((sum, addOn) => {
        return sum + (addOn.durationInMinutes || 0);
      }, 0);
      return (
        acc + (item.durationInMinutes + addOnDuration) * (item.quantity || 1)
      );
    }, 0);

    return {
      ...booking.pricing,
      subTotal,
      totalDuration,
      total:
        subTotal +
        booking.pricing.deliveryFee +
        booking.pricing.taxes -
        Math.abs(booking.pricing.discount),
    };
  }
);

export default bookingSlice.reducer;
