import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// 💡 FIX: Import from the existing, corrected tenants service file.
import { tenantsAPI } from '../../services/tenantsService';
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
  'menu.storefront',
  'ingredientes',
  'empaques'
];

const ModuleCustomizationModal = ({ tenant, onClose, onSaveSuccess }) => {
  const { t } = useTranslation();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const data = await tenantsAPI.getModules(tenant.id_tenant);
        setModules(data);
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Error al cargar los módulos' });
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [tenant.id_tenant]);

  const handleToggle = (moduleKey) => {
    setModules(prev => prev.map(m => m.module_key === moduleKey ? { ...m, is_active: !m.is_active } : m));
  };

  const handleLabelChange = (moduleKey, newLabel) => {
    setModules(prev => prev.map(m => m.module_key === moduleKey ? { ...m, custom_label: newLabel } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantsAPI.updateModules(tenant.id_tenant, { modules });
      Swal.fire({ icon: 'success', title: t('common.save'), showConfirmButton: false, timer: 1500 });
      onSaveSuccess(); // Trigger parent refresh to get updated tenant state if needed
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: t('tenants.errors.save_settings') });
    } finally {
      setSaving(false);
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
            {loading ? (
              <div className="text-center"><div className="spinner-border text-primary" role="status"></div></div>
            ) : (
              <div className="row g-3">
                {modules.map(mod => (
                  <div className="col-md-6" key={mod.module_key}>
                    <div className="card h-100 shadow-sm border-0 bg-light">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-check-label fw-bold" htmlFor={`toggle-${mod.module_key}`}>
                            {mod.default_label}
                          </label>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`toggle-${mod.module_key}`}
                              checked={mod.is_active}
                              onChange={() => handleToggle(mod.module_key)}
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder={`Personalizar (Por defecto: ${mod.default_label})`}
                          value={mod.custom_label || ''}
                          onChange={(e) => handleLabelChange(mod.module_key, e.target.value)}
                          disabled={!mod.is_active}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
              {saving && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateTenantModal = ({ onClose, onSaveSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    tenant_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.tenant_name || !formData.admin_name || !formData.admin_email || !formData.admin_password) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Por favor completa todos los campos' });
      return;
    }
    setSaving(true);
    try {
      await tenantsAPI.create(formData);
      Swal.fire({ icon: 'success', title: 'Inquilino creado', showConfirmButton: false, timer: 1500 });
      onSaveSuccess();
      onClose();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: error.message || 'Error al crear inquilino' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t('tenants.add_tenant')}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Nombre del Inquilino (Negocio)</label>
              <input type="text" className="form-control" name="tenant_name" value={formData.tenant_name} onChange={handleChange} placeholder="Ej. Airbnb" />
            </div>
            <div className="mb-3">
              <label className="form-label">Nombre del Administrador</label>
              <input type="text" className="form-control" name="admin_name" value={formData.admin_name} onChange={handleChange} placeholder="Ej. Juan Pérez" />
            </div>
            <div className="mb-3">
              <label className="form-label">Correo del Administrador</label>
              <input type="email" className="form-control" name="admin_email" value={formData.admin_email} onChange={handleChange} placeholder="Ej. admin@airbnb.com" />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña del Administrador</label>
              <input type="password" className="form-control" name="admin_password" value={formData.admin_password} onChange={handleChange} placeholder="******" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Crear Inquilino
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
  const [isAddingTenant, setIsAddingTenant] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      // 💡 FIX: The fetch-based service returns the data array directly,
      // not wrapped in a .data object like axios does.
      const tenantsData = await tenantsAPI.getAll();
      setTenants(tenantsData);
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
        <button className="btn btn-primary" onClick={() => setIsAddingTenant(true)}>
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
                  <span className="slug-badge">/{tenant.slug || 'N/A'}</span>
                </td>
                <td>
                  <span className={`status-badge ${tenant?.activo ? 'status-active' : 'status-inactive'}`}>
                    {tenant?.activo ? t('tenants.status.active') : t('tenants.status.inactive')}
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

      {isAddingTenant && (
        <CreateTenantModal
          onClose={() => setIsAddingTenant(false)}
          onSaveSuccess={fetchTenants}
        />
      )}
    </div>
  );
};

export default TenantsList;