import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StorefrontPage from './pages/StorefrontPage';
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/tienda/:tenantSlug" element={<StorefrontPage />} />
      <Route path="/" element={<div><h1>Landing Page Home</h1><p>Please specify a store, e.g., /tienda/your-store-slug</p></div>} />
    </Routes>
  )
}

export default App