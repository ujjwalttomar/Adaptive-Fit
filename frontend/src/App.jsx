import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout/Layout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfileSetupPage from './pages/ProfileSetupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MealsPage from './pages/MealsPage.jsx';
import WorkoutsPage from './pages/WorkoutsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        fontFamily: 'Syne', fontSize: 28, fontWeight: 800,
        background: 'linear-gradient(135deg, var(--accent), var(--accent3))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        AdaptiveFit
      </div>
      <div className="spinner" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ProfileGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && !user.profile?.profileComplete) {
    return <Navigate to="/profile/setup" replace />;
  }
  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
      <Route path="/profile/setup" element={<PrivateRoute><ProfileSetupPage /></PrivateRoute>} />

      <Route path="/dashboard" element={
        <PrivateRoute><ProfileGuard><Layout><DashboardPage /></Layout></ProfileGuard></PrivateRoute>
      } />
      <Route path="/meals" element={
        <PrivateRoute><ProfileGuard><Layout><MealsPage /></Layout></ProfileGuard></PrivateRoute>
      } />
      <Route path="/workouts" element={
        <PrivateRoute><ProfileGuard><Layout><WorkoutsPage /></Layout></ProfileGuard></PrivateRoute>
      } />
      <Route path="/chat" element={
        <PrivateRoute><ProfileGuard><Layout><ChatPage /></Layout></ProfileGuard></PrivateRoute>
      } />
      <Route path="/progress" element={
        <PrivateRoute><ProfileGuard><Layout><ProgressPage /></Layout></ProfileGuard></PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute><ProfileGuard><Layout><ProfilePage /></Layout></ProfileGuard></PrivateRoute>
      } />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
