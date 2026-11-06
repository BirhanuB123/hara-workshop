import { create } from 'zustand';
import { Product } from '../types';
import { CATALOG_PRODUCTS } from '../data/catalogProducts';

interface ProductOrderState {
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  selectProductBySkuOrId: (skuOrId: string) => Product | null;
  clearSelectedProduct: () => void;
}

const STORAGE_KEY = 'hara_selected_order_product';

export const useProductOrderStore = create<ProductOrderState>((set, get) => ({
  selectedProduct: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored order product', e);
    }
    return null;
  })(),

  setSelectedProduct: (product) => {
    if (typeof window !== 'undefined') {
      try {
        if (product) {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(product));
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {}
    }
    set({ selectedProduct: product });
  },

  selectProductBySkuOrId: (skuOrId) => {
    if (!skuOrId) return null;
    const clean = skuOrId.trim().toLowerCase();
    const found = CATALOG_PRODUCTS.find(
      (p) =>
        (p.id && p.id.toLowerCase() === clean) ||
        (p.sku && p.sku.toLowerCase() === clean) ||
        (p.slug && p.slug.toLowerCase() === clean) ||
        (p.name && p.name.toLowerCase() === clean)
    );
    if (found) {
      get().setSelectedProduct(found);
      return found;
    }
    return null;
  },

  clearSelectedProduct: () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
    set({ selectedProduct: null });
  },
}));
