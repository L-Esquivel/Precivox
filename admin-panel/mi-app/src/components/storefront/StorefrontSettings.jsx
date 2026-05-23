import React from 'react';
import { useTranslation } from 'react-i18next';

const StorefrontSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h3 className="mb-0">{t('storefront.settings.title', 'Storefront Settings')}</h3>
        </div>
        <div className="card-body">
          <p className="text-muted">{t('storefront.settings.description', 'Manage your public landing page sections and appearance here.')}</p>
          <div className="alert alert-info mt-3">
            {t('storefront.settings.comingSoon', 'Customization options are coming soon!')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorefrontSettings;