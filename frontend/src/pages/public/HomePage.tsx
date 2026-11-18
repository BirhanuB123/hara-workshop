import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import { productsApi, extractResults } from '../../services/api';
import { Product } from '../../types';
import { WorkshopCatalog } from '../../components/products/WorkshopCatalog';
import { useLanguageStore } from '../../store/languageStore';
import { CATALOG_PRODUCTS } from '../../data/catalogProducts';

export const HomePage: React.FC = () => {
  const { t, language } = useLanguageStore();
  const [products, setProducts] = useState<Product[]>(CATALOG_PRODUCTS);

  useEffect(() => {
    (async () => {
      try {
        const res = await productsApi.getAll({ page_size: 200 });
        const items = extractResults<Product>(res.data);
        if (items.length > 0) setProducts(items);
      } catch (err) {
        console.warn('Failed to load products from API, keeping catalog data:', err);
      }
    })();
  }, []);

  const steps = [1, 2, 3, 4].map((n) => ({
    title: t(`home.step${n}Title`),
    desc: t(`home.step${n}Desc`),
  }));

  return (
    <div>
      {/* Hero: steel meets timber along a single red seam */}
      <section className="relative grid lg:grid-cols-2 min-h-[600px] lg:min-h-[680px]">
        <div className="bg-brushed-steel text-white flex items-center px-6 sm:px-12 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16 py-16 order-2 lg:order-1">
          <div className="max-w-xl">
            <p className="text-sm text-forge-200">{t('home.heroTagline')}</p>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.6rem] font-medium leading-[1.08]">
              {t('home.heroHeadline')}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-forge-200 max-w-md">{t('home.heroSubtext')}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/request-quote" className="bg-brand-red hover:bg-brand-red-light text-white font-semibold px-7 py-3.5 rounded-sm transition-colors">
                {t('home.heroCtaQuote')}
              </Link>
              <Link to="/products" className="border border-forge-400 hover:border-white text-white font-semibold px-7 py-3.5 rounded-sm transition-colors">
                {t('home.heroCtaExplore')}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative order-1 lg:order-2 min-h-[280px]">
          <img src="/images/backgrounds/bg-wood-craft.jpg" alt="Hara Workshop carpentry and metal atelier"
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-timber/30" />
        </div>
        {/* The seam: one orchestrated load moment */}
        <span aria-hidden className="hidden lg:block absolute top-0 bottom-0 left-1/2 -ml-[2px] w-1 bg-brand-red origin-top animate-seam" />
      </section>

      {/* Trust facts, stated plainly */}
      <section className="bg-forge text-forge-200 border-t border-forge-700">
        <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid sm:grid-cols-3 gap-3 text-sm">
          <li>{t('home.trustProjects')}</li>
          <li>{t('home.trustQuality')}</li>
          <li>{t('home.trustControl')}</li>
        </ul>
      </section>

      {/* Two materials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-medium">{t('home.capabilitiesTitle')}</h2>
          <p className="mt-4 text-forge-700 leading-relaxed">{t('home.capabilitiesSubtitle')}</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {[
            { img: '/images/categories/cover-metal-gates.jpg', to: '/services', label: language === 'am' ? 'ብረት' : 'Metal', tone: 'bg-forge' },
            { img: '/images/categories/cover-wooden-doors.jpg', to: '/products', label: language === 'am' ? 'እንጨት' : 'Wood', tone: 'bg-timber' },
          ].map((m) => (
            <Link key={m.label} to={m.to} className="group relative block aspect-[4/3] overflow-hidden rounded-sm">
              <img src={m.img} alt={m.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              <div className={`absolute inset-x-0 bottom-0 ${m.tone} px-6 py-5`}>
                <span className="font-display text-3xl text-white">{m.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Workflow: a genuine sequence, so numbered */}
      <section className="bg-lime-50 border-y border-lime-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-medium max-w-2xl">{t('home.workflowTitle')}</h2>
          <p className="mt-4 text-forge-700 max-w-xl">{t('home.workflowSubtitle')}</p>
          <ol className="mt-12 grid md:grid-cols-4 gap-x-8 gap-y-10 border-t-2 border-forge pt-8">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="font-display text-4xl text-brand-red">{i + 1}</span>
                <h3 className="mt-3 text-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forge-700">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <WorkshopCatalog products={products} />

      {/* Visit */}
      <section className="bg-timber text-timber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="font-display text-3xl text-white">{t('home.boleArabsaFacility')}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm"><MapPin className="w-4 h-4" /> {t('navigation.boleLocation')}</p>
            <a href="tel:+251926629999" className="mt-1 flex items-center gap-2 text-sm hover:text-white"><Phone className="w-4 h-4" /> {t('navigation.phone')}</a>
          </div>
          <Link to="/request-quote" className="self-start md:self-auto bg-brand-red hover:bg-brand-red-light text-white font-semibold px-7 py-3.5 rounded-sm transition-colors">
            {t('home.heroCtaQuote')}
          </Link>
        </div>
      </section>
    </div>
  );
};
