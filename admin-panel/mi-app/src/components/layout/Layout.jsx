import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import SupportModal from '../support/SupportModal';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <Link to="/dashboard">
            <img src="/logo-precivox.png" alt="Precivox Logo" className="header-logo" />
          </Link>
          <div className="header-info">
            {user && (
              <div className="user-info">
                <span>
                  {user.nombre} <small className="d-block text-end">{user.rol?.toUpperCase()}</small>
                </span>
                <LanguageSwitcher />
              </div>
            )}
            <button className="logout-btn" onClick={logout}>🚪 {t('logout')}</button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <Sidebar onShowSupport={() => setShowSupportModal(true)} />
        <main className="main-content">
          <Outlet />
        </main>
        <SupportModal show={showSupportModal} onClose={() => setShowSupportModal(false)} />
      </div>
    </div>
  );
};

export default Layout;