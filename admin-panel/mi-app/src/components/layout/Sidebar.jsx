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

  // This function now returns the Bootstrap classes that your original design used.
  // NavLink will automatically add the 'active' class, which Bootstrap styles correctly.
  const getNavLinkClass = ({ isActive }) => `nav-link w-100 text-start ${isActive ? 'active' : ''}`;

  return (
    <nav className="sidebar">
      {/* This uses the original Bootstrap list structure */}
      <ul className="nav nav-pills flex-column p-3">
        <li className="nav-item">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            📊 {t('homeDashboard')}
          </NavLink>
        </li>

        {user?.rol === 'superadmin' && (
          <li className="nav-item">
            <NavLink to="/tenants" className={getNavLinkClass}>
              🏢 {t('tenants')}
            </NavLink>
          </li>
        )}

        {user?.rol === 'admin' && (
          <>
            {user.module_settings?.map(module => (
              <li className="nav-item" key={module.module_key}>
                <NavLink to={`/${module.module_key.toLowerCase()}`} className={getNavLinkClass}>
                  {module.icon} {t(labelToTKey[module.label] || module.label)}
                </NavLink>
              </li>
            ))}
            <li className="nav-item">
              <NavLink to="/storefront-settings" className={getNavLinkClass}>
                🛍️ {t('menu.storefront')}
              </NavLink>
            </li>
            <hr className="text-white-50" />
            <li className="nav-item">
              {/* This remains a button as it triggers a modal, not a route change */}
              <button className="nav-link w-100 text-start" onClick={onShowSupport}>
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