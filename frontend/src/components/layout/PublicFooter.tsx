import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';

export const PublicFooter: React.FC = () => {
  const { t } = useLanguageStore();
  const links = [
    { name: t('navigation.products'), path: '/products' },
    { name: t('navigation.services'), path: '/services' },
    { name: t('navigation.about'), path: '/about' },
    { name: t('navigation.contact'), path: '/contact' },
    { name: t('navigation.requestQuote'), path: '/request-quote' },
  ];
  return (
    <footer className="bg-brushed-steel text-forge-200">
      <div className="h-1 bg-brand-red" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl text-white">Hara Workshop</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-forge-400">{t('home.heroTagline')}</p>
        </div>
        <nav aria-label="Footer" className="space-y-2.5 text-sm">
          {links.map((l) => (
            <Link key={l.path} to={l.path} className="block hover:text-white transition-colors">{l.name}</Link>
          ))}
        </nav>
        <address className="not-italic text-sm space-y-2.5">
          <p>{t('navigation.boleLocation')}</p>
          <a href="tel:+251926629999" className="block text-white font-semibold hover:text-brand-red-light">{t('navigation.phone')}</a>
          <a href="https://t.me/Manager_Samuel_A" target="_blank" rel="noopener noreferrer" className="block hover:text-white">{t('navigation.telegram')}</a>
          <p className="text-forge-400">{t('navigation.vatNotice')}</p>
        </address>
      </div>
      <div className="border-t border-forge-700 py-5 text-center text-xs text-forge-400">
        © {new Date().getFullYear()} Hara Workshop
      </div>
    </footer>
  );
};
