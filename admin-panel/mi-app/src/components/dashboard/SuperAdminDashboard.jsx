import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { platformService } from '../../services/platformService';
import './Dashboard.css';

function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await platformService.getPlatformStats();
        setStats(data);
      } catch (err) {
        setError(t('superAdminDashboard.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
  };

  if (loading) return <div className="loading">{t('superAdminDashboard.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return <div className="error-message">{t('superAdminDashboard.noData')}</div>;

  return (
    <div className="dashboard-container">
      <h1>{t('superAdminDashboard.title')}</h1>
      <p>{t('superAdminDashboard.subtitle')}</p>

      <div className="row mt-4">
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{t('superAdminDashboard.totalRevenue')}</h3>
            <p className="stat-number">{formatCurrency(stats.total_revenue)}</p>
            <small>{t('superAdminDashboard.totalRevenueDesc')}</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{t('superAdminDashboard.totalTenants')}</h3>
            <p className="stat-number">{stats.total_tenants}</p>
            <small>{t('superAdminDashboard.totalTenantsDesc')}</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{t('superAdminDashboard.newTenants')}</h3>
            <p className="stat-number">{stats.new_tenants_30_days}</p>
            <small>{t('superAdminDashboard.newTenantsDesc')}</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <h3>{t('superAdminDashboard.totalUsers')}</h3>
            <p className="stat-number">{stats.total_users}</p>
            <small>{t('superAdminDashboard.totalUsersDesc')}</small>
          </div>
        </div>
      </div>

      {/* More components could be added here, like a list of recent logs or a growth chart */}
    </div>
  );
}

export default SuperAdminDashboard;