/**
 * useAuthStore - Replacement for useAuth() from AuthContext
 * 
 * This hook provides access to auth state from Redux store.
 * Use this instead of the old useAuth() from AuthContext.
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './redux-hooks';
import { 
  setTokens as setTokensAction,
  clearTokens,
  logout as logoutAction,
  Tokens,
  selectTokens,
  selectIsAuth,
  selectUser,
  selectHasTokens,
  selectIsInitialized,
  selectIsLoading,
} from '@/redux/auth/authSlice';

interface UseAuthStoreReturn {
  // State
  tokens: Tokens | null;
  isAuth: boolean;
  user: any;
  hasTokens: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  
  // Actions
  setTokens: (tokens: Tokens) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = (): UseAuthStoreReturn => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const tokens = useAppSelector(selectTokens);
  const isAuth = useAppSelector(selectIsAuth);
  const user = useAppSelector(selectUser);
  const hasTokens = useAppSelector(selectHasTokens);
  const isInitialized = useAppSelector(selectIsInitialized);
  const isLoading = useAppSelector(selectIsLoading);
  
  // Actions
  const setTokens = useCallback((newTokens: Tokens) => {
    dispatch(setTokensAction(newTokens));
  }, [dispatch]);
  
  const clearAuth = useCallback(() => {
    dispatch(clearTokens());
  }, [dispatch]);
  
  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);
  
  return {
    tokens,
    isAuth,
    user,
    hasTokens,
    isInitialized,
    isLoading,
    setTokens,
    clearAuth,
    logout,
  };
};

export default useAuthStore;











