import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);
const DISPLAY_COUNTS = [5, 10, 20, 50];

function getStoredCount() {
  const storedCount = Number(localStorage.getItem("maxDisplayCount"));
  return DISPLAY_COUNTS.includes(storedCount) ? storedCount : 10;
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") === "dark" ? "dark" : "light");
  const [maxDisplayCount, setMaxDisplayCount] = useState(getStoredCount);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("maxDisplayCount", String(maxDisplayCount));
  }, [maxDisplayCount]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
    maxDisplayCount,
    setMaxDisplayCount,
    showToast
  }), [theme, maxDisplayCount, showToast]);

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`} role={toast.type === "error" ? "alert" : "status"} key={toast.id}>
          <span>{toast.message}</span>
          <button type="button" className="toast-dismiss" aria-label="Dismiss notification" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
