import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;

    // Sem isso, cada elemento com transition-colors anima ao mesmo tempo na
    // troca de tema — 300ms de paint contínuo na página inteira trava o
    // celular. A classe desliga as transições enquanto o tema troca; o
    // double-rAF religa só depois do primeiro frame pintado com o tema novo.
    root.classList.add("theme-switching");
    root.classList.toggle("dark", theme === "dark");
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("theme-switching"));
    });

    if (switchable) {
      localStorage.setItem("theme", theme);
    }

    return () => cancelAnimationFrame(raf);
  }, [theme, switchable]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }, []);

  // Valor estável: sem o memo, cada render do provider recriava o objeto e
  // forçava re-render de cada consumidor do contexto.
  const value = useMemo(
    () => ({
      theme,
      toggleTheme: switchable ? toggleTheme : undefined,
      switchable,
    }),
    [theme, switchable, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
