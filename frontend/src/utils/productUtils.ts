import { Product } from '../types';

/**
 * Returns the reliable image URL for a given product with fallback support.
 */
export const getProductImageUrl = (prod: Partial<Product> | null | undefined): string => {
  if (!prod) return '/hara-official-logo.png';
  if (prod.primary_image) {
    return prod.primary_image.startsWith('/') ? prod.primary_image : `/${prod.primary_image}`;
  }
  if (prod.images && prod.images.length > 0 && prod.images[0].image) {
    const img = prod.images[0].image;
    return img.startsWith('/') ? img : `/${img}`;
  }
  if (prod.sku) {
    const sku = prod.sku.toUpperCase();
    const ext = sku === 'WDR-004' ? 'png' : ['WKT-002', 'WKT-003', 'WKT-005'].includes(sku) ? 'webp' : 'jpg';
    return `/images/services/${sku}.${ext}`;
  }
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
