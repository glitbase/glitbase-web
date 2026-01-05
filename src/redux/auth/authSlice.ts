import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expirationTime: number;
}

export interface AuthState {
  isAuth: boolean;
  isInitialized: boolean; // NEW: tracks if we've checked for existing tokens
  user: any;
  tokens: Tokens | null;
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

const defaultTokens: Tokens = {
  accessToken: "",
  refreshToken: "",
  expiresIn: 3600,
  expirationTime: 0
};

// Helper to load tokens from localStorage on init
const loadTokensFromStorage = (): Tokens | null => {
  try {
    const storedTokens = localStorage.getItem("tokens");
    if (!storedTokens) return null;
    
    const parsed = JSON.parse(storedTokens);
    if (parsed && 
        typeof parsed === 'object' && 
        typeof parsed.accessToken === 'string' && 
        typeof parsed.refreshToken === 'string' &&
        parsed.accessToken) {
      return parsed;
    }
    
    localStorage.removeItem("tokens");
    return null;
  } catch {
    localStorage.removeItem("tokens");
    return null;
  }
};

// Initialize with tokens from localStorage if available
const initialTokens = loadTokensFromStorage();

const initialState: AuthState = {
  isAuth: !!initialTokens?.accessToken, // Set auth based on existing token
  isInitialized: false,
  user: null,
  tokens: initialTokens,
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
    // NEW: Set tokens and persist to localStorage
    setTokens: (state, action: PayloadAction<Tokens>) => {
      const tokens = action.payload;
      state.tokens = tokens;
      state.isAuth = !!(tokens?.accessToken);
      
      if (tokens && tokens.accessToken) {
        localStorage.setItem("tokens", JSON.stringify(tokens));
      }
    },
    
    // NEW: Clear tokens from state and localStorage
    clearTokens: (state) => {
      state.tokens = null;
      state.isAuth = false;
      state.user = null;
      localStorage.removeItem("tokens");
      localStorage.removeItem("token"); // Legacy cleanup
    },
    
    // NEW: Mark auth as initialized (after initial check)
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setAuthenticated: (state) => {
      state.isAuth = true;
    },
    
    // Only set auth state to false - do NOT clear tokens here
    // Tokens should only be cleared by explicit logout or clearTokens actions
    setUnauthenticated: (state) => {
      state.isAuth = false;
      state.user = null;
    },
    
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      state.isInitialized = true;
    },
    
    setNextpage: (state, action: PayloadAction<AuthNextPageType | null>) => {
      state.nextPage = action.payload;
    },
    
    setReload: (state, action: PayloadAction<boolean>) => {
      state.reload = action.payload;
    },
    
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    
    setArrayUserToken: (state, action: PayloadAction<string>) => {
      state.arrayUserToken = action.payload;
    },
    
    setRole: (state, action: PayloadAction<string>) => {
      state.role = action.payload;
    },
    
    // NEW: Complete logout action - clears everything
    logout: (state) => {
      state.isAuth = false;
      state.user = null;
      state.tokens = null;
      state.email = "";
      state.arrayUserToken = "";
      state.role = "";
      state.nextPage = null;
      state.reload = false;
      localStorage.removeItem("tokens");
      localStorage.removeItem("token");
    },
  },
});

export const {
  setTokens,
  clearTokens,
  setInitialized,
  setAuthenticated,
  setUnauthenticated,
  setUser,
  setNextpage,
  setReload,
  setEmail,
  setArrayUserToken,
  setLoading,
  setRole,
  logout,
} = authSlice.actions;

// Selectors for easy access
export const selectIsAuth = (state: { auth: AuthState }) => state.auth.isAuth;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectTokens = (state: { auth: AuthState }) => state.auth.tokens;
export const selectHasTokens = (state: { auth: AuthState }) => !!(state.auth.tokens?.accessToken);
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.loading;

export default authSlice.reducer;
