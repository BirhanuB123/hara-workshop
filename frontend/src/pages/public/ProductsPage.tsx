import React, { useEffect, useState } from 'react';
import { productsApi, extractResults } from '../../services/api';
import { Product } from '../../types';
import { WorkshopCatalog } from '../../components/products/WorkshopCatalog';
import { useLanguageStore } from '../../store/languageStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';

export const ProductsPage: React.FC = () => {
  const { language } = useLanguageStore();
  const [products, setProducts] = useState<Product[]>(CATALOG_PRODUCTS);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll({ page_size: 200 });
      const items = extractResults<Product>(res.data);
      if (items.length > 0) {
        setProducts(items);
      }
    } catch (err) {
      console.warn('Failed to load products from API, retaining catalog dataset:', err);
    }
  };

  return (
    <div className="min-h-screen bg-lime text-forge text-left">
      {/* Top Banner Bar - Clean layout with NO search button */}
      <div className="bg-brushed-steel text-white border-b-4 border-brand-red py-12 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-medium text-white">
              {language === 'am' ? 'የእኛ ምርቶች' : 'Our Products'}
            </h1>
            <p className="text-sm sm:text-base text-forge-200 max-w-2xl leading-relaxed">
              {language === 'am'
                ? '90 ይፋዊ ሞዴሎች በ18 ምድቦች። የሚፈልጉትን መርጠው ያለ ምንም አካውንት በቀጥታ ትዕዛዝ ማስተላለፍ ይችላሉ።'
                : 'Explore all 90 official catalog models across 18 approved categories. Browse freely and request an instant direct quote with zero account barriers.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="px-3 py-1.5 border border-forge-400 text-forge-200 rounded-sm">
              {language === 'am' ? '18 ይፋዊ ምድቦች' : '18 Official Categories'}
            </span>
            <span className="px-3 py-1.5 bg-brand-red text-white rounded-sm">
              {language === 'am' ? '90 ምርቶች' : '90 Products'}
            </span>
          </div>
        </div>
      </div>

      {/* Complete Workshop Catalog: Wood (50), Metal (15), Hybrid (25) */}
      <WorkshopCatalog products={products} />
    </div>
  );
};
