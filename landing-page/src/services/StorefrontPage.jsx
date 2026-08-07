import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStorefrontData } from './publicApi';
import HeroSection from './HeroSection';
// Import other section components as they are created
// import FeaturedProductsSection from '../sections/FeaturedProductsSection';

const sectionComponents = {
  hero: HeroSection,
  // featured_products: FeaturedProductsSection,
};

const StorefrontPage = () => {
  const { tenantSlug } = useParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantSlug) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getStorefrontData(tenantSlug);
        setSections(response.data);
      } catch (err) {
        const errorMessage = err.response?.status === 404
          ? 'Store not found.'
          : 'Failed to load store data.';
        setError(errorMessage);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantSlug]);

  if (loading) return <div>Loading store...</div>;
  if (error) return <div>Error: {error}</div>;
  if (sections.length === 0) return <div>This store has not been configured yet.</div>;

  return (
    <main>
      {sections.map((section, index) => {
        const SectionComponent = sectionComponents[section.section_type];
        if (!SectionComponent) return null; // Or a placeholder for unknown sections
        return <SectionComponent key={index} content={section.content} />;
      })}
    </main>
  );
};

export default StorefrontPage;