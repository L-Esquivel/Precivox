import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Storefront from './pages/Storefront';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/tienda/:tenantSlug" element={<Storefront />} />
        <Route path="*" element={
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1>Página no encontrada</h1>
            <p>La URL de la tienda que buscas no existe o fue escrita incorrectamente.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
