import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  imageUrl?: string;
  type?: string; // e.g., 'website', 'article'
  structuredData?: object;
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, imageUrl, type = 'website', structuredData, noIndex }) => {
  useEffect(() => {
    const setMetaTag = (nameOrProperty: string, content: string, isProperty: boolean = false) => {
      const selector = isProperty ? `meta[property='${nameOrProperty}']` : `meta[name='${nameOrProperty}']`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
            element.setAttribute('property', nameOrProperty);
        } else {
            element.setAttribute('name', nameOrProperty);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    document.title = title;
    
    setMetaTag('description', description);
    if (keywords) {
      setMetaTag('keywords', keywords);
    }
    
    // Robots tag for noindexing
    const robotsTag = document.querySelector("meta[name='robots']");
    if (noIndex) {
      setMetaTag('robots', 'noindex, follow');
    } else if (robotsTag) {
      robotsTag.remove();
    }

    // Canonical URL
    let canonicalLink = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', window.location.href);
    
    // Open Graph Tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', window.location.href, true);
    if (imageUrl) {
      setMetaTag('og:image', imageUrl, true);
    }
    
    // Twitter Card Tags
    setMetaTag('twitter:card', imageUrl ? 'summary_large_image' : 'summary', false);
    setMetaTag('twitter:title', title, false);
    setMetaTag('twitter:description', description, false);
    if (imageUrl) {
      setMetaTag('twitter:image', imageUrl, false);
    }
    
    // Structured Data (JSON-LD)
    const scriptId = 'structured-data';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredData) {
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.id = scriptId;
            document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(structuredData);
    } else if (scriptTag) {
        scriptTag.remove();
    }

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
          scriptToRemove.remove();
      }
      // Note: We don't clean up the meta/title tags on component unmount in an SPA
      // because the next page's SEO component will just overwrite them.
    };
  }, [title, description, keywords, imageUrl, type, structuredData, noIndex]);

  return null;
};

export default SEO;