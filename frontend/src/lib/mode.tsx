import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "demo" | "sepolia";

const STORAGE_KEY = "app-mode";
const DEFAULT_MODE: AppMode = "demo";

type Ctx = {
  mode: AppMode;
  setMode: (m: AppMode) => void;
};

const AppModeContext = createContext<Ctx | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    if (typeof window === "undefined") return DEFAULT_MODE;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "sepolia" || stored === "demo" ? (stored as AppMode) : DEFAULT_MODE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return <AppModeContext.Provider value={{ mode, setMode: setModeState }}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): AppMode {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx.mode;
}

export function useSetAppMode(): (m: AppMode) => void {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useSetAppMode must be used within AppModeProvider");
  return ctx.setMode;
}
