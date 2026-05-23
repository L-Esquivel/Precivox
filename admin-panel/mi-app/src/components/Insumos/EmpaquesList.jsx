import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { empaquesService } from '../../services/empaquesService';
import { formatCurrency } from '../../utils/formatters';

const EmpaquesList = () => {
  const [packagingItems, setPackagingItems] = useState([]);
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  });

  useEffect(() => {
    fetchPackaging();
  }, []);

  const fetchPackaging = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await empaquesService.getPackagingCatalog();
      setPackagingItems(data);
    } catch (err) {
      console.error('Error:', err);
      setError(t('packagingList.error_load'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ nombre: '', descripcion: '', precio: '' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: item.precio
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion,
        precio: formData.precio === '' ? 0 : parseFloat(formData.precio)
      };

      if (!payload.nombre) {
        setError(t('packagingList.form.name_required'));
        return;
      }

      if (editingItem) {
        await empaquesService.updatePackagingItem(editingItem.id_empaque, payload);
      } else {
        await empaquesService.createPackagingItem(payload);
      }

      closeModal();
      fetchPackaging();
    } catch (err) {
      console.error('Error saving:', err);
      setError(err.message || t('packagingList.error_save'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('packagingList.delete_confirm'))) {
      try {
        await empaquesService.deletePackagingFromCatalog(id);
        fetchPackaging();
      } catch (err) {
        console.error('Error deleting packaging:', err);
        setError(err.message || t('packagingList.error_delete'));
      }
    }
  };

  if (loading) return <div className="text-center p-5"><h5>{t('packagingList.loading')}</h5></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🛍️ {t('packagingList.title')}</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          ➕ {t('packagingList.add_item')}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th>{t('packagingList.table.name')}</th>
                  <th>{t('packagingList.table.description')}</th>
                  <th>{t('packagingList.table.price')}</th>
                  <th className="text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {packagingItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">{t('packagingList.no_items')}</td>
                  </tr>
                ) : (
                  packagingItems.map(e => (
                    <tr key={e.id_empaque}>
                      <td className="fw-semibold">{e.nombre}</td>
                      <td>{e.descripcion || <span className="text-muted">{t('common.no_description')}</span>}</td>
                      <td className="fw-bold text-success">
                        {formatCurrency(e.precio, i18n)}
                      </td>
                      <td className="text-center">
                        <div className="btn-group" role="group">
                          <button className="btn btn-warning btn-sm me-1" onClick={() => openEditModal(e)}>✏️ {t('common.edit')}</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id_empaque)}>🗑️ {t('common.delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {editingItem ? `✏️ ${t('packagingList.form.edit_title')}` : `➕ ${t('packagingList.form.add_title')}`}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">{t('packagingList.form.name_label')}</label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      placeholder={t('packagingList.form.name_placeholder')}
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">{t('packagingList.form.description_label')}</label>
                    <input
                      type="text"
                      name="descripcion"
                      className="form-control"
                      placeholder={t('packagingList.form.description_placeholder')}
                      value={formData.descripcion}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">{t('packagingList.form.price_label')}</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        name="precio"
                        step="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.precio}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? `📝 ${t('packagingList.form.update_button')}` : `✅ ${t('packagingList.form.create_button')}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpaquesList;