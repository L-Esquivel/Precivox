import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import your main components/pages
import Layout from './components/layout/Layout';
import Login from './components/Login'; // Assuming Login is in components
import Dashboard from './components/dashboard/Dashboard';
import UsersList from './components/usuarios/UsuariosList';
import ProductsList from './components/productos/ProductosList';
import OrdersList from './components/pedidos/PedidosList';
import SuppliesPage from './components/Insumos/InsumosPage';
import RecetasList from './components/recetas/RecetasList';
import GastosList from './components/gastos/GastosList';
import MermaList from './components/merma/MermaList';
import TenantsList from './components/tenants/TenantsList';
import StorefrontSettings from './components/storefront/StorefrontSettings';

// A wrapper to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, t } = useAuth();
  if (loading) {
    // Using the translation key from your context
    return <div className="loading">{t ? t('verifyingSession') : 'Verifying session...'}</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Todas las rutas protegidas son hijas de esta ruta */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* La ruta 'index' redirige de '/' a '/dashboard' */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Módulos de tu aplicación */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="supplies" element={<SuppliesPage />} />
        <Route path="recipes" element={<RecetasList />} />
        <Route path="expenses" element={<GastosList />} />
        <Route path="waste" element={<MermaList />} />
        <Route path="storefront-settings" element={<StorefrontSettings />} />
        <Route path="tenants" element={<TenantsList />} />
        
        {/* Una ruta de fallback para redirigir cualquier ruta desconocida al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;