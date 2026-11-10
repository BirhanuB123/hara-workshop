import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Phone, 
  MapPin, 
  ShieldCheck
} from 'lucide-react';
import { productsApi, extractResults } from '../../services/api';
import { Product } from '../../types';
import { WorkshopCatalog } from '../../components/products/WorkshopCatalog';
import { useLanguageStore } from '../../store/languageStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';

export const HomePage: React.FC = () => {
  const { t, language } = useLanguageStore();
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
      console.warn('Failed to load products from API on home page, retaining catalog data:', err);
    }
  };

  const handleScrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('products-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900">
      
      {/* ============================================================== */}
      {/* 1. HERO BANNER - WIDE CARPENTRY WORKSHOP PHOTOGRAPHY            */}
      {/* ============================================================== */}
      <section className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-stone-950">
        {/* Background Image with warm workshop overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/backgrounds/bg-wood-craft.jpg"
            alt="HARA WORKSHOP Carpentry & Metal Atelier"
            className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/60" />
        </div>

        {/* Hero Content Box */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
          {/* Subtle Tagline Pill */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300 uppercase tracking-widest shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>HARA WORKSHOP • METAL & WOOD SOLUTION</span>
          </div>

          {/* Headline Matching Visual Reference */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] drop-shadow-md">
            {language === 'am' ? (
              <>
                እንጨትን መቅረጽ። <span className="text-brand-red">ብረትን ማበጀት።</span> <br className="hidden sm:inline" />
                ራዕይዎን መገንባት።
              </>
            ) : (
              <>
                Crafting Wood. <span className="text-brand-red">Shaping Metal.</span> <br className="hidden sm:inline" />
                Building Your Vision.
              </>
            )}
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base lg:text-lg text-stone-200 max-w-3xl mx-auto leading-relaxed drop-shadow">
            {language === 'am'
              ? 'በቦሌ አራብሳ የሚገኝ ዘመናዊ አቴሊየር። ጠንካራ የብረት አርክቴክቸር፣ በእጅ የተሰሩ ምርጥ የእንጨት ውጤቶች እና ውብ የቅይጥ ግንባታዎች በአንድ ጥላ ስር።'
              : 'Architectural structural steel fabrication, mastercrafted solid hardwood joinery, and luxury hybrid furniture crafted with pride at our Bole Arabsa atelier in Addis Ababa.'}
          </p>

          {/* Pill Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleScrollToCatalog}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-brand-red/40 hover:scale-105 active:scale-95"
            >
              <span>{language === 'am' ? 'ምርቶችን ያስሱ' : 'EXPLORE PRODUCTS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/request-quote"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md border border-white/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>{language === 'am' ? 'ትዕዛዝ ይጠይቁ' : 'REQUEST A PROJECT'}</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 max-w-2xl mx-auto grid grid-cols-3 gap-4 border-t border-white/15 text-center text-stone-300">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">90</div>
              <div className="text-[11px] text-stone-300 uppercase tracking-wider font-medium">
                {language === 'am' ? 'ሞዴሎች' : 'Catalog Models'}
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-brand-red">18</div>
              <div className="text-[11px] text-stone-300 uppercase tracking-wider font-medium">
                {language === 'am' ? 'ምድቦች' : 'Categories'}
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-300">100%</div>
              <div className="text-[11px] text-stone-300 uppercase tracking-wider font-medium">
                {language === 'am' ? 'ጥራት ዋስትና' : 'Custom Built'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. MAIN PRODUCT CATALOG (WOOD, METAL, HYBRID)                  */}
      {/* ============================================================== */}
      <WorkshopCatalog products={products} />

      {/* ============================================================== */}
      {/* 3. WORKSHOP FACILITY & LOCATION HIGHLIGHT                       */}
      {/* ============================================================== */}
      <section className="bg-stone-100 py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-200 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex items-start space-x-4">
            <div className="p-3 bg-red-50 text-brand-red rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                {language === 'am' ? 'የወርክሾፑ አድራሻ' : 'Atelier Location'}
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                {t('navigation.boleLocation')}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {language === 'am' ? 'የውሃ ታንከር አካባቢ' : 'Near Water Tanker, Bole Arabsa'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex items-start space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                {language === 'am' ? 'ስልክ እና ግንኙነት' : 'Direct Contacts'}
              </h4>
              <a href="tel:+251926629999" className="text-xs text-stone-800 font-semibold block mt-1 hover:text-brand-red">
                +251 926 629 999
              </a>
              <a 
                href="https://t.me/Manager_Samuel_A" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[11px] text-[#229ED9] hover:underline font-semibold block mt-0.5"
              >
                {language === 'am' ? 'ቴሌግራም፦ @Manager_Samuel_A' : 'Telegram: @Manager_Samuel_A'}
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex items-start space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                {language === 'am' ? 'ህጋዊ ፈቃድ እና ቫት' : 'TIN & 15% VAT'}
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                {language === 'am' ? 'ህጋዊ ደረሰኝ እና የ15% ቫት አገልግሎት' : 'Official Registered Workshop Invoicing'}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {language === 'am' ? 'ለግለሰብ እና ለድርጅቶች' : 'Commercial & Residential Contracts'}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
