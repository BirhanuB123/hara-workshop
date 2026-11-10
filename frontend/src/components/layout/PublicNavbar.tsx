import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Phone, 
  MapPin, 
  Menu, 
  X, 
  PlusCircle, 
  Send
} from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useLanguageStore();

  const navLinks = [
    { name: t('navigation.home'), path: '/' },
    { name: t('navigation.products'), path: '/products' },
    { name: t('navigation.services'), path: '/services' },
    { name: t('navigation.about'), path: '/about' },
    { name: t('navigation.contact'), path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-colors">
      {/* Top micro bar with contact info & language selector */}
      <div className="bg-[#F8F5EE] border-b border-stone-200/80 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
              <span>{t('navigation.boleLocation')}</span>
            </div>
            <span className="hidden sm:inline text-stone-300">•</span>
            <div className="hidden sm:flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
              <a href="tel:+251926629999" className="hover:text-brand-red font-semibold text-stone-800 transition-colors">
                +251 926 629 999
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://t.me/Manager_Samuel_A" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-1.5 text-[#229ED9] hover:underline font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ቴሌግራም፦ @Manager_Samuel_A' : 'Telegram: @Manager_Samuel_A'}</span>
            </a>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-700 font-semibold">{t('navigation.vatNotice')}</span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <div className="hidden sm:block">
              <LanguageSwitcher variant="inline" />
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/hara-official-logo.png" 
              alt="HARA WORKSHOP Logo" 
              className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
            <div className="text-left">
              <span className="text-lg sm:text-xl font-black tracking-wider text-stone-900 block uppercase leading-none">
                HARA <span className="text-brand-red">WORKSHOP</span>
              </span>
              <span className="text-[10px] tracking-wider text-stone-500 uppercase font-semibold block mt-1">
                Metal and Wood Solution
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Centered) */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `relative py-2 text-sm font-bold tracking-wide transition-colors ${
                    isActive
                      ? 'text-brand-red after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-brand-red after:rounded-full'
                      : 'text-stone-700 hover:text-stone-950'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="hidden sm:flex items-center space-x-4">
            {/* Language Switcher on mobile/medium screens */}
            <div className="lg:hidden">
              <LanguageSwitcher variant="inline" />
            </div>

            {/* Direct Request CTA Button */}
            <Link
              to="/request-quote"
              className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-full uppercase tracking-wider transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ትዕዛዝ ይጠይቁ' : 'Request a Project'}</span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <Link
              to="/request-quote"
              className="inline-flex items-center bg-brand-red text-white text-xs font-bold py-1.5 px-3 rounded-full uppercase tracking-wider shadow-sm"
            >
              <span>{language === 'am' ? 'ትዕዛዝ' : 'Order'}</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-200 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-4 shadow-lg text-left">
          <div className="py-2 border-b border-stone-100 flex items-center justify-between">
            <LanguageSwitcher variant="inline" />
            <a 
              href="tel:+251926629999" 
              className="text-xs font-bold text-brand-red flex items-center space-x-1"
            >
              <Phone className="w-3 h-3" />
              <span>+251 926 629 999</span>
            </a>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors ${
                    isActive
                      ? 'text-brand-red bg-red-50'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100 space-y-2">
            <Link
              to="/request-quote"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full text-xs uppercase tracking-wider shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'am' ? 'ትዕዛዝ ይጠይቁ' : 'Request a Project'}</span>
            </Link>

            <a
              href="https://t.me/Manager_Samuel_A"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full bg-[#1F2730] hover:bg-[#283543] text-[#4db3f0] hover:text-white font-semibold py-2.5 px-4 rounded-lg text-xs border border-[#2E3C4B]"
            >
              <Send className="w-4 h-4 text-[#229ED9]" />
              <span>{language === 'am' ? 'ቴሌግራም፦ @Manager_Samuel_A' : 'Telegram: @Manager_Samuel_A'}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
