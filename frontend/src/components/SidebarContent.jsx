import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SidebarLink, useSidebar } from '../ui/sidebar';
import { IconHome, IconUsers, IconTrophy, IconPuzzle, IconUser, IconLogout } from '@tabler/icons-react';

function SidebarContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { open } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = [
    { href: '/', label: 'Home', icon: <IconHome size={20} /> },
    ...(isAuthenticated && !user?.isAdmin
      ? [
        //   { href: '/teams', label: 'Join Team', icon: <IconUsers size={20} /> },
          { href: '/challenges', label: 'Challenges', icon: <IconPuzzle size={20} /> },
          { href: '/scoreboard', label: 'Scoreboard', icon: <IconTrophy size={20} /> },
          { href: '/team/profile', label: 'Team', icon: <IconUser size={20} /> },
        ]
      : []),
    ...(user?.isAdmin
      ? [{ href: '/admin/dashboard', label: 'Admin', icon: <IconUser size={20} /> }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <Link to="/" className="font-mario text-sm text-white mr-2">
          Atlas
        </Link>
      </div>
      <nav className="flex-grow">
        {links.map((link) => (
          <SidebarLink key={link.href} link={link} />
        ))}
      </nav>
      <div className="mt-auto">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white hover:text-gray-300"
          >
            <IconLogout size={20} />
            {open && <span>Logout</span>}
          </button>
        ) : (
          <>
            <SidebarLink
              link={{ href: '/login', label: 'Login', icon: <IconUser size={20} /> }}
            />
            <SidebarLink
              link={{ href: '/register', label: 'Register', icon: <IconUser size={20} /> }}
            />
            <SidebarLink
              link={{ href: '/admin/login', label: 'Admin', icon: <IconUser size={20} /> }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default SidebarContent;

