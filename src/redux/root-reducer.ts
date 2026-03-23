import { combineReducers } from '@reduxjs/toolkit';
import { authApi } from './auth/index';
import navigationSlice from './navigationSlice';
import systemSlice from './system/systemSlice';
import authSlice from './auth/authSlice';
import appSlice from './app/appSlice';
import { appApi } from './app';
import { entityApi } from './entity';
import { vendorApi } from './vendor';
import { bookingApi } from './booking';
import { chatApi } from './chat';
import { notificationsApi } from './notifications';
import { glitfinderApi } from './glitfinder';
import { glitsApi } from './glits';
import { glitboardsApi } from './glitboards';
import { glitNotesApi } from './glitNotes';
import { paymentApi } from './payment';
import { reportsApi } from './reports';
import bookingSlice from './booking/bookingSlice';
import cartReducer from './cart/cartSlice';
import storeSlice from './vendor/storeSlice';

export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [appApi.reducerPath]: appApi.reducer,
  [entityApi.reducerPath]: entityApi.reducer,
  [vendorApi.reducerPath]: vendorApi.reducer,
  [bookingApi.reducerPath]: bookingApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [notificationsApi.reducerPath]: notificationsApi.reducer,
  [glitfinderApi.reducerPath]: glitfinderApi.reducer,
  [glitsApi.reducerPath]: glitsApi.reducer,
  [glitboardsApi.reducerPath]: glitboardsApi.reducer,
  [glitNotesApi.reducerPath]: glitNotesApi.reducer,
  [paymentApi.reducerPath]: paymentApi.reducer,
  [reportsApi.reducerPath]: reportsApi.reducer,
  auth: authSlice,
  app: appSlice,
  system: systemSlice,
  navigation: navigationSlice,
  vendorStore: storeSlice,
  booking: bookingSlice,
  cart: cartReducer,
});
