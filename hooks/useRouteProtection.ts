import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';

interface RouteProtectionProps {
  requiredRole: 'admin' | 'contractor' | 'landlord';
  fallbackPath: string;
  loadingText: string;
}

export const useRouteProtection = ({ requiredRole, fallbackPath, loadingText }: RouteProtectionProps) => {
  const auth = useContext(AuthContext);

  if (auth?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner text={loadingText} size="lg" />
      </div>
    );
  }

  return auth?.currentUser?.role === requiredRole ? (
    <Outlet />
  ) : (
    <Navigate to={fallbackPath} replace />
  );
};
