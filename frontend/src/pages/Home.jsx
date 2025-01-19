import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      {!isAuthenticated ? (
        <>
          <h1 className="text-6xl font-mario mb-8">Welcome to <ColourfulText text="Atlas"/></h1>
          <p className="text-4xl mb-12">
            Test your <ColourfulText text="skills" /> and <ColourfulText text="compete" /> with others!
          </p>
          <div className="space-x-4">
            <Modal>
              <ModalTrigger>
                <AnimatedButton
                  icon={IconLogin2}
                  text="Login"
                  className="btn btn-primary"
                />
              </ModalTrigger>
              <ModalBody>
                <ModalContent>
                  <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
                  <p className="mb-4">Ready to continue your journey?</p>
                  <Link to="/login" className="btn btn-primary">
                    Proceed to Login
                  </Link>
                </ModalContent>
              </ModalBody>
            </Modal>

            <Modal>
              <ModalTrigger>
                <AnimatedButton
                  icon={IconUserPlus}
                  text="Register"
                  className="btn btn-secondary"
                />
              </ModalTrigger>
              <ModalBody>
                <ModalContent>
                  <h2 className="text-2xl font-bold mb-4">Join Atlas</h2>
                  <p className="mb-4">Start your hacking journey today!</p>
                  <Link to="/register" className="btn btn-primary">
                    Create Account
                  </Link>
                </ModalContent>
              </ModalBody>
            </Modal>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-6xl font-mario mb-8">Welcome to <ColourfulText text="Atlas"/></h1>
          <p className="text-4xl mb-12">
            Test your <ColourfulText text="skills" /> and <ColourfulText text="compete" /> with others!
          </p>
          {!user?.isAdmin ? (
            <Link to="/challenges">
              <AnimatedButton
                icon={IconSpider}
                text="Start Hacking"
                className="btn btn-primary"
              />
            </Link>
          ) : (
            <Link to="/admin/dashboard">
              <AnimatedButton
                icon={IconSpider}
                text="Admin Dashboard"
                className="btn btn-primary"
              />
            </Link>
          )}
        </>
      )}
    </div>
  );
}

export default Home;

