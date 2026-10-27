import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#FFFDD0] flex items-center justify-center p-6 font-comic">
        <div className="border-4 border-[#DC143C] bg-ink p-8 shadow-[8px_8px_0_#DC143C] text-center">
          <p className="text-2xl font-bold uppercase tracking-wider text-[#DC143C] animate-pulse">
            Loading Boondocks...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role) && user.role !== 'both') {
    // If a seeker tries to access host-only page, redirect to matches
    if (user.role === 'seeker') {
      return <Navigate to="/matches" replace />;
    }
    // If a host tries to access seeker-only page, redirect to host
    if (user.role === 'host') {
      return <Navigate to="/host" replace />;
    }
  }

  return children;
}

