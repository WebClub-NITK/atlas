import React from 'react';
import { Outlet } from 'react-router-dom';

function AdminLayout() {
  return (
    <div className="min-h-screen py-8 relative">
      <div className="relative z-0"> 
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;