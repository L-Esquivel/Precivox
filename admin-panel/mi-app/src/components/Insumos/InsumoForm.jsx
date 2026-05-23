import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const InsumoForm = ({ insumo, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'ingrediente',
    stock: 0,
    unidad_medida: 'gr',
    costo_unitario: 0
  });

  useEffect(() => {
    if (insumo) {
      setFormData({
        nombre: insumo.nombre || '',
        categoria: insumo.categoria || 'ingrediente',
        stock: insumo.stock || 0,
        unidad_medida: insumo.unidad_medida || 'gr',
        costo_unitario: insumo.costo_unitario || 0
      });
    }
  }, [insumo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      stock: parseFloat(formData.stock) || 0,
      costo_unitario: parseFloat(formData.costo_unitario) || 0,
    };
    onSubmit(dataToSend);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              {insumo ? t('supplyForm.edit_title') : t('supplyForm.add_title')}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">{t('supplyForm.name_label')}</label>
                <input type="text" name="nombre" className="form-control" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('supplyForm.category_label')}</label>
                <select name="categoria" className="form-select" value={formData.categoria} onChange={handleChange}>
                  <option value="ingrediente">{t('supplyForm.category.ingredient')}</option>
                  <option value="empaque">{t('supplyForm.category.packaging')}</option>
                </select>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('supplyForm.stock_label')}</label>
                  <input type="number" name="stock" className="form-control" value={formData.stock} onChange={handleChange} required min="0" step="any" />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('supplyForm.unit_label')}</label>
                  <select name="unidad_medida" className="form-select" value={formData.unidad_medida} onChange={handleChange}>
                    <option value="gr">{t('supplyForm.unit.grams')}</option>
                    <option value="kg">{t('supplyForm.unit.kilograms')}</option>
                    <option value="ml">{t('supplyForm.unit.milliliters')}</option>
                    <option value="l">{t('supplyForm.unit.liters')}</option>
                    <option value="u">{t('supplyForm.unit.units')}</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">{t('supplyForm.cost_label')}</label>
                <input type="number" name="costo_unitario" className="form-control" value={formData.costo_unitario} onChange={handleChange} required min="0" step="any" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {insumo ? t('supplyForm.save_button') : t('supplyForm.create_button')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsumoForm;