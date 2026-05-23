import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const UserForm = ({ user, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    rol: 'cliente' // Default role
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        password: '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        rol: user.rol || 'cliente'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              {user ? `✏️ ${t('usersList.edit_user')}` : `➕ ${t('usersList.add_user')}`}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">{t('usersList.form.name')} *</label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">{t('usersList.form.email')} *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  {t('usersList.form.password')} {!user && '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required={!user}
                  placeholder={user ? t('usersList.form.password_help') : ""}
                />
                {user && (
                  <div className="form-text">
                    {t('usersList.form.password_help')}
                  </div>
                )}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">{t('usersList.form.phone')}</label>
                    <input
                      type="tel"
                      name="telefono"
                      className="form-control"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">{t('usersList.form.role')}</label>
                    <select
                      name="rol"
                      className="form-select"
                      value={formData.rol}
                      onChange={handleChange}
                    >
                      <option value="cliente">{t('usersList.form.role_customer')}</option>
                      <option value="empleado">{t('usersList.form.role_employee')}</option>
                      <option value="admin">{t('usersList.form.role_admin')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">{t('usersList.form.address')}</label>
                <input
                  type="text"
                  name="direccion"
                  className="form-control"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                {user ? `📝 ${t('usersList.form.update_button')}` : `✅ ${t('usersList.form.create_button')}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;