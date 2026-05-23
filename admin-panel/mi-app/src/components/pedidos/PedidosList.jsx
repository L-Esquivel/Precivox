import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './PedidosList.css';
import { pedidosService } from '../../services/pedidosService';
import { productosService } from '../../services/productosService';
import PedidoForm from './PedidoForm';
import EditarPedidoModal from './EditarPedidoModal';

const PedidosList = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToChange, setOrderToChange] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pedidosData, productosData] = await Promise.all([
        pedidosService.getOrders(),
        productosService.getProducts(),
      ]);
      setOrders(pedidosData);
      setProducts(productosData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(t('ordersList.errors.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (pedidoId) => {
    try {
      setError('');
      const data = await pedidosService.getOrderDetails(pedidoId);
      setOrderDetails(data);
      setSelectedOrderId(pedidoId);
    } catch (error) {
      console.error('Error loading details:', error);
      setError(t('ordersList.errors.load_details'));
    }
  };

  const openStatusChangeModal = (order) => {
    setOrderToChange(order);
    setNewStatus(order.estado);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setOrderToChange(null);
    setNewStatus('');
  };

  const openNewOrderModal = () => setShowNewOrderModal(true);
  const closeNewOrderModal = () => setShowNewOrderModal(false);

  const openEditOrderModal = (order) => {
    setOrderToEdit(order);
    setShowEditOrderModal(true);
  };

  const closeEditOrderModal = () => {
    setShowEditOrderModal(false);
    setOrderToEdit(null);
  };

  const handleUpdateStatus = async () => {
    if (!orderToChange || !newStatus) return;
    try {
      setError('');
      await pedidosService.updateOrderStatus(orderToChange.id_pedido, newStatus);
      setOrders(orders.map(order =>
        order.id_pedido === orderToChange.id_pedido
          ? { ...order, estado: newStatus }
          : order
      ));
      closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
      setError(t('ordersList.errors.update_status'));
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      setError('');
      // The backend expects a simpler payload. We adapt it here.
      const payload = {
        usuario_id: orderData.id_usuario,
        telefono: orderData.customer.telefono,
        direccion: orderData.customer.direccion,
        items: orderData.items,
      };
      await pedidosService.createOrder(payload); // This method should do a POST to /pedidos
      closeNewOrderModal();
      await fetchInitialData();
    } catch (error) {
      console.error('Error creating order:', error);
      setError(t('ordersList.errors.create_order'));
      throw error;
    }
  };

  const handleEditOrder = async (orderId, orderData) => {
    try {
      setError('');
      await pedidosService.updateOrder(orderId, orderData); // This will call the new PUT endpoint
      closeEditOrderModal();
      await fetchInitialData();
      // Also refresh details if they are being shown
      if (selectedOrderId === orderId) {
        await fetchOrderDetails(orderId);
      }
    } catch (error) {
      console.error('Error editing order:', error);
      setError(t('ordersList.errors.edit_order'));
      throw error;
    }
  };

  const closeDetailsPanel = () => {
    setSelectedOrderId(null);
    setOrderDetails([]);
  };

  const formatDate = (dateString) => {
    const lang = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleDateString(lang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === 'es' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: 'COP', // Assuming Colombian Pesos
    }).format(value || 0);
  };

  const generateReceipt = async (order) => {
    try {
      const details = await pedidosService.getOrderDetails(order.id_pedido);
      const receiptWindow = window.open('', '_blank');
      const receiptContent = `
        <!DOCTYPE html>
        <html lang="${i18n.language}">
        <head>
          <title>Receipt - Order #${order.id_pedido}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: white; }
            .recibo { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; background: white; }
            .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 15px; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 24px; color: #333; }
            .header .subtitle { font-size: 14px; color: #666; }
            .info-section { margin-bottom: 15px; }
            .info-section h3 { margin: 0 0 8px 0; font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; }
            .productos-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
            .productos-table th { background: #f8f9fa; border-bottom: 2px solid #333; padding: 6px 4px; text-align: left; }
            .productos-table td { padding: 6px 4px; border-bottom: 1px solid #ddd; }
            .total-row { font-weight: bold; border-top: 2px dashed #333; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="recibo">
            <div class="header">
              <h1>Precivox</h1>
              <div class="subtitle">${t('ordersList.receipt.subtitle')}</div>
              <div class="subtitle">${t('ordersList.table.id')} #${order.id_pedido}</div>
            </div>
            <div class="info-section">
              <h3>📋 ${t('ordersList.receipt.order_info')}</h3>
              <div class="info-row"><span>${t('ordersList.table.date')}:</span><span>${new Date(order.fecha_pedido).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US')}</span></div>
              <div class="info-row"><span>${t('ordersList.table.status')}:</span><span>${t(`ordersList.status.${order.estado}`, order.estado)}</span></div>
            </div>
            <div class="info-section">
              <h3>👤 ${t('ordersList.receipt.customer_info')}</h3>
              <div class="info-row"><span>${t('usersList.table.name')}:</span><span>${order.cliente_nombre}</span></div>
              <div class="info-row"><span>${t('usersList.form.phone')}:</span><span>${order.cliente_telefono}</span></div>
              <div class="info-row"><span>${t('usersList.form.address')}:</span><span>${order.direccion}</span></div>
            </div>
            <div class="info-section">
              <h3>🛒 ${t('ordersList.receipt.order_items')}</h3>
              <table class="productos-table">
                <thead>
                  <tr><th>${t('ordersList.details.table.product')}</th><th>${t('ordersList.details.table.qty')}</th><th>${t('ordersList.details.table.price')}</th><th>${t('ordersList.details.table.subtotal')}</th></tr>
                </thead>
                <tbody>
                  ${details.map(detail => `
                    <tr>
                      <td>${detail.producto_nombre}</td>
                      <td>${detail.cantidad}</td>
                      <td>${formatCurrency(parseFloat(detail.precio_unitario) || 0)}</td>
                      <td>${formatCurrency(parseFloat(detail.subtotal) || 0)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right;"><strong>${t('ordersList.details.total').toUpperCase()}</strong></td>
                    <td><strong>${formatCurrency(details.reduce((sum, d) => sum + (parseFloat(d.subtotal) || 0), 0))}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="footer">
              <div>${t('ordersList.receipt.thank_you')}</div>
              <div>Precivox - ${new Date().getFullYear()}</div>
              <button class="no-print" onclick="window.print()" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🖨️ ${t('ordersList.receipt.print_button')}
              </button>
            </div>
          </div>
        </body>
        </html>
      `;
      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert(t('ordersList.receipt.generate_error'));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pendiente':     return 'bg-warning text-dark';
      case 'confirmado':    return 'bg-info';
      case 'en_preparacion':return 'bg-primary';
      case 'completado':    return 'bg-success';
      case 'cancelado':     return 'bg-danger';
      default:              return 'bg-secondary';
    }
  };

  const statuses = [
    { value: 'pendiente', label: `⏳ ${t('ordersList.status.pending')}` },
    { value: 'confirmado', label: `✅ ${t('ordersList.status.confirmed')}` },
    { value: 'en_preparacion', label: `👨‍🍳 ${t('ordersList.status.in_preparation')}` },
    { value: 'completado', label: `🎉 ${t('ordersList.status.completed')}` },
    { value: 'cancelado', label: `❌ ${t('ordersList.status.canceled')}` }
  ];

  if (loading) return <div className="text-center p-4">{t('ordersList.loading')}</div>;

  return (
    <div className="pedidos-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📦 {t('ordersList.title')}</h2>
        <button className="btn btn-success" onClick={openNewOrderModal}>
          ➕ {t('ordersList.new_order')}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {/* Orders List */}
        <div className={selectedOrderId ? 'col-md-8' : 'col-12'}>
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">{t('ordersList.list_title')}</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>{t('ordersList.table.id')}</th>
                      <th>{t('ordersList.table.customer')}</th>
                      <th>{t('ordersList.table.date')}</th>
                      <th>{t('ordersList.table.status')}</th>
                      <th>{t('ordersList.table.total')}</th>
                      <th className="text-center">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          {t('ordersList.no_orders')}
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr
                          key={order.id_pedido}
                          className={selectedOrderId === order.id_pedido ? 'table-active' : ''}
                        >
                          <td className="fw-bold">#{order.id_pedido}</td>
                          <td>
                            <div className="fw-semibold">{order.cliente_nombre}</div>
                            <small className="text-muted">{order.cliente_telefono}</small>
                          </td>
                          <td><small>{formatDate(order.fecha_pedido)}</small></td>
                          <td>
                            <button
                              className={`btn btn-sm ${getStatusBadgeClass(order.estado)}`}
                              onClick={() => openStatusChangeModal(order)}
                              title={t('ordersList.status_modal.title')}
                            >
                              {statuses.find(e => e.value === order.estado)?.label || order.estado}
                            </button>
                          </td>
                          <td className="fw-bold text-success">{formatCurrency(order.total)}</td>
                          <td className="text-center">
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-info btn-sm me-1"
                                onClick={() => fetchOrderDetails(order.id_pedido)}
                                title={t('ordersList.actions.details')}
                              >
                                👁️ {t('ordersList.actions.details')}
                              </button>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => generateReceipt(order)}
                                title={t('ordersList.actions.receipt')}
                              >
                                🧾 {t('ordersList.actions.receipt')}
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
        </div>

        {/* Details Panel */}
        {selectedOrderId && (
          <div className="col-md-4">
            <div className="card">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('ordersList.details.title', { id: selectedOrderId })}</h5>
                <button className="btn btn-sm btn-light" onClick={closeDetailsPanel}>✕</button>
              </div>
              <div className="card-body">
                {orderDetails.length > 0 ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">{t('ordersList.details.products')}</h6>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => {
                          const order = orders.find(p => p.id_pedido === selectedOrderId);
                          if (order) openEditOrderModal(order);
                        }}
                      >
                        ✏️ {t('ordersList.details.edit_order')}
                      </button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>{t('ordersList.details.table.product')}</th>
                            <th>{t('ordersList.details.table.qty')}</th>
                            <th>{t('ordersList.details.table.price')}</th>
                            <th>{t('ordersList.details.table.subtotal')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.map(detail => (
                            <tr key={detail.id_detalle_pedido}>
                              <td>
                                <div className="fw-semibold">{detail.producto_nombre}</div>
                                <small className="text-muted">{detail.categoria}</small>
                              </td>
                              <td className="fw-bold">{detail.cantidad}</td>
                              <td>{formatCurrency(parseFloat(detail.precio_unitario) || 0)}</td>
                              <td className="fw-bold text-success">{formatCurrency(parseFloat(detail.subtotal) || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="fw-bold">{t('ordersList.details.total')}</td>
                            <td className="fw-bold text-success">
                              {formatCurrency(orderDetails.reduce((sum, d) => sum + (parseFloat(d.subtotal) || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    {t('ordersList.details.no_details')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && orderToChange && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">🔄 {t('ordersList.status_modal.title')}</h5>
                <button type="button" className="btn-close" onClick={closeStatusModal}></button>
              </div>
              <div className="modal-body">
                <p>{t('ordersList.status_modal.order')} <strong>#{orderToChange.id_pedido}</strong> - {orderToChange.cliente_nombre}</p>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('ordersList.status_modal.new_status')}</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeStatusModal}>{t('common.cancel')}</button>
                <button className="btn btn-warning" onClick={handleUpdateStatus}>✅ {t('ordersList.status_modal.update_button')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <PedidoForm
          productos={products}
          onSubmit={handleCreateOrder}
          onClose={closeNewOrderModal}
          titulo={`➕ ${t('ordersList.new_order_modal.title')}`}
        />
      )}

      {/* Edit Order Modal */}
      {showEditOrderModal && orderToEdit && (
        <EditarPedidoModal
          pedido={orderToEdit}
          productos={products}
          onSubmit={handleEditOrder}
          onClose={closeEditOrderModal}
        />
      )}
    </div>
  );
};

export default PedidosList;