import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
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
import TeamProfile from './pages/user/TeamProfile';
import ChallengeDetail from './pages/ChallengeDetail';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} /> {/* Remove ProtectedRoute wrapper */}
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Redirect /user/dashboard to /challenges */}
          <Route
            path="/user/dashboard"
            element={<Navigate to="/challenges" replace />}
          />
          <Route
            path="/team/profile"
            element={<ProtectedRoute requireAdmin={false}><TeamProfile /></ProtectedRoute>}
          />

          {/* Regular user routes */}
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
          <Route
            path="/challenges/:challengeId"
            element={
              <ProtectedRoute requireAdmin={false}>
                <ChallengeDetail />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Route>

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
      </Routes>
    </ErrorBoundary>
  );
}

export default App;