import React from 'react';
import { Outlet } from 'react-router-dom';

function AdminLayout() {
  return (
    <div className="min-h-screen py-8">
      <Outlet />
    </div>
  );
}

export default AdminLayout; 