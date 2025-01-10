import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-mario mb-8">Welcome to Atlas</h1>
      <p className="text-xl mb-8">
        Test your hacking skills and compete with others!
      </p>
      {isAuthenticated ? (
        !user?.isAdmin ? (
          <Link to="/challenges" className="btn btn-primary">
            Start Hacking
          </Link>
        ) : (
          <Link to="/admin/dashboard" className="btn btn-primary">
            Admin Dashboard
          </Link>
        )
      ) : (
        <div className="space-x-4">
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Register
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;