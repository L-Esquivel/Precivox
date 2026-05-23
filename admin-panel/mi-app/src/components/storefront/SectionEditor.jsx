import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Spinner } from 'react-bootstrap';
import { storefrontAPI } from '../../services/storefrontAPI';

const SectionEditor = ({ section, onClose, onSave }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    // When a new section is selected, reset the content state
    setContent(section.content || {});
    setImagePreview(section.content?.imageUrl || '');
    setImageFile(null); // Reset file input on new section selection
    setError(null);
  }, [section]);

  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    let finalContent = { ...content };

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResponse = await storefrontAPI.uploadImage(formData);
        finalContent.imageUrl = uploadResponse.filename; // The secure URL from Cloudinary
      } catch (uploadError) {
        setError(t('storefront.editor.upload_error', 'Failed to upload image.'));
        console.error(uploadError);
        setIsSaving(false);
        return;
      }
    }

    try {
      await storefrontAPI.updateSection(section.id, { content: finalContent });
      onSave({ ...section, content: finalContent }); // Update parent state
    } catch (err) {
      setError(t('storefront.editor.save_error', 'Failed to save changes.'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderFields = () => {
    switch (section.section_type) {
      case 'hero':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>{t('storefront.editor.hero.title', 'Title')}</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={content.title || ''}
                onChange={handleContentChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('storefront.editor.hero.subtitle', 'Subtitle')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="subtitle"
                value={content.subtitle || ''}
                onChange={handleContentChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('storefront.editor.hero.image', 'Background Image')}</Form.Label>
              {imagePreview && (
                <div className="mb-2">
                  <img src={imagePreview} alt={t('storefront.editor.image_preview', 'Image Preview')} className="img-thumbnail" style={{ maxHeight: '150px' }} />
                </div>
              )}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Form.Text className="text-muted">
                {t('storefront.editor.image_help', 'Recommended size: 1920x1080px.')}
              </Form.Text>
            </Form.Group>
          </>
        );
      // Add cases for other section types here in the future
      default:
        return <p>{t('storefront.editor.no_fields', 'This section type has no editable fields yet.')}</p>;
    }
  };

  return (
    <div className="p-3 border-start" style={{ minWidth: '350px', height: '100%' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-capitalize">{t('storefront.editor.title', 'Edit Section')}</h4>
        <Button variant="close" onClick={onClose}></Button>
      </div>
      <hr />
      {renderFields()}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className="d-grid gap-2 mt-4">
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Spinner as="span" animation="border" size="sm" /> : t('common.save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

export default SectionEditor;