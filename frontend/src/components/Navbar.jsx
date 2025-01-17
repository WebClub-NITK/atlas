import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-mario text-xl">
            Atlas
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="hover:text-gray-300">
              Home
            </Link>
            {isAuthenticated ? (
              <>
                {!user?.isAdmin && (
                  <>
                    <Link to="/teams" className="hover:text-gray-300">
                      Join Team
                    </Link>
                    <Link to="/challenges" className="hover:text-gray-300">
                      Challenges
                    </Link>
                    <Link to="/scoreboard" className="hover:text-gray-300">
                      Scoreboard
                    </Link>
                    <Link to="/user/profile" className="hover:text-gray-300">
                      User
                    </Link>
                  </>
                )}
                {user?.isAdmin && (
                  <Link to="/admin/dashboard" className="hover:text-gray-300">
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="hover:text-gray-300">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300">
                  Login
                </Link>
                <Link to="/register" className="hover:text-gray-300">
                  Register
                </Link>
                <Link to="/admin/login" className="hover:text-gray-300">
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
