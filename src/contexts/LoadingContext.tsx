import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextValue {
  /**
   * Set loading state for a specific key
   * @param key - Unique identifier for the loading source
   * @param isLoading - Loading state
   */
  setLoading: (key: string, isLoading: boolean) => void;

  /**
   * Check if a specific key is loading
   * @param key - Unique identifier to check
   */
  isLoading: (key: string) => boolean;

  /**
   * Check if ANY loading is active
   */
  isAnyLoading: () => boolean;

  /**
   * Get all active loading keys
   */
  getActiveLoadingKeys: () => string[];

  /**
   * Clear all loading states
   */
  clearAll: () => void;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * LoadingProvider
 *
 * Global loading state manager to prevent multiple PageLoaders.
 * Components register their loading state with a unique key.
 *
 * Benefits:
 * - Single source of truth for loading states
 * - Prevents multiple loaders showing simultaneously
 * - Easy debugging of what's loading
 * - Clear handoff between components
 *
 * Usage:
 * ```tsx
 * // In a component
 * const { setLoading, isAnyLoading } = useLoading();
 *
 * useEffect(() => {
 *   setLoading('myComponent', true);
 *   fetchData().finally(() => {
 *     setLoading('myComponent', false);
 *   });
 * }, []);
 * ```
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(
    new Map()
  );

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates((prev) => {
      const next = new Map(prev);
      if (isLoading) {
        next.set(key, true);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates.get(key) === true;
    },
    [loadingStates]
  );

  const isAnyLoading = useCallback(() => {
    return loadingStates.size > 0;
  }, [loadingStates]);

  const getActiveLoadingKeys = useCallback(() => {
    return Array.from(loadingStates.keys());
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates(new Map());
  }, []);

  const value: LoadingContextValue = {
    setLoading,
    isLoading,
    isAnyLoading,
    getActiveLoadingKeys,
    clearAll,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

/**
 * useLoading hook
 *
 * Access loading context in any component
 */
export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
