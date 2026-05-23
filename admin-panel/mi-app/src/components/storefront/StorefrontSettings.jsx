import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storefrontAPI } from '../../services/storefrontAPI';
import { Spinner } from 'react-bootstrap'; // Asumiendo que usas react-bootstrap para un spinner

const StorefrontSettings = () => {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const data = await storefrontAPI.getSections();
        setSections(data);
        setError(null);
      } catch (err) {
        setError(t('storefront.errors.load_sections', 'Failed to load storefront sections.'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [t]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }

    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }

    if (sections.length === 0) {
      return (
        <div className="alert alert-info mt-3">
          {t('storefront.settings.noSections', 'You have not configured any sections yet. Start by adding one!')}
        </div>
      );
    }

    return (
      <ul className="list-group mt-3">
        {sections.map(section => (
          <li key={section.id} className="list-group-item d-flex justify-content-between align-items-center">
            <h5 className="mb-1 text-capitalize">{section.section_type.replace('_', ' ')}</h5>
            <span className={`badge bg-${section.is_visible ? 'success' : 'secondary'}`}>
              {section.is_visible ? t('common.visible', 'Visible') : t('common.hidden', 'Hidden')}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="mb-0">{t('storefront.settings.title', 'Storefront Settings')}</h3>
          <button className="btn btn-primary btn-sm">
            {t('storefront.settings.addSection', 'Add Section')}
          </button>
        </div>
        <div className="card-body">
          <p className="text-muted">{t('storefront.settings.description', 'Manage your public landing page sections and appearance here.')}</p>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StorefrontSettings;