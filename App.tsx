import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContextType } from "./types";
import { APP_NAME } from "./constants";
import { seedInitialData } from "./services/seedDataService";
import { useAuth } from "./hooks/useAuth";
import * as Storage from "./services/localStorageService";

import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import PropertiesPage from "./pages/PropertiesPage";
import CasesPage from "./pages/CasesPage";
import LoadingSpinner from "./components/LoadingSpinner";
import CartPage from "./pages/CartPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminClientListPage from "./pages/admin/AdminClientListPage";
import AdminAllCasesPage from "./pages/admin/AdminAllCasesPage";
import AdminClientCasesPage from "./pages/admin/AdminClientCasesPage";
import LawFirmPage from "./pages/admin/LawFirmPage";
import AdminContractorListPage from "./pages/admin/AdminContractorListPage";

// Contractor Pages
import ContractorDashboardPage from "./pages/contractor/ContractorDashboardPage";

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

// Route Protection Components
const AdminRoutes: React.FC = () => {
  const auth = useContext(AuthContext);
  if (auth?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner text="Verifying admin access..." size="lg" />
      </div>
    );
  }
  return auth?.currentUser?.role === "admin" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

const ContractorRoutes: React.FC = () => {
  const auth = useContext(AuthContext);
  if (auth?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner text="Verifying contractor access..." size="lg" />
      </div>
    );
  }
  return auth?.currentUser?.role === "contractor" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
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

  const commonFooter = (
    <footer
      className={`text-center p-4 text-xs ${
        currentUser?.role === "admin"
          ? "bg-gray-900 text-white"
          : "bg-gray-800 text-white"
      }`}
    >
      &copy; {new Date().getFullYear()} {APP_NAME}. For demonstration purposes
      only. Not legal advice.
    </footer>
  );

  return (
    <ThemeProvider>
      <AuthContext.Provider value={authContextValue}>
        <HashRouter>
          {currentUser ? (
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main
                className={`flex-grow ${
                  currentUser?.role === "admin"
                    ? "bg-gray-900 text-gray-200"
                    : "bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                }`}
              >
                <Routes>
                  {/* Landlord Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      currentUser.role === "landlord" ? (
                        <DashboardPage />
                      ) : (
                        <Navigate to="/admin/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/tenants"
                    element={
                      currentUser.role === "landlord" ? (
                        <PropertiesPage />
                      ) : (
                        <Navigate to="/admin/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/cases"
                    element={
                      currentUser.role === "landlord" ? (
                        <CasesPage />
                      ) : (
                        <Navigate to="/admin/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      currentUser.role === "landlord" ? (
                        <CartPage />
                      ) : (
                        <Navigate to="/admin/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/payment-success"
                    element={
                      currentUser.role === "landlord" ? (
                        <PaymentSuccessPage />
                      ) : (
                        <Navigate to="/admin/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/payment-cancel"
                    element={
                      currentUser.role === "landlord" ? (
                        <PaymentCancelPage />
                      ) : (
                        <Navigate to="/admin/dashboard" replace />
                      )
                    }
                  />

                  {/* Contractor Routes */}
                  <Route path="/contractor" element={<ContractorRoutes />}>
                    <Route
                      path="dashboard"
                      element={<ContractorDashboardPage />}
                    />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminRoutes />}>
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="clients" element={<AdminClientListPage />} />
                    <Route
                      path="contractors"
                      element={<AdminContractorListPage />}
                    />
                    <Route path="all-cases" element={<AdminAllCasesPage />} />
                    <Route
                      path="client/:landlordId/cases"
                      element={<AdminClientCasesPage />}
                    />
                    <Route path="law-firms" element={<LawFirmPage />} />
                  </Route>

                  <Route
                    path="/"
                    element={
                      <Navigate
                        to={
                          currentUser.role === "admin"
                            ? "/admin/dashboard"
                            : currentUser.role === "contractor"
                            ? "/contractor/dashboard"
                            : "/dashboard"
                        }
                        replace
                      />
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <Navigate
                        to={
                          currentUser.role === "admin"
                            ? "/admin/dashboard"
                            : currentUser.role === "contractor"
                            ? "/contractor/dashboard"
                            : "/dashboard"
                        }
                        replace
                      />
                    }
                  />
                </Routes>
              </main>
              {commonFooter}
            </div>
          ) : (
            <main className="bg-gray-50 dark:bg-gray-900">
              <Routes>
                <Route path="/login" element={<AuthForm />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          )}
        </HashRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

export default App;
