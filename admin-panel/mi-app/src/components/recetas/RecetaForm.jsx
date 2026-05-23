import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RecetaForm = ({ recipeItem, product, ingredients = [], packagingCatalog = [], onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    id_ingrediente: '',
    cantidad_necesaria: '',
    id_empaque: '',
    cantidad_empaque: 1
  });

  const [isPackagingMode, setIsPackagingMode] = useState(false);

  useEffect(() => {
    if (recipeItem) {
      setFormData({
        id_ingrediente: recipeItem.id_ingrediente || '',
        cantidad_necesaria: recipeItem.cantidad_necesaria || '',
      });
    }
  }, [recipeItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, isPackagingMode);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {recipeItem ? t('recipeForm.edit_title', { item: isPackagingMode ? t('recipeForm.packaging') : t('recipeForm.ingredient') }) : t('recipeForm.add_title', { item: isPackagingMode ? t('recipeForm.packaging') : t('recipeForm.ingredient') })}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="btn-group mb-3 w-100">
                <button 
                  type="button"
                  className={`btn ${!isPackagingMode ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setIsPackagingMode(false)}
                >
                  {t('recipeForm.ingredient')}
                </button>
                <button 
                  type="button"
                  className={`btn ${isPackagingMode ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setIsPackagingMode(true)}
                >
                  {t('recipeForm.packaging')}
                </button>
              </div>

              {isPackagingMode ? (
                <>
                  <div className="mb-3">
                    <label className="form-label">{t('recipeForm.packaging')}</label>
                    <select name="id_empaque" className="form-select" value={formData.id_empaque} onChange={handleChange} required>
                      <option value="">{t('recipeForm.select_packaging')}</option>
                      {packagingCatalog && packagingCatalog.length > 0 ? (
                        packagingCatalog.map(e => (
                          <option key={e.id_empaque} value={e.id_empaque}>
                            {e.nombre} - ${e.precio}
                          </option>
                        ))
                      ) : (
                        <option value="">{t('recipeForm.no_packaging')}</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('recipeForm.quantity')}</label>
                    <input type="number" name="cantidad_empaque" className="form-control" value={formData.cantidad_empaque} onChange={handleChange} min="1" required />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label">{t('recipeForm.ingredient')}</label>
                    <select name="id_ingrediente" className="form-select" value={formData.id_ingrediente} onChange={handleChange} required>
                      <option value="">{t('recipeForm.select_ingredient')}</option>
                      {ingredients && ingredients.length > 0 ? (
                        ingredients.map(i => (
                          <option key={i.id_ingrediente} value={i.id_ingrediente}>
                            {/* FIX: El backend envía 'unidad_medida', no 'unidad'. */}
                            {i.nombre} ({i.unidad_medida})
                          </option>
                        ))
                      ) : (
                        <option value="">{t('recipeForm.no_ingredients')}</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('recipeForm.quantity_needed')}</label>
                    <input type="number" name="cantidad_necesaria" className="form-control" value={formData.cantidad_necesaria} onChange={handleChange} step="0.01" required />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('common.save')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecetaForm;