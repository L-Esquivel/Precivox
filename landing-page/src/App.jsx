import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import your main components/pages
import Layout from './components/layout/Layout';
import Login from './pages/Login'; // You need to create or have this component
import Dashboard from './pages/Dashboard'; // You need to create or have this component
import UsersList from './components/users/UsersList'; // Adjust path if needed
import ProductsList from './components/productos/ProductsList'; // Adjust path if needed
import OrdersList from './components/pedidos/OrdersList'; // Adjust path if needed
import SuppliesPage from './components/insumos/SuppliesPage'; // Adjust path if needed
import RecetasList from './components/recetas/RecetasList'; // Adjust path if needed
import ExpensesPage from './components/gastos/ExpensesPage'; // Adjust path if needed
import WastePage from './components/merma/WastePage'; // Adjust path if needed
import StorefrontSettings from './components/storefront/StorefrontSettings';

// A wrapper to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div>Verifying session...</div>; // Or a spinner
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* All protected routes are children of this route */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* The 'index' route redirects from '/' to '/dashboard' */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Your app's modules */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="supplies" element={<SuppliesPage />} />
        <Route path="recipes" element={<RecetasList />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="waste" element={<WastePage />} />
        <Route path="storefront-settings" element={<StorefrontSettings />} />
        
        {/* A fallback route to redirect any unknown path to the dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
