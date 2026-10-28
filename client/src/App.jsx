import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import SeekerAcceptanceBanner from './components/SeekerAcceptanceBanner';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MatchesPage from './pages/MatchesPage';
import RequestedPage from './pages/RequestedPage';
import HostPage from './pages/HostPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#000000] text-[#FFFDD0] flex flex-col font-comic">
        <Navbar />
        <SeekerAcceptanceBanner />
        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/host-signup" element={<Navigate to="/signup" replace />} />

            {/* Protected routes */}
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <MatchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requested"
              element={
                <ProtectedRoute>
                  <RequestedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host"
              element={
                <ProtectedRoute>
                  <HostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}
