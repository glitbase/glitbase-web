/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** Add-on shape from API (supports both _id and id) */
export interface CartAddOn {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  duration?: { hours: number; minutes: number };
  durationInMinutes?: number;
}

/** Service shape stored in cart – flexible to match vendor/app API */
export interface CartService {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  durationInMinutes: number;
  pricingType: 'fixed' | 'free' | 'from';
  type?: string[];
  isDelivery?: boolean;
  addOns?: CartAddOn[];
}

export interface CartItem {
  service: CartService;
  quantity: number;
  selectedAddOns: CartAddOn[];
}

export interface CartState {
  carts: Record<string, CartItem[]>;
}

const initialState: CartState = {
  carts: {},
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{
        storeId: string;
        service: CartService;
        selectedAddOns: CartAddOn[];
      }>
    ) => {
      const { storeId, service, selectedAddOns } = action.payload;
      if (!state.carts[storeId]) {
        state.carts[storeId] = [];
      }
      const existing = state.carts[storeId].find((i) => i.service.id === service.id);
      if (existing) {
        existing.quantity += 1;
        existing.selectedAddOns = selectedAddOns;
      } else {
        state.carts[storeId].push({
          service,
          quantity: 1,
          selectedAddOns: selectedAddOns || [],
        });
      }
    },
    updateCartAddOns: (
      state,
      action: PayloadAction<{
        storeId: string;
        serviceId: string;
        selectedAddOns: CartAddOn[];
      }>
    ) => {
      const { storeId, serviceId, selectedAddOns } = action.payload;
      const items = state.carts[storeId];
      if (!items) return;
      const item = items.find((i) => i.service.id === serviceId);
      if (item) {
        item.selectedAddOns = selectedAddOns;
      }
    },
    removeFromCart: (
      state,
      action: PayloadAction<{ storeId: string; serviceId: string }>
    ) => {
      const { storeId, serviceId } = action.payload;
      const items = state.carts[storeId];
      if (!items) return;
      state.carts[storeId] = items.filter((i) => i.service.id !== serviceId);
      if (state.carts[storeId].length === 0) {
        delete state.carts[storeId];
      }
    },
    clearCart: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        delete state.carts[action.payload];
      } else {
        state.carts = {};
      }
    },
  },
});

export const { addToCart, updateCartAddOns, removeFromCart, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
