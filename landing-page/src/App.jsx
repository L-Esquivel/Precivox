import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StorefrontPage from './services/StorefrontPage';
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/tienda/:tenantSlug" element={<StorefrontPage />} />
      <Route path="/" element={<div><h1>Precivox Platform</h1><p>Por favor especifica una tienda, ej. /tienda/mi-negocio</p></div>} />
    </Routes>
  );
}

export default App;
