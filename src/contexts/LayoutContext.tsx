import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type LayoutMode = 'sidebar' | 'bottomnav';

interface LayoutContextValue {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}

const LAYOUT_STORAGE_KEY = 'layoutMode';

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

function getInitialLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'sidebar';

  const savedMode = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (savedMode === 'sidebar' || savedMode === 'bottomnav') {
    return savedMode;
  }

  return 'sidebar';
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getInitialLayoutMode);

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layoutMode);
  }, [layoutMode]);

  const value = useMemo(
    () => ({
      layoutMode,
      setLayoutMode,
    }),
    [layoutMode],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
