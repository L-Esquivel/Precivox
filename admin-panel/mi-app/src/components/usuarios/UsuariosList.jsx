import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usuariosService } from '../../services/usuariosService';
// Assuming you have a CSS file for this component
import './UsuariosList.css'; 

const UsuariosList = () => {
  const { t } = useTranslation();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await usuariosService.getUsers();
        setUsuarios(data);
      } catch (err) {
        setError(t('usersList.errors.load_users'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [t]); // Add t to dependency array as it's used in error message

  const handleOpenModal = (user = null) => {
    setIsEditing(!!user);
    setCurrentUser(user || { nombre: '', email: '', password: '', rol: 'cliente' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUser(null);
    setError('');
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h2>{t('usersList.title')}</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>{t('usersList.add_user')}</button>
      </div>

      <div className="usuarios-table">
        <table>
          <thead>
            <tr>
              <th>{t('usersList.table.name')}</th>
              <th>{t('usersList.table.email')}</th>
              <th>{t('usersList.table.role')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map(user => (
                <tr key={user.id_usuario}>
                  <td>{user.nombre}</td>
                  <td>{user.email}</td>
                  <td><span className={`role-badge role-${user.rol}`}>{user.rol}</span></td>
                  <td className="actions">
                    <button className="btn-edit" onClick={() => handleOpenModal(user)}>{t('common.edit')}</button>
                    <button className="btn-delete">{t('common.delete')}</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">{t('common.no_data')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? t('usersList.edit_user') : t('usersList.add_user')}</h3>
              <button onClick={handleCloseModal} className="close-button">&times;</button>
            </div>
            <form>
              <div className="form-group">
                <label>{t('usersList.form.name')}</label>
                <input type="text" name="nombre" value={currentUser.nombre} />
              </div>
              <div className="form-group">
                <label>{t('usersList.form.email')}</label>
                <input type="email" name="email" value={currentUser.email} />
              </div>
              <div className="form-group">
                <label>{t('usersList.form.password')}</label>
                <input type="password" name="password" />
                <small>{t('usersList.form.password_help')}</small>
              </div>
              <div className="form-group">
                <label>{t('usersList.form.role')}</label>
                <select name="rol" value={currentUser.rol}>
                  <option value="admin">Admin</option>
                  <option value="cliente">Client</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleCloseModal}>{t('common.cancel')}</button>
                <button type="submit">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosList;