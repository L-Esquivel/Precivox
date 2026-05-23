import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storefrontAPI } from '../../services/storefrontAPI';
import { Spinner, Button } from 'react-bootstrap';
import AddSectionModal from './AddSectionModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const StorefrontSettings = () => {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Store the original sections order to revert on API error
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const data = await storefrontAPI.getSections();
        setSections(data);
        setError(null);
      } catch (err) {
        const apiErrorMsg = err.response?.data?.error;
        const apiError = apiErrorMsg === 'Feature not available: Database is not up to date.'
          ? t('storefront.errors.db_not_ready')
          : apiErrorMsg || t('storefront.errors.load_sections', 'Failed to load storefront sections.');
        setError(apiError);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [t]); // t is a stable function, but it's good practice to include it.

  const handleCreateSection = async (sectionType) => {
    try {
      const newSection = await storefrontAPI.createSection({ section_type: sectionType });
      // Add the new section to the local state to update the UI instantly
      setSections(prevSections => [...prevSections, newSection]);
      setShowAddModal(false); // Close modal on success
    } catch (err) {
      const apiErrorMsg = err.response?.data?.error;
      const apiError = apiErrorMsg === 'Feature not available: Database is not up to date.'
        ? t('storefront.errors.db_not_ready')
        : apiErrorMsg || t('storefront.errors.add_section', 'Failed to add the new section.');
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
        const apiErrorMsg = err.response?.data?.error;
        const apiError = apiErrorMsg === 'Feature not available: Database is not up to date.'
          ? t('storefront.errors.db_not_ready')
          : apiErrorMsg || t('storefront.errors.delete_section', 'Failed to delete the section.');
        setError(apiError);
        console.error("Failed to delete section", err);
      }
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) {
      return;
    }

    const originalSections = [...sections];
    const reorderedSections = Array.from(sections);
    const [removed] = reorderedSections.splice(source.index, 1);
    reorderedSections.splice(destination.index, 0, removed);

    // Update UI immediately for a snappy feel
    setSections(reorderedSections);

    try {
      const orderedIds = reorderedSections.map(s => s.id);
      await storefrontAPI.reorderSections(orderedIds);
    } catch (err) {
      setError(t('storefront.errors.reorder_section', 'Failed to save the new order. Reverting changes.'));
      setSections(originalSections); // Revert to original order on error
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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections-list">
          {(provided) => (
            <ul className="list-group mt-3" {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={String(section.id)} index={index}>
                  {(provided) => (
                    <li
                      className="list-group-item d-flex justify-content-between align-items-center"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <div className="d-flex align-items-center">
                        <span className="me-3 text-muted">☰</span>
                        <h5 className="mb-0 text-capitalize">{section.section_type.replace('_', ' ')}</h5>
                      </div>
                      <div>
                        <span className={`badge me-3 bg-${section.is_visible ? 'success' : 'secondary'}`}>{section.is_visible ? t('common.visible', 'Visible') : t('common.hidden', 'Hidden')}</span>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSection(section.id)}>{t('common.delete', 'Delete')}</Button>
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="mb-0">{t('storefront.settings.title', 'Storefront Settings')}</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            {t('storefront.settings.addSection', 'Add Section')}
          </button>
        </div>
        <div className="card-body">
          <p className="text-muted">{t('storefront.settings.description', 'Manage your public landing page sections and appearance here.')}</p>
          {renderContent()}
        </div>
      </div>

      <AddSectionModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onConfirm={handleCreateSection}
      />
    </div>
  );
};

export default StorefrontSettings;