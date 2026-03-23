import { createContext, useContext, useMemo, type ReactNode } from 'react';

type MobileNavContextValue = {
  openMobileNav: () => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({
  children,
  openMobileNav,
}: {
  children: ReactNode;
  openMobileNav: () => void;
}) {
  const value = useMemo(() => ({ openMobileNav }), [openMobileNav]);
  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

/** Returns null when used outside HomeLayout (e.g. tests). */
export function useMobileNav(): MobileNavContextValue | null {
  return useContext(MobileNavContext);
}
