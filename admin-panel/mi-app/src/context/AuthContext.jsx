// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On initial mount, check if a session exists on the server
    const checkUserSession = async () => {
      try {
        // Assuming authAPI.me() calls the /auth/me endpoint
        const response = await authAPI.me();
        const data = response.data; // The actual payload from the server
        if (data && data.usuario && data.usuario.rol !== 'cliente') {
          setUser(data.usuario);
        } else {
          // If the user is a customer or data is invalid, clear the session
          setUser(null);
        }
      } catch (error) {
        // If the /me endpoint fails (e.g., 401), it means no valid session exists
        console.error('No active session found:', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      const data = response.data;

      // 💡 FIX: Perform a positive and strict validation of the response.
      // The login is only successful if we receive a user object with an 'admin' or 'superadmin' role.
      if (data && data.usuario && (data.usuario.rol === 'admin' || data.usuario.rol === 'superadmin')) {
        setUser(data.usuario);
        return { success: true };
      } else {
        // If the user is a 'cliente', throw a specific role denial error.
        if (data && data.usuario && data.usuario.rol === 'cliente') {
          throw new Error('login.error.role_denied');
        }
        // For any other case (e.g., missing user object), throw a generic server error.
        // This prevents the app from getting into an inconsistent state.
        throw new Error('login.serverError');
      }
    } catch (error) {
      setUser(null);
      // The error message can come from the API response (e.g., 401 invalid credentials)
      // or from the errors thrown within the 'try' block.
      const apiErrorMessage = error.response?.data?.error || error.message;
      return { success: false, error: apiErrorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      // This function is likely for the public site, but we keep it for completeness
      setLoading(true);
      await authAPI.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};