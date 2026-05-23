import React, { useState, useEffect } from 'react';
import { getSubdomain } from './utils/subdomain';
import { storefrontService } from './services/storefrontService';
import './App.css'

function App() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStoreData = async () => {
      const subdomain = getSubdomain(window.location.hostname);

      if (!subdomain) {
        setError('Could not determine the store to display.');
        setLoading(false);
        return;
      }

      try {
        const data = await storefrontService.getStorefrontData(subdomain);
        setStore(data);

        // Dynamically set brand colors from the database
        document.documentElement.style.setProperty('--primary-color', data.settings.brand_color_primary);
        document.documentElement.style.setProperty('--secondary-color', data.settings.brand_color_secondary);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, []);

  const getImageUrl = (imgName) => {
    if (!imgName) return 'https://via.placeholder.com/400x300';
    if (imgName.startsWith('http')) return imgName; // It's a Cloudinary URL
    // Fallback for old, local images
    return `https://sweetland-by-anny-production.up.railway.app/static/images/${imgName}`;
  };

  if (loading) {
    return <div className="loading-screen"><h1>Loading Store...</h1></div>;
  }

  if (error) {
    return <div className="error-screen"><h1>Error</h1><p>{error}</p></div>;
  }

  if (!store) {
    return <div className="error-screen"><h1>Store not found.</h1></div>;
  }

  const { settings, products } = store;

  return (
    <div className="storefront-container">
      <header className="store-header" style={{ backgroundImage: `url(${getImageUrl(settings.hero_image_url)})` }}>
        <div className="header-overlay">
          {settings.logo_url && <img src={getImageUrl(settings.logo_url)} alt="Store Logo" className="store-logo" />}
          <h1>{settings.welcome_title}</h1>
          <p>{settings.welcome_subtitle}</p>
        </div>
      </header>

      <main className="products-grid">
        {products.map(product => (
          <div key={product.id_producto} className="product-card">
            <img src={getImageUrl(product.imagen)} alt={product.nombre} />
            <div className="product-info">
              <h3>{product.nombre}</h3>
              <p>{product.descripcion}</p>
              <div className="product-price">${new Intl.NumberFormat('es-CO').format(product.precio)}</div>
            </div>
          </div>
        ))}
      </main>

      <footer className="store-footer">
        <p>&copy; {new Date().getFullYear()} {settings.welcome_title}. All rights reserved.</p>
        <div className="social-links">
          {settings.social_instagram_url && <a href={settings.social_instagram_url} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {settings.social_whatsapp_number && <a href={`https://wa.me/${settings.social_whatsapp_number}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        </div>
      </footer>
    </div>
  )
}

export default App