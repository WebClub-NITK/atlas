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

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ErrorBoundary>
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Redirect /user/dashboard to /challenges */}
            <Route
              path="/user/dashboard"
              element={<Navigate to="/challenges" replace />}
            />
            <Route
              path="/user/profile"
              element={<ProtectedRoute requireAdmin={false}><UserProfile /></ProtectedRoute>}
            />

            {/* Regular user routes */}
            <Route
              path="/teams"
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scoreboard"
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Scoreboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenges"
              element={
                <ProtectedRoute requireAdmin={false}>
                  <Challenges />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route path="/admin">
              <Route path="login" element={<AdminLogin />} />
              <Route
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="teams" element={<AdminTeams />} />
                <Route path="teams/:id" element={<AdminTeamDetail />} />
                <Route path="challenges" element={<AdminChallenges />} />
                <Route path="challenges/:id" element={<AdminChallengeDetail />} />
                <Route path="challenges/create" element={<CreateChallenge />} />
              </Route>
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </div>
  );
}

export default App;