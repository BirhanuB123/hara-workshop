import { Product } from '../types';

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
  'BED', 'CHR', 'DNG', 'HBD', 'HCH', 'HSH', 'HTB', 'HWC', 'MGT', 'MHR',
  'MWN', 'ODS', 'OWP', 'SHL', 'TBL', 'TVS', 'WCB', 'WDR', 'WKT', 'WRD'
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
 * Returns the reliable image URL for a given product with fallback support.
 * Guaranteed never to return a generic workshop hero photo as a product fallback.
 */
export const getProductImageUrl = (prod: Partial<Product> | null | undefined): string => {
  if (!prod) return '/hara-official-logo.png';

  // 1. Check if product has an official SKU matching a verified catalog image
  if (prod.sku) {
    const officialAsset = getOfficialProductImage(prod.sku);
    if (officialAsset) return officialAsset;
  }

  // 2. Check primary_image
  if (prod.primary_image) {
    const img = prod.primary_image.trim();
    // Intercept legacy or backend /media/products/ paths and map to official static asset
    if (img.includes('/media/products/')) {
      const filename = img.split('/').pop() || '';
      const skuCandidate = filename.split('.')[0].toUpperCase();
      const officialAsset = getOfficialProductImage(skuCandidate);
      if (officialAsset) return officialAsset;
    }
    if (!img.includes('service-hero-workshop.jpg')) {
      return img.startsWith('/') ? img : `/${img}`;
    }
  }

  // 3. Check images list
  if (prod.images && prod.images.length > 0 && prod.images[0]?.image) {
    const img = prod.images[0].image.trim();
    if (img.includes('/media/products/')) {
      const filename = img.split('/').pop() || '';
      const skuCandidate = filename.split('.')[0].toUpperCase();
      const officialAsset = getOfficialProductImage(skuCandidate);
      if (officialAsset) return officialAsset;
    }
    if (!img.includes('service-hero-workshop.jpg')) {
      return img.startsWith('/') ? img : `/${img}`;
    }
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
