import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productosService } from '../../services/productosService';
import ProductoForm from './ProductoForm';
// Use relative path to ensure build system can resolve it.
import { formatCurrency } from '../../utils/formatters';
import './ProductosList.css';

const ProductosList = () => {
  const [products, setProducts] = useState([]);
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await productosService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('productsList.delete_confirm'))) {
      try {
        await productosService.deleteProduct(id);
        await loadProducts();
      } catch (error) { console.error(error); }
    }
  };

  const handleSubmit = async (productoData) => {
    try {
      if (editingProduct) {
        await productosService.updateProduct(editingProduct.id_producto, productoData);
      } else {
        await productosService.createProduct(productoData);
      }
      setShowModal(false);
      await loadProducts();
    } catch (error) { console.error(error); }
  };

  const renderStockBadge = (producto) => {
    if (!producto.controla_stock) {
      return <span className="badge bg-light text-muted border">{t('productsList.stock.not_applicable')}</span>;
    }
    
    let color = "bg-primary";
    if (producto.stock <= 0) color = "bg-danger";
    else if (producto.stock < 5) color = "bg-warning text-dark";

    return (
      <span className={`badge ${color} px-3`}>
        {t('productsList.stock.units', { count: producto.stock })}
      </span>
    );
  };

  if (loading) return <div className="text-center p-5"><h4>{t('productsList.loading')}</h4></div>;

  return (
    <div className="productos-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🎂 {t('productsList.title')}</h2>
        <button className="btn btn-primary shadow-sm" onClick={handleCreate}>
          ➕ {t('productsList.add_product')}
        </button>
      </div>

      <div className="table-responsive shadow-sm rounded">
        <table className="table table-hover table-bordered mb-0 bg-white">
          <thead className="table-dark text-center">
            <tr>
              <th>{t('productsList.table.id')}</th>
              <th>{t('productsList.table.name')}</th>
              <th>{t('productsList.table.category')}</th>
              <th>{t('productsList.table.price')}</th>
              <th>{t('productsList.table.stock')}</th>
              <th>{t('productsList.table.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="align-middle">
            {products.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4">{t('productsList.no_products')}</td></tr>
            ) : (
              products.map(producto => (
                <tr key={producto.id_producto}>
                  <td className="text-center fw-bold text-muted">{producto.id_producto}</td>
                  <td className="fw-semibold">{producto.nombre}</td>
                  <td className="text-center">
                    <span className="badge bg-secondary text-uppercase" style={{fontSize: '0.7rem'}}>
                        {producto.categoria}
                    </span>
                  </td>
                  <td className="fw-bold text-success text-end">{formatCurrency(producto.precio, i18n)}</td>
                  <td className="text-center">
                    {renderStockBadge(producto)}
                  </td>
                  <td className="text-center">
                    {producto.controla_stock ? 
                        <span className="text-primary small">📦 {t('productsList.status.active')}</span> : 
                        <span className="text-muted small">✨ {t('productsList.status.on_demand')}</span>
                    }
                  </td>
                  <td className="text-center">
                    <div className="btn-group">
                      <button className="btn btn-outline-warning btn-sm" onClick={() => handleEdit(producto)}>✏️</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(producto.id_producto)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductoForm
          producto={editingProduct}
          existingCategories={[...new Set(products.map(p => p.categoria).filter(Boolean))]}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ProductosList;