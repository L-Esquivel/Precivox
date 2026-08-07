import React from 'react';

const HeroSection = ({ content }) => {
  const { title, subtitle, imageUrl } = content;

  return (
    <section 
      style={{
        position: 'relative',
        backgroundColor: '#f3f4f6',
        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '6rem 2rem',
        textAlign: 'center',
        color: imageUrl ? '#ffffff' : '#1f2937',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {/* Dark overlay for readability if there is an image */}
      {imageUrl && (
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }} 
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', textShadow: imageUrl ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
          {title || 'Bienvenido a nuestra tienda'}
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, textShadow: imageUrl ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
          {subtitle || 'Explora nuestros productos de alta calidad.'}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
