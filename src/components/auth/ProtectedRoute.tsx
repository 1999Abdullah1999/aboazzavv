import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../app-ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowIncompleteSecurity?: boolean;
}

export default function ProtectedRoute({ children, allowIncompleteSecurity = false }: ProtectedRouteProps) {
  const { isLoading, isLoggedIn, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!allowIncompleteSecurity && !user?.security_setup_done) {
    return <Navigate to="/security-setup" replace />;
  }

  if (allowIncompleteSecurity && user?.security_setup_done) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
