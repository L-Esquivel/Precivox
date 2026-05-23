import React from 'react';
import { useTranslation } from 'react-i18next';
import IngredientesList from '../ingredientes/IngredientesList';
import EmpaquesList from './EmpaquesList';
import './InsumosPage.css';

const InsumosPage = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="insumos-container">
      {/* This component now acts as a container for the specific lists */}
      <div className="mb-5">
        <IngredientesList />
      </div>
      <div>
        <EmpaquesList />
      </div>
    </div>
  );
};

export default InsumosPage;