import { useEffect } from 'react';
import React from 'react';

/**
 * Reusable SEO component for React Single Page Applications.
 * Dynamically updates document metadata to improve indexing and Lighthouse score.
 */
export default function SEO({ 
  title, 
  description, 
  keywords, 
  canonical, 
  robots = 'index, follow' 
}) {
  useEffect(() => {
    // 1. Dynamic document.title
    const brandName = 'Num Num';
    const finalTitle = title ? `${title} | ${brandName}` : `${brandName} - Premium Restaurant Operational Platform`;
    if (document.title !== finalTitle) {
      document.title = finalTitle;
    }

    // Helper function to find or create a meta tag
    const updateMetaTag = (attribute, value, content) => {
      let element = document.querySelector(`meta[${attribute}="${value}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    // Helper function to find or create a link tag
    const updateLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href || '');
    };

    // 2. Standard Search Engine Meta Tags
    const defaultDescription = 'Num Num is a premium, high-performance operational restaurant platform connecting customers, local chefs, and swift delivery drivers.';
    updateMetaTag('name', 'description', description || defaultDescription);

    const defaultKeywords = 'food delivery, local chefs, kitchen pipeline, driver jobs, order tracking, real-time dining, restaurant management';
    updateMetaTag('name', 'keywords', keywords || defaultKeywords);
    updateMetaTag('name', 'robots', robots);

    // 3. Open Graph (OG) Meta Tags for Social Media Card Preview
    updateMetaTag('property', 'og:title', title || 'Num Num - Premium Restaurant Platform');
    updateMetaTag('property', 'og:description', description || defaultDescription);
    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:url', canonical || window.location.href);
    updateMetaTag('property', 'og:site_name', brandName);
    updateMetaTag('property', 'og:image', 'https://numnum.example.com/icons.svg');

    // 4. Twitter Cards
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title || 'Num Num - Premium Restaurant Platform');
    updateMetaTag('name', 'twitter:description', description || defaultDescription);
    updateMetaTag('name', 'twitter:image', 'https://numnum.example.com/icons.svg');

    // 5. Canonical URL
    updateLinkTag('canonical', canonical || window.location.href);

  }, [title, description, keywords, canonical, robots]);

  return null;
}
