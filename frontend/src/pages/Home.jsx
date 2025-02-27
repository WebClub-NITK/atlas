import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ColourfulText } from '../components/ColourfulText';
import { Modal, ModalTrigger, ModalBody, ModalContent } from '../components/Modal';
import { IconSpider, IconLogin2, IconUserPlus } from '@tabler/icons-react';
import { motion } from 'framer-motion';

function AnimatedButton({ icon: Icon, text, className, onClick }) {
  return (
    <motion.button
      className={`flex items-center justify-center ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="mr-2" size={20} />
      {text}
    </motion.button>
  );
}

function Home() {
  const { isAuthenticated, user } = useAuth();
  const { isDarkMode } = useTheme();
  console.log(user);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen text-center p-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      {!isAuthenticated ? (
        <>
          <h1 className={`text-6xl mb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Welcome to <ColourfulText text="Atlas"/></h1>
          <p className={`text-4xl mb-12 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Test your <ColourfulText text="skills" /> and <ColourfulText text="compete" /> with others!
          </p>
        </>
      ) : (
        <>
          {user?.isAdmin ? (
            <>
              <h1 className={`text-6xl mb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Welcome to <ColourfulText text="Atlas Admin"/></h1>
              <p className={`text-4xl mb-12 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Manage and monitor your <ColourfulText text="CTF" /> platform
              </p>
              <Link to="/admin/dashboard">
                <AnimatedButton
                  icon={IconSpider}
                  text="Go to Dashboard"
                  className="btn btn-primary"
                />
              </Link>
            </>
          ) : (
            <>
              <h1 className={`text-6xl mb-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Welcome to <ColourfulText text="Atlas"/></h1>
              <p className={`text-4xl mb-12 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Test your <ColourfulText text="skills" /> and <ColourfulText text="compete" /> with others!
              </p>
              <Link to="/challenges">
                <AnimatedButton
                  icon={IconSpider}
                  text="Start Hacking"
                  className="btn btn-primary"
                />
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
