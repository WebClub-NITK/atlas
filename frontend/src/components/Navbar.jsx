import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { IconLogin2, IconUserPlus } from '@tabler/icons-react';
import { motion } from "framer-motion";

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors ${
        isActive ? 'text-white' : ''
      }`}
    >
      {children}
      {isActive && (
        <motion.span 
          layoutId="navbar-active"
          className="absolute inset-0 border border-white/50 rounded-full -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
}

function Navbar() {
  const { isAuthenticated, user, logout ,isAdmin} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate(isAdminRoute ? '/admin/login' : '/');
  };


  const navList = (
    <ul className="mb-4 mt-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {isAuthenticated && (
        <>
          {isAdmin ? (
            <li className="p-1 font-normal">
              <NavLink to="/admin/dashboard">Admin</NavLink>
            </li>
          ) : (
            <>
              <li className="p-1 font-normal">
                <NavLink to="/challenges">Challenges</NavLink>
              </li>
              <li className="p-1 font-normal">
                <NavLink to="/scoreboard">Scoreboard</NavLink>
              </li>
              <li className="p-1 font-normal">
                <NavLink to="/team/profile">Team</NavLink>
              </li>
            </>
          )}
        </>
      )}
    </ul>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-neutral-900/80 border-b border-neutral-800 px-4 py-2 lg:px-8">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link 
          to={user?.isAdmin ? "/admin/dashboard" : "/"} 
          className="font-mario text-xl text-white mr-4"
        >
          Atlas
        </Link>
        <div className="mr-4 hidden lg:block">{navList}</div>
        <div className="hidden lg:flex gap-2">
          {!isAuthenticated ? (
            <>
              <Link 
                to={isAdminRoute ? "/admin/login" : "/login"} 
                className="btn btn-orange flex items-center gap-2 rounded-xl"
              >
                <IconLogin2 size={20} />
                Login
              </Link>
              {!isAdminRoute && (
                <Link 
                  to="/register" 
                  className="btn btn-orange flex items-center gap-2 rounded-xl"
                >
                  <IconUserPlus size={20} />
                  Register
                </Link>
              )}
            </>
          ) : (
            <button onClick={handleLogout} className="btn btn-orange rounded-xl">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
