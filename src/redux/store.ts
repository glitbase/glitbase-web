import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./root-reducer";
import { authApi } from "./auth";
import { useDispatch as useReduxDispatch } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
// import { paymentApi } from "./payment";
// import { disputeApi } from "./dispute";
import { appApi } from "./app";
import { entityApi } from "./entity";

// Determine if the development tools should be enabled
const devtool = (import.meta.env.VITE_ENV === "DEV") === true;

// Define the middleware array, including the RTK Query middleware
const middleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware().concat(
    appApi.middleware,
    authApi.middleware,
    entityApi.middleware,
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
