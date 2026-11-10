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
    <div className="min-h-screen bg-white text-stone-900 text-left">
      {/* Top Banner Bar - Clean layout with NO search button */}
      <div className="bg-[#FAF7F2] border-b border-stone-200 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">
              {language === 'am' ? 'የዎርክሾፕ ውጤቶች ማውጫ' : 'OFFICIAL WORKSHOP CATALOG'}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
              {language === 'am' ? 'የእኛ ምርቶች' : 'Our Products'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              {language === 'am'
                ? '90 ይፋዊ ሞዴሎች በ18 ምድቦች። የሚፈልጉትን መርጠው ያለ ምንም አካውንት በቀጥታ ትዕዛዝ ማስተላለፍ ይችላሉ።'
                : 'Explore all 90 official catalog models across 18 approved categories. Browse freely and request an instant direct quote with zero account barriers.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold text-stone-600">
            <span className="px-3 py-1.5 bg-white border border-stone-200 rounded-full shadow-xs">
              {language === 'am' ? '18 ይፋዊ ምድቦች' : '18 Official Categories'}
            </span>
            <span className="px-3 py-1.5 bg-brand-red/10 text-brand-red font-bold rounded-full">
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
