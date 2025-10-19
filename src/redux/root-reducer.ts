import { combineReducers } from '@reduxjs/toolkit';
import { authApi } from './auth/index';
import navigationSlice from './navigationSlice';
import systemSlice from './system/systemSlice';
import authSlice from './auth/authSlice';
import appSlice from './app/appSlice';
import { appApi } from './app';
import { entityApi } from './entity';
import { vendorApi } from './vendor';
import storeSlice from './vendor/storeSlice';

export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [appApi.reducerPath]: appApi.reducer,
  [entityApi.reducerPath]: entityApi.reducer,
  [vendorApi.reducerPath]: vendorApi.reducer,
  auth: authSlice,
  app: appSlice,
  system: systemSlice,
  navigation: navigationSlice,
  vendorStore: storeSlice,
});
