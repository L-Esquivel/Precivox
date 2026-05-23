import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storefrontAPI } from '../../services/storefrontAPI';
import { Spinner, Button } from 'react-bootstrap'; // Asumiendo que usas react-bootstrap

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

  const handleAddSection = async () => {
    // For now, we'll add a 'hero' section by default.
    // In the future, this could open a modal to let the user choose the section type.
    try {
      // We can add a loading state for the button here in the future
      const newSection = await storefrontAPI.createSection({ section_type: 'hero' });
      // Add the new section to the local state to update the UI instantly
      setSections(prevSections => [...prevSections, newSection]);
    } catch (err) {
      // Display the specific error from the API, or a generic one as a fallback.
      const apiError = err.response?.data?.error || t('storefront.errors.add_section', 'Failed to add the new section.');
      setError(apiError);
      console.error("Failed to add section", err);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm(t('storefront.settings.delete_confirm', 'Are you sure you want to delete this section? This cannot be undone.'))) {
      try {
        await storefrontAPI.deleteSection(sectionId);
        // Remove the section from the local state for an instant UI update
        setSections(prevSections => prevSections.filter(section => section.id !== sectionId));
      } catch (err) {
        const apiError = err.response?.data?.error || t('storefront.errors.delete_section', 'Failed to delete the section.');
        setError(apiError);
        console.error("Failed to delete section", err);
      }
    }
  };
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
            <div>
              <h5 className="mb-1 text-capitalize">{section.section_type.replace('_', ' ')}</h5>
            </div>
            <div>
              <span className={`badge me-3 bg-${section.is_visible ? 'success' : 'secondary'}`}>
                {section.is_visible ? t('common.visible', 'Visible') : t('common.hidden', 'Hidden')}
              </span>
              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSection(section.id)}>
                {t('common.delete', 'Delete')}
              </Button>
            </div>
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
          <button className="btn btn-primary btn-sm" onClick={handleAddSection}>
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