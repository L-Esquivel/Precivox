import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flexGrow: 1, overflowY: 'auto', height: '100vh' }}>
        <Outlet /> {/* Child routes will render here */}
      </div>
    </div>
  );
};

export default Layout;