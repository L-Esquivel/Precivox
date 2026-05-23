import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usuariosService } from '../../services/usuariosService';
import { formatCurrency } from '../../utils/formatters';

const PedidoForm = ({ productos, onSubmit, onClose, titulo }) => {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerData, setCustomerData] = useState({ nombre: '', email: '', telefono: '', direccion: '' });
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const data = await usuariosService.getUsers();
        setCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return [];
    return customers.filter(c =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, customers]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerData({
      nombre: customer.nombre,
      email: customer.email,
      telefono: customer.telefono || '',
      direccion: customer.direccion || ''
    });
    setSearchTerm('');
    setIsNewCustomer(false);
  };

  const handleCustomerDataChange = (e) => {
    setCustomerData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (!selectedCustomer) {
      setIsNewCustomer(true);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    const product = productos.find(p => p.id_producto === parseInt(selectedProduct));
    if (!product) return;

    const existingItem = cart.find(item => item.id_producto === product.id_producto);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id_producto === product.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
  };

  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.id_producto !== productId));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }, [cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerData.nombre || !customerData.direccion || cart.length === 0) {
      alert("Please fill in customer name, address, and add at least one product.");
      return;
    }

    setIsSubmitting(true);
    const orderData = {
      customer: customerData,
      isNewCustomer: isNewCustomer,
      id_usuario: selectedCustomer ? selectedCustomer.id_usuario : null,
      items: cart.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      })),
      total: total
    };

    try {
      await onSubmit(orderData);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">{titulo}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                {/* Customer Section */}
                <div className="col-md-5">
                  <h6>{t('orderForm.customer_info')}</h6>
                  <div className="mb-3 position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={loadingCustomers ? t('orderForm.loading_customers') : t('orderForm.db_customers', { count: customers.length })}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {filteredCustomers.length > 0 && (
                      <ul className="list-group position-absolute w-100" style={{ zIndex: 10 }}>
                        {filteredCustomers.map(c => (
                          <li key={c.id_usuario} className="list-group-item list-group-item-action" onClick={() => handleSelectCustomer(c)}>
                            {c.nombre} <small className="text-muted">({c.email})</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedCustomer && <div className="alert alert-info py-1">{t('orderForm.customer_found', { name: selectedCustomer.nombre })}</div>}
                  {isNewCustomer && <div className="alert alert-warning py-1">{t('orderForm.new_customer')}</div>}

                  <div className="mb-2">
                    <label className="form-label">{t('orderForm.full_name')}</label>
                    <input type="text" name="nombre" className="form-control" value={customerData.nombre} onChange={handleCustomerDataChange} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('orderForm.email')}</label>
                    <input type="email" name="email" className="form-control" value={customerData.email} onChange={handleCustomerDataChange} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('orderForm.phone')}</label>
                    <input type="tel" name="telefono" className="form-control" value={customerData.telefono} onChange={handleCustomerDataChange} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">{t('orderForm.address')}</label>
                    <input type="text" name="direccion" className="form-control" value={customerData.direccion} onChange={handleCustomerDataChange} required />
                  </div>
                </div>

                {/* Products Section */}
                <div className="col-md-7">
                  <h6>{t('orderForm.add_products')}</h6>
                  <div className="input-group mb-3">
                    <select className="form-select" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                      <option value="">{t('orderForm.select_product')}</option>
                      {productos.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre} - {formatCurrency(p.precio, i18n)}</option>
                      ))}
                    </select>
                    <button className="btn btn-outline-primary" type="button" onClick={handleAddProduct}>{t('orderForm.add_button')}</button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '300px' }}>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>{t('orderForm.table.product')}</th>
                          <th>{t('orderForm.table.quantity')}</th>
                          <th>{t('orderForm.table.unit_price')}</th>
                          <th>{t('orderForm.table.subtotal')}</th>
                          <th>{t('orderForm.table.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.length === 0 ? (
                          <tr><td colSpan="5" className="text-center text-muted">{t('common.no_data')}</td></tr>
                        ) : (
                          cart.map(item => (
                            <tr key={item.id_producto}>
                              <td>{item.nombre}</td>
                              <td>{item.cantidad}</td>
                              <td>{formatCurrency(item.precio, i18n)}</td>
                              <td>{formatCurrency(item.precio * item.cantidad, i18n)}</td>
                              <td>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(item.id_producto)}>
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
                    <h4 className="mb-0">{t('orderForm.total')} <span className="text-success">{formatCurrency(total, i18n)}</span></h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-success" disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? t('orderForm.creating') : `✅ ${t('orderForm.create_button')}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PedidoForm;