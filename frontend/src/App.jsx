import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Teams from './pages/Teams';
import Scoreboard from './pages/Scoreboard';
import Challenges from './pages/Challenges';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminTeams from './pages/admin/Teams';
import AdminTeamDetail from './pages/admin/TeamDetail';
import AdminChallenges from './pages/admin/Challenges';
import AdminChallengeDetail from './pages/admin/ChallengeDetail';
import CreateChallenge from './pages/admin/CreateChallenge';
import AdminLogin from './pages/admin/AdminLogin';
import UserProfile from './pages/user/UserProfile';
import TeamProfile from './pages/TeamProfile';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ErrorBoundary>
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected routes */}
            <Route
              path="/challenges"
              element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scoreboard"
              element={
                <ProtectedRoute>
                  <Scoreboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team/profile"
              element={
                <ProtectedRoute>
                  <TeamProfile />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/challenges"
              element={
                <AdminRoute>
                  <AdminChallenges />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/challenges/create"
              element={
                <AdminRoute>
                  <CreateChallenge />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/challenges/:id"
              element={
                <AdminRoute>
                  <AdminChallengeDetail />
                </AdminRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </div>
  );
}

export default App;