import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const PublicNavbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguageStore();

  const links = [
    { name: t('navigation.home'), path: '/' },
    { name: t('navigation.products'), path: '/products' },
    { name: t('navigation.services'), path: '/services' },
    { name: t('navigation.about'), path: '/about' },
    { name: t('navigation.contact'), path: '/contact' },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `py-1 text-[15px] font-medium border-b-2 transition-colors ${
      isActive ? 'border-brand-red text-forge' : 'border-transparent text-forge-700 hover:text-forge'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-lime/95 backdrop-blur border-b border-lime-300">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-semibold tracking-tight">Hara</span>
          <span className="text-xs text-forge-400 hidden sm:inline">{t('home.heroTagline')}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.path} to={l.path} end={l.path === '/'} className={linkClass}>
              {l.name}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-5">
          <a href="tel:+251926629999" className="flex items-center gap-2 text-sm text-forge-700 hover:text-brand-red">
            <Phone className="w-4 h-4" /> {t('navigation.phone')}
          </a>
          <LanguageSwitcher variant="inline" />
          <Link to="/request-quote" className="bg-brand-red hover:bg-brand-red-dark text-white text-sm font-semibold px-5 py-2.5 rounded-sm transition-colors">
            {t('navigation.requestQuote')}
          </Link>
        </div>

        <button className="lg:hidden p-2 -mr-2" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-lime-300 bg-lime px-4 py-5 space-y-1">
          {links.map((l) => (
            <NavLink key={l.path} to={l.path} end={l.path === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `block py-3 text-lg font-display ${isActive ? 'text-brand-red' : ''}`}>
              {l.name}
            </NavLink>
          ))}
          <div className="pt-4 flex items-center justify-between">
            <LanguageSwitcher variant="inline" />
            <Link to="/request-quote" onClick={() => setOpen(false)} className="bg-brand-red text-white text-sm font-semibold px-5 py-2.5 rounded-sm">
              {t('navigation.requestQuote')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
