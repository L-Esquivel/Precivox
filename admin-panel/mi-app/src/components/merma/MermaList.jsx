import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mermaService } from '../../services/mermaService';
import { productosService } from '../../services/productosService';
import { ingredientesService } from '../../services/ingredientesService';
import { formatCurrency } from '../../utils/formatters';

const MermaList = () => {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const { t, i18n } = useTranslation();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  const [wasteType, setWasteType] = useState('producto'); // 'producto' or 'ingrediente'
  const [newRecord, setNewRecord] = useState({
    item_id: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: 'Expiration'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mermaData, productosData, ingredientesData] = await Promise.all([
        mermaService.getWasteRecords(),
        productosService.getProducts(),
        ingredientesService.getIngredients()
      ]);
      setWasteRecords(mermaData);
      setProducts(productosData);
      setIngredients(ingredientesData);
    } catch (err) {
      setError(t('waste.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotification({ message: '', type: '' });

    if (!newRecord.item_id || !newRecord.cantidad || !newRecord.fecha) {
      setError(t('waste.error_fields'));
      return;
    }

    const dataToSend = {
      id_producto: wasteType === 'producto' ? newRecord.item_id : null,
      id_ingrediente: wasteType === 'ingrediente' ? newRecord.item_id : null,
      cantidad: newRecord.cantidad,
      fecha: newRecord.fecha,
      motivo: newRecord.motivo
    };

    try {
      await mermaService.createWasteRecord(dataToSend);
      setNotification({ message: t('waste.success_create'), type: 'success' });
      setNewRecord({ item_id: '', cantidad: '', fecha: new Date().toISOString().split('T')[0], motivo: 'Expiration' });
      fetchData();
    } catch (err) {
      setError(t('waste.error_create', { message: err.message }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('waste.delete_confirm'))) {
      try {
        await mermaService.deleteWasteRecord(id);
        fetchData();
      } catch (err) {
        setError(t('waste.error_delete'));
      }
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">📉 {t('waste.title')}</h2>

      {notification.message && <div className={`alert alert-${notification.type}`}>{notification.message}</div>}

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header"><h5>Register New Loss</h5></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">{t('waste.form.type')}</label>
                  <select className="form-select" value={wasteType} onChange={(e) => { setWasteType(e.target.value); setNewRecord(p => ({...p, item_id: ''}))}}>
                    <option value="producto">{t('waste.form.type.product')}</option>
                    <option value="ingrediente">{t('waste.form.type.ingredient')}</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="item_id" className="form-label">{t('waste.form.item')}</label>
                  <select id="item_id" name="item_id" className="form-select" value={newRecord.item_id} onChange={handleInputChange} required>
                    <option value="">{t('waste.form.select_item')}</option>
                    {wasteType === 'producto' 
                      ? products.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>)
                      : ingredients.map(i => <option key={i.id_ingrediente} value={i.id_ingrediente}>{i.nombre}</option>)
                    }
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="cantidad" className="form-label">{t('waste.form.quantity')}</label>
                  <input type="number" id="cantidad" name="cantidad" className="form-control" value={newRecord.cantidad} onChange={handleInputChange} required step="0.01" />
                </div>

                <div className="mb-3">
                  <label htmlFor="fecha" className="form-label">{t('waste.form.date')}</label>
                  <input type="date" id="fecha" name="fecha" className="form-control" value={newRecord.fecha} onChange={handleInputChange} required />
                </div>

                <div className="mb-3">
                  <label htmlFor="motivo" className="form-label">{t('waste.form.reason')}</label>
                  <select id="motivo" name="motivo" className="form-select" value={newRecord.motivo} onChange={handleInputChange}>
                    <option value="Expiration">{t('waste.form.reason.expiration')}</option>
                    <option value="Production Error">{t('waste.form.reason.production_error')}</option>
                    <option value="Unsold Product">{t('waste.form.reason.unsold')}</option>
                    <option value="Damage">{t('waste.form.reason.damage')}</option>
                    <option value="Other">{t('waste.form.reason.other')}</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-danger w-100">{t('waste.form.register_button')}</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header"><h5>Waste History</h5></div>
            <div className="card-body p-0">
              {loading && <p className="p-3">{t('waste.loading')}</p>}
              {error && <p className="p-3 text-danger">{error}</p>}
              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>{t('waste.table.date')}</th>
                        <th>{t('waste.table.description')}</th>
                        <th>{t('waste.table.reason')}</th>
                        <th className="text-end">{t('waste.table.cost')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wasteRecords.map(r => (
                        <tr key={r.id_merma}>
                          <td>{r.fecha}</td>
                          <td>{r.descripcion} (x{r.cantidad})</td>
                          <td><span className="badge bg-warning text-dark">{r.motivo}</span></td>
                          <td className="text-end fw-bold text-danger">{formatCurrency(r.costo_perdida, i18n)}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id_merma)}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaList;
