import React from 'react';
import { NavLink } from 'react-router-dom'; // Using NavLink for automatic active class handling
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

  // This function returns the custom CSS classes from your App.css file.
  // NavLink will automatically add the 'active' class where needed.
  const getNavLinkClass = ({ isActive }) => `nav-button ${isActive ? 'active' : ''}`;

  return (
    <nav className="sidebar">
      {/* This uses the original custom CSS class for the menu */}
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
              {/* This remains a button as it triggers a modal, not a route change */}
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