/**
 * Routing Hooks
 * 
 * This file previously contained localStorage-based temporary storage.
 * That functionality has been removed as part of the auth/routing overhaul.
 * 
 * Use React Router's state or Redux for passing data between routes.
 */

export function debounce<T>(
  callback: (...args: T[]) => void,
  delay: number
): (...args: T[]) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: T[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

/**
 * @deprecated Use React Router's state or Redux instead of localStorage
 */
export const useTmpStorage = () => {
  console.warn('useTmpStorage is deprecated. Use React Router state or Redux instead.');
  
  return { 
    getData: () => null, 
    setData: () => {} 
  };
};
