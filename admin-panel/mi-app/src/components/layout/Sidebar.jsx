import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ onShowSupport }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // This is the original logic from your App.jsx, which is crucial.
  const labelToTKey = {
    'Usuarios': 'menu.users',
    'Productos': 'menu.products',
    'Pedidos': 'menu.orders',
    'Insumos': 'menu.supplies',
    'Recetas': 'menu.recipes',
    'Gastos': 'menu.expenses',
    'Merma': 'menu.waste',
  };

  // NavLink adds an 'active' class by default, which your App.css uses.
  const getNavLinkClass = ({ isActive }) => `nav-button ${isActive ? 'active' : ''}`;

  return (
    <nav className="sidebar">
      <ul className="nav-menu">
        <li>
          <NavLink to="/dashboard" className={getNavLinkClass}>
            📊 {t('homeDashboard')}
          </NavLink>
        </li>

        {user?.rol === 'superadmin' && (
          <li>
            <NavLink to="/tenants" className={getNavLinkClass}>
              🏢 {t('tenants')}
            </NavLink>
          </li>
        )}
        
        {user?.rol === 'admin' && (
          <>
            {user.module_settings?.map(module => (
              <li key={module.module_key}>
                <NavLink to={`/${module.module_key.toLowerCase()}`} className={getNavLinkClass}>
                  {module.icon} {t(labelToTKey[module.label] || module.label)}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/storefront-settings" className={getNavLinkClass}>
                🛍️ {t('menu.storefront')}
              </NavLink>
            </li>
            <hr />
            <li>
              <button className="nav-button" onClick={onShowSupport}>
                ❓ {t('support')}
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;