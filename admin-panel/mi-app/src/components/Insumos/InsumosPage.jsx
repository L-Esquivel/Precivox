import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { insumosService } from '../../services/insumosService';
import InsumoForm from './InsumoForm';
import { formatCurrency } from '../../utils/formatters';
import './InsumosPage.css';

const InsumosPage = () => {
  const { t, i18n } = useTranslation();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);

  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    try {
      setLoading(true);
      const data = await insumosService.getInsumos();
      setInsumos(data);
    } catch (err) {
      setError(t('suppliesPage.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { ingredientes, empaques } = useMemo(() => {
    return insumos.reduce((acc, insumo) => {
      if (insumo.categoria === 'ingrediente') {
        acc.ingredientes.push(insumo);
      } else {
        acc.empaques.push(insumo);
      }
      return acc;
    }, { ingredientes: [], empaques: [] });
  }, [insumos]);

  const handleCreate = () => {
    setEditingInsumo(null);
    setShowModal(true);
  };

  const handleEdit = (insumo) => {
    setEditingInsumo(insumo);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('suppliesPage.delete_confirm'))) {
      try {
        await insumosService.deleteInsumo(id);
        await loadInsumos();
      } catch (err) { console.error(err); }
    }
  };

  const handleSubmit = async (insumoData) => {
    try {
      if (editingInsumo) {
        await insumosService.updateInsumo(editingInsumo.id_insumo, insumoData);
      } else {
        await insumosService.createInsumo(insumoData);
      }
      setShowModal(false);
      await loadInsumos();
    } catch (err) { console.error(err); }
  };

  const renderTable = (data, title) => (
    <div className="card mb-4">
      <div className="card-header"><h5>{title}</h5></div>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>{t('suppliesPage.table.name')}</th>
              <th>{t('suppliesPage.table.stock')}</th>
              <th>{t('suppliesPage.table.cost')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="4" className="text-center text-muted">{t('suppliesPage.no_supplies')}</td></tr>
            ) : (
              data.map(item => (
                <tr key={item.id_insumo}>
                  <td className="fw-semibold">{item.nombre}</td>
                  <td>{item.stock} {item.unidad_medida}</td>
                  <td className="text-success">{formatCurrency(item.costo_unitario, i18n)} / {item.unidad_medida}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleEdit(item)}>✏️ {t('common.edit')}</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id_insumo)}>🗑️ {t('common.delete')}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <div className="text-center p-5"><h4>{t('suppliesPage.loading')}</h4></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="insumos-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">🌿 {t('suppliesPage.title')}</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          ➕ {t('suppliesPage.add_supply')}
        </button>
      </div>

      {renderTable(ingredientes, `🍓 ${t('suppliesPage.ingredients_title')}`)}
      {renderTable(empaques, `🥡 ${t('suppliesPage.packaging_title')}`)}

      {showModal && (
        <InsumoForm
          insumo={editingInsumo}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default InsumosPage;