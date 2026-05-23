import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { pedidosService } from '../../services/pedidosService';

const EditarPedidoModal = ({ pedido, productos, onSubmit, onClose }) => {
  const { t, i18n } = useTranslation();
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await pedidosService.getOrderDetails(pedido.id_pedido);
        setOrderDetails(data.map(d => ({ ...d, cantidad: parseInt(d.cantidad) })));
      } catch (err) {
        setError(t('editOrderModal.errors.load_details'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [pedido.id_pedido, t]);

  const handleQuantityChange = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty < 1) return;
    setOrderDetails(orderDetails.map(item =>
      item.id_producto === productId ? { ...item, cantidad: qty } : item
    ));
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    const productToAdd = productos.find(p => p.id_producto === parseInt(selectedProduct));
    if (!productToAdd) return;

    const existingItem = orderDetails.find(item => item.id_producto === productToAdd.id_producto);
    if (existingItem) {
      handleQuantityChange(productToAdd.id_producto, existingItem.cantidad + 1);
    } else {
      setOrderDetails([...orderDetails, {
        id_producto: productToAdd.id_producto,
        producto_nombre: productToAdd.nombre,
        cantidad: 1,
        precio_unitario: productToAdd.precio,
        isNew: true // Flag to identify new items
      }]);
    }
    setSelectedProduct('');
  };

  const handleRemoveProduct = (productId) => {
    setOrderDetails(orderDetails.filter(item => item.id_producto !== productId));
  };

  const total = useMemo(() => {
    return orderDetails.reduce((sum, item) => sum + (parseFloat(item.precio_unitario) * item.cantidad), 0);
  }, [orderDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const updatedOrderData = {
      items: orderDetails.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      })),
      total: total
    };

    try {
      await onSubmit(pedido.id_pedido, updatedOrderData);
    } catch (err) {
      // Error is handled in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === 'es' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(lang, { style: 'currency', currency: 'COP' }).format(value || 0);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">{t('editOrderModal.title', { id: pedido.id_pedido })}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loading ? (
                <div className="text-center p-5">{t('editOrderModal.loading')}</div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <>
                  <div className="row mb-3">
                    <div className="col-md-4"><strong>{t('editOrderModal.customer')}:</strong> {pedido.cliente_nombre}</div>
                    <div className="col-md-4"><strong>{t('editOrderModal.phone')}:</strong> {pedido.cliente_telefono}</div>
                    <div className="col-md-4"><strong>{t('editOrderModal.address')}:</strong> {pedido.direccion}</div>
                  </div>
                  <hr />
                  <h6>{t('editOrderModal.products_title')}</h6>
                  <div className="input-group mb-3">
                    <select className="form-select" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                      <option value="">{t('orderForm.select_product')}</option>
                      {productos.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre} - {formatCurrency(p.precio)}</option>
                      ))}
                    </select>
                    <button className="btn btn-outline-primary" type="button" onClick={handleAddProduct}>{t('orderForm.add_button')}</button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>{t('orderForm.table.product')}</th>
                          <th>{t('orderForm.table.quantity')}</th>
                          <th>{t('orderForm.table.unit_price')}</th>
                          <th>{t('orderForm.table.subtotal')}</th>
                          <th className="text-center">{t('orderForm.table.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.length === 0 ? (
                          <tr><td colSpan="5" className="text-center text-muted">{t('editOrderModal.no_products')}</td></tr>
                        ) : (
                          orderDetails.map(item => (
                            <tr key={item.id_producto}>
                              <td>{item.producto_nombre} {item.isNew && <span className="badge bg-info ms-1">{t('editOrderModal.new_badge')}</span>}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  style={{ width: '70px' }}
                                  value={item.cantidad}
                                  onChange={(e) => handleQuantityChange(item.id_producto, e.target.value)}
                                  min="1"
                                />
                              </td>
                              <td>{formatCurrency(item.precio_unitario)}</td>
                              <td>{formatCurrency(parseFloat(item.precio_unitario) * item.cantidad)}</td>
                              <td className="text-center">
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveProduct(item.id_producto)}>
                                  &times;
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <hr />
                  <div className="text-end">
                    <h4 className="mb-0">{t('orderForm.total')} <span className="text-success">{formatCurrency(total)}</span></h4>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-warning" disabled={isSaving || loading}>
                {isSaving ? t('editOrderModal.saving') : `📝 ${t('editOrderModal.save_button')}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarPedidoModal;