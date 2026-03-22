/**
 * usePageMeta — sets document.title and meta description on mount.
 * Ensures the SPA matches the static HTML fallback for SEO consistency.
 */
export function usePageMeta({ title, description, canonical } = {}) {
  if (typeof window === 'undefined') return;

  if (title) {
    document.title = title;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  }

  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }

  if (canonical) {
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  }
}