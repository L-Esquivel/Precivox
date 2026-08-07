import React from 'react';

const ProductGrid = ({ content, products }) => {
  const { title } = content || {};

  return (
    <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', color: '#1f2937' }}>
        {title || 'Nuestro Catálogo'}
      </h2>
      
      {products && products.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {products.map(product => (
            <div key={product.id_producto} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ height: '200px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.imagen_url ? (
                  <img 
                    src={product.imagen_url} 
                    alt={product.nombre} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#9ca3af' }}>Sin imagen</span>
                )}
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {product.categoria || 'General'}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                  {product.nombre}
                </h3>
                {product.descripcion && (
                  <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.descripcion}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
                    ${parseFloat(product.precio || 0).toFixed(2)}
                  </span>
                  <button style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
          <p>No hay productos disponibles en este momento.</p>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
