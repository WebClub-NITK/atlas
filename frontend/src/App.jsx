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
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminTeamDetail from './pages/admin/TeamDetail';
import AdminTeams from './pages/admin/Teams';
import AdminDashboard from './pages/admin/Dashboard';
import AdminChallenges from './pages/admin/Challenges';
import AdminChallengeDetail from './pages/admin/ChallengeDetail';
import CreateChallenge from './pages/admin/CreateChallenge';

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
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
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
              path="/challenges"
              element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<AdminLayout />}>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </ErrorBoundary>
      <footer className="bg-gray-800 text-white text-center py-4">
        © 2024 Atlas. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
