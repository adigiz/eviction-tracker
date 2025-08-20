import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContextType } from "../types";

// Pages
import AuthForm from "../components/AuthForm";
import SignUpPage from "../pages/SignUpPage";
import RegistrationSuccessPage from "../pages/RegistrationSuccessPage";
import DashboardPage from "../pages/DashboardPage";
import PropertiesPage from "../pages/PropertiesPage";
import CasesPage from "../pages/CasesPage";
import CartPage from "../pages/CartPage";
import PaymentSuccessPage from "../pages/PaymentSuccessPage";
import PaymentCancelPage from "../pages/PaymentCancelPage";

// Admin Pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminClientListPage from "../pages/admin/AdminClientListPage";
import AdminAllCasesPage from "../pages/admin/AdminAllCasesPage";
import AdminClientCasesPage from "../pages/admin/AdminClientCasesPage";
import LawFirmPage from "../pages/admin/LawFirmPage";
import AdminContractorListPage from "../pages/admin/AdminContractorListPage";

// Contractor Pages
import ContractorDashboardPage from "../pages/contractor/ContractorDashboardPage";

// Layouts
import { AdminLayout } from "../layouts/AdminLayout";
import { ContractorLayout } from "../layouts/ContractorLayout";
import { LandlordLayout } from "../layouts/LandlordLayout";
import { AuthLayout } from "../layouts/AuthLayout";

interface AppRoutesProps {
  currentUser: AuthContextType["currentUser"];
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ currentUser }) => {
  return (
    <Routes>
      {/* Public Routes - Only accessible when NOT authenticated */}
      <Route
        path="/"
        element={
          currentUser ? <Navigate to="/dashboard" replace /> : <AuthLayout />
        }
      >
        <Route index element={<AuthForm />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route
          path="registration-success"
          element={<RegistrationSuccessPage />}
        />
      </Route>

      {/* Protected Routes - Only accessible when authenticated */}

      {/* Landlord Routes */}
      {currentUser && currentUser.role === "landlord" && (
        <>
          <Route
            path="/dashboard"
            element={
              <LandlordLayout>
                <DashboardPage />
              </LandlordLayout>
            }
          />

          <Route
            path="/tenants"
            element={
              <LandlordLayout>
                <PropertiesPage />
              </LandlordLayout>
            }
          />

          <Route
            path="/cases"
            element={
              <LandlordLayout>
                <CasesPage />
              </LandlordLayout>
            }
          />

          <Route
            path="/cart"
            element={
              <LandlordLayout>
                <CartPage />
              </LandlordLayout>
            }
          />

          <Route
            path="/payment-success"
            element={
              <LandlordLayout>
                <PaymentSuccessPage />
              </LandlordLayout>
            }
          />

          <Route
            path="/payment-cancel"
            element={
              <LandlordLayout>
                <PaymentCancelPage />
              </LandlordLayout>
            }
          />
        </>
      )}

      {/* Contractor Routes */}
      {currentUser && currentUser.role === "contractor" && (
        <Route
          path="/contractor/dashboard"
          element={
            <ContractorLayout>
              <ContractorDashboardPage />
            </ContractorLayout>
          }
        />
      )}

      {/* Admin Routes */}
      {currentUser && currentUser.role === "admin" && (
        <>
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/clients"
            element={
              <AdminLayout>
                <AdminClientListPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/contractors"
            element={
              <AdminLayout>
                <AdminContractorListPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/all-cases"
            element={
              <AdminLayout>
                <AdminAllCasesPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/client/:landlordId/cases"
            element={
              <AdminLayout>
                <AdminClientCasesPage />
              </AdminLayout>
            }
          />

          <Route
            path="/admin/law-firms"
            element={
              <AdminLayout>
                <LawFirmPage />
              </AdminLayout>
            }
          />
        </>
      )}

      {/* Catch All - Redirect to appropriate dashboard or login */}
      <Route
        path="*"
        element={
          currentUser ? (
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
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
};
