import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { tenantsAPI } from '../../services/api';
// 💡 FIX: Use a more explicit import path for SweetAlert2 to prevent build errors in some environments (like Vercel).
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.css';
import './TenantsList.css';

// List of customizable modules. This should match the Sidebar modules.
const AVAILABLE_MODULES = [
  'menu.users',
  'menu.products',
  'menu.orders',
  'menu.supplies',
  'menu.recipes',
  'menu.expenses',
  'menu.waste',
  'menu.storefront'
];

const ModuleCustomizationModal = ({ tenant, onClose, onSaveSuccess }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize settings with tenant's data or empty strings
    const initialSettings = AVAILABLE_MODULES.reduce((acc, key) => {
      acc[key] = tenant.module_settings?.[key] || '';
      return acc;
    }, {});
    setSettings(initialSettings);
  }, [tenant]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await tenantsAPI.update(tenant.id_tenant, { module_settings: settings });
      onSaveSuccess({ ...tenant, module_settings: settings });
      Swal.fire({ icon: 'success', title: t('common.save'), showConfirmButton: false, timer: 1500 });
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: t('tenants.errors.save_settings') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t('tenants.customize_modal_title', { tenantName: tenant.nombre })}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="mb-4">{t('tenants.customize_desc')}</p>
            <div className="row g-3">
              {AVAILABLE_MODULES.map(moduleKey => (
                <div className="col-md-6" key={moduleKey}>
                  <div className="form-group">
                    {/* 💡 FIX: Use the new translation key and provide a fallback to the module key itself. */}
                    {/* This ensures that a descriptive label is always shown, solving the "undefined" issue. */}
                    <label htmlFor={`setting-${moduleKey}`} className="form-label text-muted small">
                      {t('tenants.customize_label', { defaultModuleName: t(moduleKey) || moduleKey })}
                    </label>
                    <input
                      type="text"
                      id={`setting-${moduleKey}`}
                      className="form-control"
                      placeholder={t(moduleKey) || moduleKey} // Fallback to key for placeholder
                      value={settings[moduleKey] || ''}
                      onChange={(e) => handleSettingChange(moduleKey, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TenantsList = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTenant, setEditingTenant] = useState(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantsAPI.getAll();
      setTenants(response.data);
    } catch (err) {
      setError(t('tenants.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSaveSuccess = (updatedTenant) => {
    setTenants(prev => prev.map(t => t.id_tenant === updatedTenant.id_tenant ? updatedTenant : t));
  };

  const handleDelete = (tenant) => {
    Swal.fire({
      title: t('tenants.delete_confirm_title'),
      text: t('tenants.delete_confirm_text', { tenantName: tenant.nombre }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await tenantsAPI.delete(tenant.id_tenant);
          setTenants(prev => prev.filter(t => t.id_tenant !== tenant.id_tenant));
          Swal.fire({ icon: 'success', title: t('common.delete'), showConfirmButton: false, timer: 1500 });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Oops...', text: t('tenants.errors.delete') });
        }
      }
    });
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="tenants-container">
      <div className="tenants-header">
        <h2>{t('tenants.title')}</h2>
        <button className="btn btn-primary" disabled>
          {t('tenants.add_tenant')}
        </button>
      </div>

      <div className="tenants-table">
        <table>
          <thead>
            <tr>
              <th>{t('tenants.table.name')}</th>
              <th>{t('tenants.table.slug')}</th>
              <th>{t('tenants.table.status')}</th>
              <th className="text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant.id_tenant}>
                <td className="name-cell">{tenant.nombre}</td>
                <td>
                  <span className="slug-badge">/{tenant.slug}</span>
                </td>
                <td>
                  <span className={`status-badge ${tenant.activo ? 'status-active' : 'status-inactive'}`}>
                    {tenant.activo ? t('tenants.status.active') : t('tenants.status.inactive')}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingTenant(tenant)} title={t('tenants.customize_modules')}>
                    {t('tenants.actions.customize')}
                  </button>
                  <button className="btn btn-sm btn-outline-primary" disabled title={t('tenants.edit_tenant')}>
                    {t('common.edit')}
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(tenant)} title={t('common.delete')}>
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTenant && (
        <ModuleCustomizationModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default TenantsList;