import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './IngredientesList.css';
import { ingredientesService } from '../../services/ingredientesService';
import { formatCurrency } from '../../utils/formatters';

const IngredientesList = () => {
  const [ingredients, setIngredients] = useState([]);
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    unidad_medida: '',
    stock: '',
    costo_por_unidad: ''
  });

  // Available units
  const units = ['kg', 'g', 'lb', 'oz', 'lt', 'ml', 'unit', 'package'];

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ingredientesService.getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setError(t('ingredientsList.error_load'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingIngredient(null);
    setFormData({
      nombre: '',
      unidad_medida: '',
      stock: '',
      costo_por_unidad: ''
    });
    setShowModal(true);
  };

  const openEditModal = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      nombre: ingredient.nombre,
      unidad_medida: ingredient.unidad_medida,
      stock: ingredient.stock || '',
      costo_por_unidad: ingredient.costo_por_unidad || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIngredient(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate that numbers are valid before sending
      // The keys must match the backend API contract
      const payload = {
        nombre: formData.nombre.trim(),
        unidad_medida: formData.unidad_medida,
        // If empty, send 0 to avoid DB errors
        stock: formData.stock === '' ? 0 : parseFloat(formData.stock),
        costo_por_unidad: formData.costo_por_unidad === '' ? 0 : parseFloat(formData.costo_por_unidad)
      };

      if (!payload.nombre || !payload.unidad_medida) {
        setError(t('ingredientsList.error_required'));
        return;
      }

      if (editingIngredient) {
        await ingredientesService.updateIngredient(editingIngredient.id_ingrediente, payload);
      } else {
        await ingredientesService.createIngredient(payload);
      }

      closeModal();
      await fetchIngredients(); // Reload the list
    } catch (error) {
      console.error('Error saving ingredient:', error);
      setError(error.message || t('ingredientsList.error_save'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('ingredientsList.delete_confirm'))) {
      try {
        await ingredientesService.deleteIngredient(id);
        fetchIngredients();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        setError(error.message || t('ingredientsList.error_delete'));
      }
    }
  };

  const getUnitBadgeClass = (unit) => {
    switch (unit) {
      case 'kg':
      case 'lb':
        return 'bg-primary';
      case 'g':
      case 'oz':
        return 'bg-success';
      case 'lt':
      case 'ml':
        return 'bg-info';
      case 'unit':
        return 'bg-warning text-dark';
      case 'package':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  if (loading) {
    return <div className="text-center p-4">{t('ingredientsList.loading')}</div>;
  }

  return (
    <div className="ingredientes-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🧂 {t('ingredientsList.title')}</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          ➕ {t('ingredientsList.add_item')}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th>{t('ingredientsList.table.name')}</th>
                  <th>{t('ingredientsList.table.unit')}</th>
                  <th>{t('ingredientsList.table.stock')}</th>
                  <th>{t('ingredientsList.table.cost')}</th>
                  <th className="text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      {t('ingredientsList.no_items')}
                    </td>
                  </tr>
                ) : (
                  ingredients.map(ingredient => (
                    <tr key={ingredient.id_ingrediente}>
                      <td className="fw-semibold">{ingredient.nombre}</td>
                      <td>
                        <span className={`badge ${getUnitBadgeClass(ingredient.unidad_medida)}`}>
                          {ingredient.unidad_medida}
                        </span>
                      </td>
                      <td>
                        {ingredient.stock !== null ? (
                          <span className="fw-bold">
                            {ingredient.stock} {ingredient.unidad_medida}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="fw-bold text-success">
                        {formatCurrency(ingredient.costo_por_unidad, i18n)}
                      </td>
                      <td className="text-center">
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-warning btn-sm me-1"
                            onClick={() => openEditModal(ingredient)}
                            title={t('common.edit')}
                          >
                            ✏️ {t('common.edit')}
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(ingredient.id_ingrediente)}
                            title={t('common.delete')}
                          >
                            🗑️ {t('common.delete')}
                          </button>
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

      {/* Modal for create/edit */}
      {showModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingIngredient ? `✏️ ${t('ingredientsList.form.edit_title')}` : `➕ ${t('ingredientsList.form.add_title')}`}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={closeModal}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">{t('ingredientsList.form.name_label')}</label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder={t('ingredientsList.form.name_placeholder')}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('ingredientsList.form.unit_label')}</label>
                    <select
                      name="unidad_medida"
                      className="form-select"
                      value={formData.unidad_medida}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">{t('ingredientsList.form.select_unit')}</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">{t('ingredientsList.form.stock_label')}</label>
                        <input
                          type="number"
                          name="stock"
                          className="form-control"
                          value={formData.stock}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">{t('ingredientsList.form.cost_label')}</label>
                        <input
                          type="number"
                          name="costo_por_unidad"
                          className="form-control"
                          value={formData.costo_por_unidad}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingIngredient ? `📝 ${t('ingredientsList.form.update_button')}` : `✅ ${t('ingredientsList.form.create_button')}`}
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

export default IngredientesList;