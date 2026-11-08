/**
 * HARA WORKSHOP - Media and File Handling Utilities
 * Provides resilient URL normalization and file download/preview utilities
 * ensuring device-uploaded images and blueprints open seamlessly in the browser.
 */

export function getMediaUrl(url?: string | null): string {
  if (!url) return '';

  // Return blob or base64 data URLs as-is
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const backendHost = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? 'https://hara-workshop.onrender.com'
      : '')
  )
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  let path = url;

  // Strip Docker internal hostname http://backend:8000
  if (path.includes('backend:8000')) {
    path = path.replace(/^https?:\/\/backend:8000/, '');
  } else if (path.includes('localhost:8000') || path.includes('127.0.0.1:8000')) {
    // If pointing to localhost:8000 or 127.0.0.1:8000, normalize host prefix
    path = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8000/, '');
  }

  // Prepend backend host to /media/ paths in production or when backendHost is configured
  if (path.startsWith('/media/') || path.startsWith('media/')) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return backendHost ? `${backendHost}${normalizedPath}` : normalizedPath;
  }

  return path;
}

export function isImageFile(fileNameOrUrl?: string | null): boolean {
  if (!fileNameOrUrl) return false;
  const clean = fileNameOrUrl.split('?')[0].toLowerCase();
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(clean);
}

export function isCadFile(fileNameOrUrl?: string | null): boolean {
  if (!fileNameOrUrl) return false;
  const clean = fileNameOrUrl.split('?')[0].toLowerCase();
  return /\.(dxf|dwg)$/i.test(clean);
}

export function isPdfFile(fileNameOrUrl?: string | null): boolean {
  if (!fileNameOrUrl) return false;
  const clean = fileNameOrUrl.split('?')[0].toLowerCase();
  return /\.pdf$/i.test(clean);
}

export async function downloadFile(url: string, filename?: string) {
  const resolvedUrl = getMediaUrl(url);
  const fallbackName = filename || resolvedUrl.split('/').pop() || 'download';

  try {
    const res = await fetch(resolvedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window open:', err);
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
