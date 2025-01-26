import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white bg-grid-pattern bg-grid mt-10">
      <Navbar />
      <main className="flex-1 pt-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;