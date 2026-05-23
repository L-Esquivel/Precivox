import React from 'react';

const HeroSection = ({ content }) => {
  const heroStyles = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${content.imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
    textAlign: 'center',
    padding: '150px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <section style={heroStyles}>
      <h1>{content.title || 'Welcome to Our Store'}</h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px' }}>{content.subtitle || 'Discover our amazing products and services.'}</p>
    </section>
  );
};

export default HeroSection;