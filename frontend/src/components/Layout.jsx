import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, SidebarBody } from '../ui/sidebar';
import SidebarContent from './SidebarContent';

function Layout() {
  return (
    <div className="flex dark-layout min-h-screen">
      <Sidebar>
        <SidebarBody className="dark-sidebar w-32 flex-shrink-0">
          <SidebarContent/>
        </SidebarBody>
      </Sidebar>
      <main className="flex-grow ml-32 p-8 dark-content h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;