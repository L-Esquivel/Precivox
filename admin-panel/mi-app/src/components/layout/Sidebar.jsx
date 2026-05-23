import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const modulePaths = {
    dashboard: '/dashboard',
    users: '/users',
    products: '/products',
    orders: '/orders',
    supplies: '/supplies',
    recipes: '/recipes',
    expenses: '/expenses',
    waste: '/waste',
    storefront: '/storefront-settings',
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px', height: '100vh' }}>
      <Link to="/dashboard" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-4">Precivox Panel</span>
      </Link>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        {user?.module_settings?.map(module => {
          const path = modulePaths[module.module_key];
          if (!path) return null;

          return (
            <li className="nav-item" key={module.module_key}>
              <Link to={path} className={`nav-link text-white ${isActive(path) ? 'active' : ''}`}>
                {module.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <hr />
      <div className="text-center">
        <button className="btn btn-outline-light w-100" onClick={logout}>{t('logout')}</button>
      </div>
    </div>
  );
};

export default Sidebar;