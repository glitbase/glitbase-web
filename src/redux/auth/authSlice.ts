import { createSlice } from "@reduxjs/toolkit";

export interface AuthState {
  isAuth: boolean;
  user: any;
  nextPage: AuthNextPageType | null;
  reload: boolean;
  email: string;
  arrayUserToken: string;
  loading: boolean;
  role?: string;
}
export type AuthNextPageType =
  | "/auth/sign-in"
  | "/auth/verify/password-reset"
  | "/auth/verify/new-user";

const initialState: AuthState = {
  isAuth: false,
  user: null,
  nextPage: null,
  reload: false,
  email: "",
  arrayUserToken: "",
  loading: false,
  role: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthenticated: (state) => {
      state.isAuth = true;
    },
    setUnauthenticated: (state) => {
      state.isAuth = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setNextpage: (state, action) => {
      state.nextPage = action.payload;
    },
    setReload: (state, action) => {
      state.reload = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setArrayUserToken: (state, action) => {
      //state.user = { ...state.user, arrayUserToken: action.payload };
      state.arrayUserToken = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
  },
});

export const {
  setAuthenticated,
  setUnauthenticated,
  setUser,
  setNextpage,
  setReload,
  setEmail,
  setArrayUserToken,
  setLoading,
  setRole,
} = authSlice.actions;
export default authSlice.reducer;
