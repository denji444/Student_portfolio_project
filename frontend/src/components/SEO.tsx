import { useEffect } from 'react';

// Lightweight SEO component without external deps.
// Usage: <SEO title="..." description="..." keywords={[...]}/>
// Also sets Open Graph, Twitter tags, canonical URL and JSON-LD Website + Organization.

type SEOProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string; // absolute URL preferred
  url?: string;   // canonical absolute URL
  type?: 'website' | 'article';
  robots?: string; // e.g., 'index,follow' or 'noindex,nofollow'
};

const DEFAULTS = {
  title: 'PTUT Student Portfolio — Software Engineering Technology',
  description:
    'Explore PTUT (Punjab Tianjin University of Technology) Software Engineering Technology student portfolios, projects, and achievements. Discover work by SET students, technologies used, and live demos.',
  image: (import.meta.env.VITE_OG_IMAGE as string)
    || ((import.meta.env.VITE_SITE_URL as string)?.replace(/\/$/, '') + '/ptut-logo.png')
    || 'https://student-portfolio-gppt.onrender.com/ptut-logo.png',
  url: (import.meta.env.VITE_SITE_URL as string)
    || 'https://student-portfolio-gppt.onrender.com/',
};

function setMeta(name: string, content?: string) {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setProperty(property: string, content?: string) {
  if (!content) return;
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLink(rel: string, href?: string) {
  if (!href) return;
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export default function SEO(props: SEOProps) {
  const title = props.title || DEFAULTS.title;
  const description = props.description || DEFAULTS.description;
  const image = props.image || DEFAULTS.image;
  const url = props.url || DEFAULTS.url;
  const type = props.type || 'website';
  const robots = props.robots;
  const keywords = props.keywords || [
    'PTUT portfolio',
    'Punjab Tianjin University of Technology portfolio',
    'Software Engineering Technology portfolio',
    'SET portfolio',
    'student portfolio',
    'student PTUT portfolio',
    'PTUT projects',
    'student projects PTUT',
    'university portfolio Pakistan',
  ];

  useEffect(() => {
    document.title = title;

    setMeta('description', description);
    setMeta('keywords', keywords.join(', '));
    setMeta('author', 'PTUT SET Department');
    if (robots) setMeta('robots', robots);

    // Open Graph
    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:type', type);
    setProperty('og:image', image);
    setProperty('og:url', url);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // Canonical
    setLink('canonical', url);

    // JSON-LD Website + Organization
    const ld: any[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PTUT Student Portfolio',
        url,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Punjab Tianjin University of Technology — SET Department',
        url,
        logo: image,
      },
    ];

    const id = 'seo-jsonld';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(ld);
  }, [title, description, image, url, type, JSON.stringify(keywords)]);

  return null;
}
