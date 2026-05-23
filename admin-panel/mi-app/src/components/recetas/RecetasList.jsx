import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { recetasService } from '../../services/recetasService';
import { productosService } from '../../services/productosService';
import { ingredientesService } from '../../services/ingredientesService';
import { empaquesService } from '../../services/empaquesService';
import RecetaForm from './RecetaForm';
import { formatCurrency } from '../../utils/formatters';
import './RecetasList.css';

const RecetasList = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [packagingCatalog, setPackagingCatalog] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productRecipes, setProductRecipes] = useState([]);
  const [productPackaging, setProductPackaging] = useState([]);
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); // For visual loading feedback

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productosData, ingredientesData, empaquesData] = await Promise.all([
        productosService.getProducts(),
        ingredientesService.getIngredients(),
        empaquesService.getPackagingCatalog()
      ]);
      setProducts(productosData);
      setIngredients(ingredientesData);
      setPackagingCatalog(empaquesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductRecipes = async (productId) => {
    try {
      setError(''); // Clear previous errors
      const product = products.find(p => p.id_producto === productId);
      setSelectedProduct(product);

      const data = await recetasService.getProductRecipeDetails(productId);
      setProductRecipes(data.recipes || []);
      setProductPackaging(data.packaging || []);
      setCosts(data.costs || null);
    } catch (error) {
      console.error('Error loading product recipes:', error);
      setError(t('recipes.error_load_details'));
      setCosts(null); // Ensure costs are cleared on error
    }
  };

  // OPTIMIZED: Single backend call to recalculate and save
  const updateProductField = async (field, value) => {
    if (!selectedProduct) return;

    // 1. Instant UI update to avoid lag
    const updatedProduct = { ...selectedProduct, [field]: value };
    setSelectedProduct(updatedProduct);
    setIsUpdating(true);

    try {
      const newPax = field === 'pax' ? value : updatedProduct.pax;
      const newProfit = field === 'utilidad_porcentaje' ? value : updatedProduct.utilidad_porcentaje;

      // 2. We only call recalculate. The backend already handles the UPDATE on the products table.
      const data = await recetasService.recalculateCosts(
        selectedProduct.id_producto,
        parseInt(newPax) || 1,
        parseFloat(newProfit) || 0
      );

      // 3. Sync the costs state with the server's response
      setCosts(data.costs || null);
    } catch (error) {
      console.error('Error recalculating:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm(t('recipes.delete_ingredient_confirm'))) {
      try {
        await recetasService.deleteRecipeIngredient(recipeId);
        fetchProductRecipes(selectedProduct.id_producto);
      } catch (error) { console.error(error); }
    }
  };

  const handleDeletePackaging = async (id) => {
    if (window.confirm(t('recipes.delete_packaging_confirm'))) {
      try {
        await empaquesService.deletePackagingFromProduct(id);
        fetchProductRecipes(selectedProduct.id_producto);
      } catch (error) { console.error(error); }
    }
  };

  const handleCreateRecipeItem = () => {
    if (!selectedProduct) return alert(t('recipes.select_product_first'));
    setShowModal(true);
  };

  const handleRecipeFormSubmit = async (data, isPackaging = false) => {
    try {
      if (isPackaging) {
        await empaquesService.addPackagingToProduct(selectedProduct.id_producto, data);
      } else {
        await recetasService.addRecipeIngredient({ ...data, id_producto: selectedProduct.id_producto });
      }
      setShowModal(false);
      fetchProductRecipes(selectedProduct.id_producto);
    } catch (error) { console.error('Error saving:', error); }
  };

  if (loading) return <div className="text-center p-5"><h3>{t('recipes.loading')}</h3></div>;

  return (
    <div className="recetas-container container-fluid p-4">
      <h2 className="mb-4 text-center">📋 {t('recipes.title')}</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-body bg-light">
          <label className="form-label fw-bold">{t('recipes.select_product')}</label>
          <select 
            className="form-select form-select-lg"
            value={selectedProduct?.id_producto || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId) {
                fetchProductRecipes(parseInt(selectedId));
              } else {
                // If the user deselects, clear the state
                setSelectedProduct(null);
                setCosts(null);
              }
            }}
          >
            <option value="">{t('recipes.select_product_placeholder')}</option>
            {products.map(p => (
              <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {selectedProduct && costs && (
        <div className="row">
          {/* Left Column: Adjustments */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">⚙️ {t('recipes.parameters_title')}</h5>
              </div>
              <div className="card-body">
                <h4 className="text-primary">{selectedProduct.nombre}</h4>
                <hr />
                
                <div className="mb-4">
                  <label className="form-label fw-bold">{t('recipes.pax_label')}</label>
                  <div className="input-group">
                    <span className="input-group-text">📦</span>
                    <input 
                      type="number" 
                      className="form-control form-control-lg" 
                      // 💡 FIX: Changed `|| 1` to `?? ''`.
                      // This allows the text field to be momentarily empty
                      // so the user can clear the value and type a new one,
                      // instead of immediately forcing it to '1'.
                      value={selectedProduct.pax ?? ''}
                      onChange={(e) => updateProductField('pax', e.target.value)}
                    />
                  </div>
                  <small className="text-muted">{t('recipes.pax_help')}</small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">{t('recipes.profit_label')}</label>
                  <div className="input-group">
                    <input 
                      type="number"
                      className="form-control form-control-lg"
                      value={selectedProduct.utilidad_porcentaje ?? ''}
                      onChange={(e) => updateProductField('utilidad_porcentaje', e.target.value)}
                    />
                    <span className="input-group-text">%</span>
                  </div>
                  <small className="text-muted">{t('recipes.profit_help')}</small>
                </div>

                {isUpdating && <div className="text-primary"><span className="spinner-border spinner-border-sm me-2"></span>{t('recipes.recalculating')}</div>}
              </div>
            </div>
          </div>

          {/* Right Column: Breakdown */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">💰 {t('recipes.breakdown_title')}</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <tbody>
                    <tr>
                      <td className="ps-4">{t('recipes.base_cost')}</td>
                      <td className="text-end pe-4 fw-bold">{formatCurrency(costs.base_cost, i18n)}</td>
                    </tr>
                    <tr className="table-light">
                      <td className="ps-4 text-muted small">{t('recipes.op_expenses')}</td>
                      <td className="text-end pe-4">{formatCurrency(costs.operational_expenses, i18n)}</td>
                    </tr>
                    <tr className="table-light">
                      <td className="ps-4 text-muted small">{t('recipes.market_depreciation')}</td>
                      <td className="text-end pe-4">{formatCurrency(costs.market_depreciation, i18n)}</td>
                    </tr>
                    <tr className="table-light border-bottom">
                      <td className="ps-4 text-muted small">{t('recipes.equipment_depreciation')}</td>
                      <td className="text-end pe-4">{formatCurrency(costs.equipment_depreciation, i18n)}</td>
                    </tr>
                    <tr>
                      <td className="ps-4">{t('recipes.packaging_cost')}</td>
                      <td className="text-end pe-4">{formatCurrency(costs.packaging_cost, i18n)}</td>
                    </tr>
                    <tr className="fw-bold bg-light">
                      <td className="ps-4 text-primary">{t('recipes.total_before_profit')}</td>
                      <td className="text-end pe-4 text-primary">{formatCurrency(costs.production_cost, i18n)}</td>
                    </tr>
                    <tr>
                      <td className="ps-4">{t('recipes.selected_profit', { percent: costs.profit_percentage })}</td>
                      <td className="text-end pe-4 text-success">+ {formatCurrency(costs.profit, i18n)}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td className="ps-4">{t('recipes.total_with_profit')}</td>
                      <td className="text-end pe-4">{formatCurrency(costs.pre_tax_total, i18n)}</td>
                    </tr>
                    <tr>
                      <td className="ps-4">{t('recipes.consumption_tax')}</td>
                      <td className="text-end pe-4">{formatCurrency(costs.consumption_tax, i18n)}</td>
                    </tr>
                    <tr className="table-dark">
                      <td className="ps-4 fs-5 py-3 fw-bold">{t('recipes.suggested_price')}</td>
                      <td className="text-end pe-4 fs-5 py-3 fw-bold text-warning">{formatCurrency(costs.suggested_price, i18n)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="card-footer text-center bg-white border-0 py-3">
                <button className="btn btn-outline-primary btn-lg" onClick={handleCreateRecipeItem}>
                  ➕ {t('recipes.add_ingredient_or_packaging')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tables (Ingredients / Packaging) below for order */}
      {selectedProduct && (
        <div className="row mt-4">
            <div className="col-md-6">
                <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white">{t('recipes.ingredients_title')}</div>
                    <div className="table-responsive">
                        <table className="table table-sm mb-0">
                            <thead><tr><th>{t('recipes.table.item')}</th><th>{t('recipes.table.qty')}</th><th>{t('recipes.table.subtotal')}</th><th></th></tr></thead>
                            <tbody>
                                {productRecipes.map((r) => (
                                    // FIX: Use the unique record ID as key and for the delete function.
                                    // The backend sends 'id', not 'id_receta'.
                                    <tr key={r.id}>
                                        <td>{r.ingrediente}</td>
                                        <td>{r.cantidad_necesaria} {r.unidad_medida}</td>
                                        <td className="fw-bold">{formatCurrency(r.costo_ingrediente, i18n)}</td>
                                        <td><button className="btn btn-link btn-sm text-danger" onClick={() => handleDeleteRecipe(r.id)}>🗑️</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="col-md-6">
                <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white">{t('recipes.packaging_title')}</div>
                    <div className="table-responsive">
                        <table className="table table-sm mb-0">
                            <thead><tr><th>{t('recipes.table.item')}</th><th>{t('recipes.table.qty')}</th><th>{t('recipes.table.subtotal')}</th><th></th></tr></thead>
                            <tbody>
                                {productPackaging.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.nombre}</td>
                                        <td>{e.cantidad}</td>
                                        <td className="fw-bold">{formatCurrency(e.subtotal, i18n)}</td>
                                        <td><button className="btn btn-link btn-sm text-danger" onClick={() => handleDeletePackaging(e.id)}>🗑️</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showModal && (
        <RecetaForm
          product={selectedProduct}
          ingredients={ingredients}
          packagingCatalog={packagingCatalog}
          onSubmit={handleRecipeFormSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default RecetasList;