import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export interface OpeningHour {
  day: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

export interface GalleryImage {
  id: string;
  imageURL: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface StorePolicies {
  payment?: {
    depositType: 'fixed' | 'percentage';
    amount: number;
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

export interface Store {
  id: string;
  owner: string;
  name: string;
  type: string[];
  description: string;
  bannerImageUrl?: string;
  preferredCategories: string[];
  tags: string[];
  location: StoreLocation;
  openingHours: OpeningHour[];
  gallery: GalleryImage[];
  faqs: FAQ[];
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

export interface StoreState {
  store: Store | null;
}

const initialState: StoreState = {
  store: null,
};

const storeSlice = createSlice({
  name: 'vendorStore',
  initialState,
  reducers: {
    setStore: (state, action: PayloadAction<Store>) => {
      state.store = action.payload;
    },
    clearStore: (state) => {
      state.store = null;
    },
    updateStore: (state, action: PayloadAction<Partial<Store>>) => {
      if (state.store) {
        state.store = { ...state.store, ...action.payload };
      }
    },
  },
});

export const { setStore, clearStore, updateStore } = storeSlice.actions;
export default storeSlice.reducer;
