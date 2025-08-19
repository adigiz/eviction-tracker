import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { HashRouter } from "react-router-dom";
import { AuthContextType } from "./types";
import { seedInitialData } from "./services/seedDataService";
import { useAuth } from "./hooks/useAuth";
import * as Storage from "./services/localStorageService";
import { Toaster } from "react-hot-toast";
import LoadingSpinner from "./components/LoadingSpinner";

// Routing
import { AppRoutes } from "./routes";

export const AuthContext = createContext<AuthContextType | null>(null);

// Theme Context
type Theme = "light" | "dark";
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType | null>(null);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem("app-theme");
    return (storedTheme as Theme) || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

const App: React.FC = () => {
  // Initialize seed data
  useEffect(() => {
    seedInitialData(Storage);
  }, []);

  // Use custom auth hook
  const {
    currentUser,
    isLoading,
    cartItemCount,
    login,
    register,
    logout,
    updateProfile,
    updateCartCount,
    authContextValue,
  } = useAuth();

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <LoadingSpinner text="Loading Application..." size="lg" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={authContextValue}>
        <HashRouter>
          <AppRoutes currentUser={currentUser} />
        </HashRouter>
      </AuthContext.Provider>
      <Toaster
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
        }}
      />
    </ThemeProvider>
  );
};

export default App;
