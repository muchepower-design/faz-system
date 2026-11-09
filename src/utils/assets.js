// frontend/src/utils/assets.js
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Turn a stored image path into a fully-qualified URL.
 * - Absolute URLs (http/https/data/blob) pass through untouched.
 * - Relative paths (/assets/...) get the API base prepended.
 */
export function resolveAssetUrl(url) {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}