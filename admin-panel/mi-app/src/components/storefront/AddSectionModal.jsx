import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const AddSectionModal = ({ show, onHide, onConfirm }) => {
  const { t } = useTranslation();
  const [sectionType, setSectionType] = useState('hero');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionTypes = [
    { value: 'hero', label: t('storefront.section_types.hero', 'Hero Banner') },
    { value: 'featured_products', label: t('storefront.section_types.featured_products', 'Featured Products') },
    { value: 'gallery', label: t('storefront.section_types.gallery', 'Image Gallery') },
    { value: 'about_us', label: t('storefront.section_types.about_us', 'About Us') },
    { value: 'contact_form', label: t('storefront.section_types.contact_form', 'Contact Form') },
  ];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(sectionType);
    setIsSubmitting(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('storefront.modal.add_title', 'Add a New Section')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group controlId="sectionTypeSelect">
          <Form.Label>{t('storefront.modal.section_type_label', 'Select a section type')}</Form.Label>
          <Form.Select value={sectionType} onChange={(e) => setSectionType(e.target.value)}>
            {sectionTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? t('common.loading', 'Loading...') : t('storefront.modal.add_button', 'Add Section')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddSectionModal;