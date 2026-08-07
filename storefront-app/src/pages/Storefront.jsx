import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import HeroSection from '../components/HeroSection';
import ProductGrid from '../components/ProductGrid';

const Storefront = () => {
  const { tenantSlug } = useParams();
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        setLoading(true);
        // Fetch sections
        const sectionsRes = await axios.get(`${API_URL}/public/storefront/${tenantSlug}`);
        // Fetch products
        const productsRes = await axios.get(`${API_URL}/public/storefront/${tenantSlug}/products`);
        
        setSections(sectionsRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Error fetching storefront:', err);
        setError('No se pudo cargar la tienda. Verifica que el enlace sea correcto.');
      } finally {
        setLoading(false);
      }
    };

    if (tenantSlug) {
      fetchStorefrontData();
    }
  }, [tenantSlug, API_URL]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Cargando tienda...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>{error}</h2>
      </div>
    );
  }

  // Render components dynamically based on section_type
  const renderSection = (section) => {
    switch (section.section_type) {
      case 'hero':
        return <HeroSection key={section.id} content={section.content} />;
      case 'product_grid':
        return <ProductGrid key={section.id} content={section.content} products={products} />;
      case 'text_block':
        return (
          <section key={section.id} style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2>{section.content.title}</h2>
            <p>{section.content.body}</p>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Dynamic Sections */}
      {sections.length > 0 ? (
        sections.map(renderSection)
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Tienda en construcción</h2>
          <p>Este negocio aún no ha configurado su página pública.</p>
        </div>
      )}
      
      {/* Simple Footer */}
      <footer style={{ backgroundColor: '#1f2937', color: '#9ca3af', padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
        <p>&copy; {new Date().getFullYear()} Creado con Precivox</p>
      </footer>
    </div>
  );
};

export default Storefront;
