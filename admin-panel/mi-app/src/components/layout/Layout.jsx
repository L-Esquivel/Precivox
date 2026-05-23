import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import SupportModal from '../support/SupportModal';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import '../../App.css'; // CRITICAL: Import the main CSS file to apply layout styles

const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="app">
      {/* This header structure is restored from your original App.jsx to maintain the design */}
      <header className="app-header navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <Link to="/dashboard" className="navbar-brand d-flex align-items-center">
            <img src="/logo-precivox.png" alt="Precivox Logo" className="header-logo" />
          </Link>
          <div className="navbar-nav ms-auto">
            {user && (
              <div className="d-flex align-items-center gap-3">
                <span className="navbar-text text-white">
                  {user.nombre} <small className="d-block text-warning text-end">{user.rol?.toUpperCase()}</small>
                </span>
                <LanguageSwitcher />
                <button className="btn btn-outline-light btn-sm" onClick={logout}>🚪 {t('logout')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-body">
        <Sidebar onShowSupport={() => setShowSupportModal(true)} />
        <main className="main-content p-4">
          <Outlet />
        </main>
        <SupportModal show={showSupportModal} onClose={() => setShowSupportModal(false)} />
      </div>
    </div>
  );
};

export default Layout;