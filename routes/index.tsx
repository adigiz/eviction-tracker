import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContextType } from "../types";

// Pages
import AuthForm from "../components/AuthForm";
import SignUpPage from "../pages/SignUpPage";
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
  if (!currentUser) {
    return (
      <AuthLayout>
        <Routes>
          <Route path="/login" element={<AuthForm />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthLayout>
    );
  }

  return (
    <Routes>
      {/* Landlord Routes */}
      <Route
        path="/dashboard"
        element={
          currentUser.role === "landlord" ? (
            <LandlordLayout>
              <DashboardPage />
            </LandlordLayout>
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />
      <Route
        path="/tenants"
        element={
          currentUser.role === "landlord" ? (
            <LandlordLayout>
              <PropertiesPage />
            </LandlordLayout>
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />
      <Route
        path="/cases"
        element={
          currentUser.role === "landlord" ? (
            <LandlordLayout>
              <CasesPage />
            </LandlordLayout>
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />
      <Route
        path="/cart"
        element={
          currentUser.role === "landlord" ? (
            <LandlordLayout>
              <CartPage />
            </LandlordLayout>
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />
      <Route
        path="/payment-success"
        element={
          currentUser.role === "landlord" ? (
            <LandlordLayout>
              <PaymentSuccessPage />
            </LandlordLayout>
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />
      <Route
        path="/payment-cancel"
        element={
          currentUser.role === "landlord" ? (
            <LandlordLayout>
              <PaymentCancelPage />
            </LandlordLayout>
          ) : (
            <Navigate to="/admin/dashboard" replace />
          )
        }
      />

      {/* Contractor Routes */}
      <Route path="/contractor" element={<ContractorLayout />}>
        <Route path="dashboard" element={<ContractorDashboardPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="clients" element={<AdminClientListPage />} />
        <Route path="contractors" element={<AdminContractorListPage />} />
        <Route path="all-cases" element={<AdminAllCasesPage />} />
        <Route
          path="client/:landlordId/cases"
          element={<AdminClientCasesPage />}
        />
        <Route path="law-firms" element={<LawFirmPage />} />
      </Route>

      {/* Default Routes */}
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
  );
};
