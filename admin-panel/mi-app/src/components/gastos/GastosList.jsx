import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gastosService } from '../../services/gastosService';
import { formatCurrency } from '../../utils/formatters';

const GastosList = () => {
  const [expenses, setExpenses] = useState([]);
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExpense, setNewExpense] = useState({
    descripcion: '', // These keys must match the backend API
    monto: '',       //
    fecha: new Date().toISOString().split('T')[0],
    categoria: 'Operational'
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await gastosService.getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(t('expenses.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.descripcion || !newExpense.monto || !newExpense.fecha) {
      alert(t('expenses.error_fields'));
      return;
    }
    try {
      await gastosService.createExpense(newExpense);
      // Clear form
      setNewExpense({
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        categoria: 'Operational'
      });
      // Reload list
      fetchExpenses();
    } catch (err) {
      alert(t('expenses.error_create'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('expenses.delete_confirm'))) {
      try {
        await gastosService.deleteExpense(id);
        fetchExpenses();
      } catch (err) {
        alert(t('expenses.error_delete'));
      }
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">💸 {t('expenses.title')}</h2>

      <div className="row">
        {/* Form Column */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5>{t('expenses.form.title')}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">{t('expenses.form.description')}</label>
                  <input type="text" id="descripcion" name="descripcion" className="form-control" value={newExpense.descripcion} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="monto" className="form-label">{t('expenses.form.amount')}</label>
                  <input type="number" id="monto" name="monto" className="form-control" value={newExpense.monto} onChange={handleInputChange} required placeholder="e.g., 50" />
                </div>
                <div className="mb-3">
                  <label htmlFor="fecha" className="form-label">{t('expenses.form.date')}</label>
                  <input type="date" id="fecha" name="fecha" className="form-control" value={newExpense.fecha} onChange={handleInputChange} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="categoria" className="form-label">{t('expenses.form.category')}</label>
                  <select id="categoria" name="categoria" className="form-select" value={newExpense.categoria} onChange={handleInputChange}>
                    <option value="Operational">{t('expenses.form.category.operational')}</option>
                    <option value="Rent">{t('expenses.form.category.rent')}</option>
                    <option value="Utilities">{t('expenses.form.category.utilities')}</option>
                    <option value="Salaries">{t('expenses.form.category.salaries')}</option>
                    <option value="Marketing">{t('expenses.form.category.marketing')}</option>
                    <option value="Miscellaneous">{t('expenses.form.category.miscellaneous')}</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">{t('expenses.form.add_button')}</button>
              </form>
            </div>
          </div>
        </div>

        {/* Table Column */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5>{t('expenses.history.title')}</h5>
            </div>
            <div className="card-body p-0">
              {loading && <p className="p-3">{t('expenses.loading')}</p>}
              {error && <p className="p-3 text-danger">{error}</p>}
              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>{t('expenses.table.date')}</th>
                        <th>{t('expenses.table.description')}</th>
                        <th>{t('expenses.table.category')}</th>
                        <th className="text-end">{t('expenses.table.amount')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => (
                        <tr key={expense.id_gasto}>
                          <td>{expense.fecha}</td>
                          <td>{expense.descripcion}</td>
                          <td><span className="badge bg-secondary">{expense.categoria}</span></td>
                          <td className="text-end fw-bold">{formatCurrency(expense.monto, i18n)}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(expense.id_gasto)}>🗑️</button>
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

export default GastosList;