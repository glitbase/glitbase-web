import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './root-reducer';
import { authApi } from './auth';
import { useDispatch as useReduxDispatch } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { paymentApi } from './payment';
// import { disputeApi } from "./dispute";
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
import { reportsApi } from './reports';

// Determine if the development tools should be enabled
const devtool = (import.meta.env.VITE_ENV === 'DEV') === true;

// Define the middleware array, including the RTK Query middleware
const middleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware().concat(
    appApi.middleware,
    authApi.middleware,
    entityApi.middleware,
    vendorApi.middleware,
    bookingApi.middleware,
    chatApi.middleware,
    notificationsApi.middleware,
    glitfinderApi.middleware,
    glitsApi.middleware,
    glitboardsApi.middleware,
    glitNotesApi.middleware,
    paymentApi.middleware,
    reportsApi.middleware
  );

export const store = configureStore({
  reducer: rootReducer,
  devTools: devtool,
  middleware,
});

// Custom hook to use the Redux dispatch function
export const useDispatch = () => useReduxDispatch();

// Setup listeners for refetching data based on focus/internet reconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
