import { Product, Service } from '../types';
import { getMediaUrl } from './media';

/**
 * Verified static public asset paths for primary workshop services
 */
export const OFFICIAL_SERVICE_IMAGES: Record<string, string> = {
  'metal-works': '/images/services/service-metal-works.jpg',
  'wood-works': '/images/services/service-wood-works.jpg',
  'hybrid-metal-wood': '/images/services/service-hybrid-works.jpg',
  'hybrid-metal-wood-construction': '/images/services/service-hybrid-works.jpg',
};

/**
 * Normalizes any service title, category, slug, or input string into a standard service slug.
 */
export const normalizeServiceSlug = (identifier?: string | null): string => {
  if (!identifier) return 'wood-works';
  const s = identifier.trim().toLowerCase();
  if (
    s.includes('hybrid') ||
    s.includes('ቅይጥ') ||
    (s.includes('metal') && s.includes('wood')) ||
    (s.includes('ብረት') && s.includes('እንጨት'))
  ) {
    return 'hybrid-metal-wood';
  }
  if (s.includes('metal') || s.includes('ብረት')) {
    return 'metal-works';
  }
  if (s.includes('wood') || s.includes('እንጨት') || s.includes('carpentry')) {
    return 'wood-works';
  }
  return s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'wood-works';
};

/**
 * Returns the reliable, high-resolution static image URL for a service.
 * Handles Service objects, slugs, titles, and intercepts broken `/media/services/` paths.
 */
export const getServiceImageUrl = (serviceOrIdentifier?: Partial<Service> | string | null): string => {
  if (!serviceOrIdentifier) {
    return OFFICIAL_SERVICE_IMAGES['wood-works'];
  }

  // 1. If passed an object (Service or partial Service)
  if (typeof serviceOrIdentifier === 'object') {
    const service = serviceOrIdentifier;
    const slugCandidate = service.slug || service.id || service.title || service.category_name;
    const normalized = normalizeServiceSlug(slugCandidate);
    if (OFFICIAL_SERVICE_IMAGES[normalized]) {
      return OFFICIAL_SERVICE_IMAGES[normalized];
    }

    const candidateImg = service.primary_image || service.image;
    if (typeof candidateImg === 'string' && candidateImg.trim()) {
      const trimmed = candidateImg.trim();
      if (trimmed.includes('/media/services/')) {
        const filename = trimmed.split('/').pop() || '';
        const derivedSlug = normalizeServiceSlug(filename);
        return OFFICIAL_SERVICE_IMAGES[derivedSlug] || OFFICIAL_SERVICE_IMAGES['wood-works'];
      }
      if (trimmed.startsWith('/images/services/service-')) {
        return trimmed;
      }
    }

    return OFFICIAL_SERVICE_IMAGES[normalized] || OFFICIAL_SERVICE_IMAGES['wood-works'];
  }

  // 2. If passed a string (slug, title, or path)
  if (typeof serviceOrIdentifier === 'string') {
    const trimmed = serviceOrIdentifier.trim();
    if (trimmed.includes('/media/services/')) {
      const filename = trimmed.split('/').pop() || '';
      const derivedSlug = normalizeServiceSlug(filename);
      return OFFICIAL_SERVICE_IMAGES[derivedSlug] || OFFICIAL_SERVICE_IMAGES['wood-works'];
    }
    const normalized = normalizeServiceSlug(trimmed);
    return OFFICIAL_SERVICE_IMAGES[normalized] || OFFICIAL_SERVICE_IMAGES['wood-works'];
  }

  return OFFICIAL_SERVICE_IMAGES['wood-works'];
};

/**
 * Non-standard file extensions for verified official catalog product images in /images/services/
 */
export const OFFICIAL_PRODUCT_EXTENSIONS: Record<string, string> = {
  'WDR-004': 'png',
  'WKT-002': 'webp',
  'WKT-003': 'webp',
  'WKT-005': 'webp',
};

/**
 * All verified official catalog SKU prefixes.
 */
export const OFFICIAL_SKU_PREFIXES = new Set([
  'BED', 'CHR', 'HBD', 'HCH', 'HSH', 'HTB', 'HWC', 'MGT', 'MHR',
  'MWN', 'ODS', 'OWP', 'TBL', 'TVS', 'WCB', 'WDR', 'WKT', 'WRD'
]);

/**
 * Resolves an official product SKU to its verified public asset path.
 * Returns null if the SKU is not recognized as an official product asset.
 */
export const getOfficialProductImage = (sku?: string | null): string | null => {
  if (!sku) return null;
  const cleanSku = sku.trim().toUpperCase();
  const prefix = cleanSku.split('-')[0];
  if (OFFICIAL_SKU_PREFIXES.has(prefix)) {
    const ext = OFFICIAL_PRODUCT_EXTENSIONS[cleanSku] || 'jpg';
    return `/images/services/${cleanSku}.${ext}`;
  }
  return null;
};

/**
 * Normalizes a single product image URL/path while preserving external/media URLs
 * and mapping seeded legacy `/media/products/<OFFICIAL_SKU>.*` paths to verified static assets.
 */
export const resolveProductImagePath = (raw?: string | null): string | null => {
  if (!raw) return null;
  const img = raw.trim();
  if (!img || img.includes('service-hero-workshop.jpg')) {
    return null;
  }

  if (img.startsWith('blob:') || img.startsWith('data:')) {
    return img;
  }

  if (img.includes('/media/products/')) {
    const filename = img.split('?')[0].split('/').pop() || '';
    const skuCandidate = filename.split('.')[0].toUpperCase();
    if (/^[A-Z]{3}-\d{3}$/.test(skuCandidate)) {
      const officialAsset = getOfficialProductImage(skuCandidate);
      if (officialAsset) return officialAsset;
    }
  }

  if (
    img.startsWith('http://') ||
    img.startsWith('https://') ||
    img.includes('/media/') ||
    img.startsWith('media/')
  ) {
    return getMediaUrl(img);
  }

  return img.startsWith('/') ? img : `/${img}`;
};

/**
 * Returns the reliable image URL for a given product with fallback support.
 * Honors custom uploaded `primary_image` and `images[0]` first, then falls back to SKU asset.
 * Guaranteed never to return a generic workshop hero photo as a product fallback.
 */
export const getProductImageUrl = (prod: Partial<Product> | null | undefined): string => {
  if (!prod) return '/hara-official-logo.png';

  // 1. Check explicit primary_image first (supports admin overrides & static catalog URLs)
  const resolvedPrimary = resolveProductImagePath(prod.primary_image);
  if (resolvedPrimary) return resolvedPrimary;

  // 2. Check images list first entry
  if (prod.images && prod.images.length > 0 && prod.images[0]?.image) {
    const resolvedGallery = resolveProductImagePath(prod.images[0].image);
    if (resolvedGallery) return resolvedGallery;
  }

  // 3. Fall back to verified official catalog image by SKU
  if (prod.sku) {
    const officialAsset = getOfficialProductImage(prod.sku);
    if (officialAsset) return officialAsset;
  }

  // 4. Default to official neutral workshop branding logo (never generic workshop photo)
  return '/hara-official-logo.png';
};

/**
 * Maps raw service category or display names to the exact dropdown option in RequestQuotePage.
 */
export const mapServiceCategoryToDropdown = (serviceCategory?: string, serviceDisplay?: string): string => {
  const combined = `${serviceCategory || ''} ${serviceDisplay || ''}`.toLowerCase();
  if (combined.includes('wood') && !combined.includes('metal')) {
    return 'Wood Works (Carpentry & Custom Furniture)';
  }
  if (combined.includes('metal') && !combined.includes('wood')) {
    return 'Metal Works (Fabrication & Welding)';
  }
  return 'Hybrid Metal + Wood Construction';
};
