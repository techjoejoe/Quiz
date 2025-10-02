import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireHost?: boolean;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireHost = true, 
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { currentUser, loading, isHost, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/host/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/host" replace />;
  }

  if (requireHost && !isHost && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
