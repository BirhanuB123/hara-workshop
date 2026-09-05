import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Phone, 
  MapPin, 
  Menu, 
  X, 
  PlusCircle, 
  User, 
  ShieldCheck, 
  Send 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Products', path: '/products' },
    { name: 'Projects', path: '/projects' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-metal-950/95 backdrop-blur-md border-b border-metal-800 select-none">
      {/* Top micro bar with contact info */}
      <div className="bg-black/60 border-b border-metal-900 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              <span>Bole Arabsa, Near Water Tanker, Addis Ababa</span>
            </div>
            <span className="hidden sm:inline text-metal-700">•</span>
            <div className="hidden sm:flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-red" />
              <a href="tel:+251926629999" className="hover:text-white font-medium">+251 926 629 999</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://t.me/haraworkshop" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-1 text-[#229ED9] hover:underline"
            >
              <Send className="w-3 h-3" />
              <span>Telegram: @haraworkshop</span>
            </a>
            <span className="text-metal-700">•</span>
            <span className="text-emerald-400 font-semibold">15% VAT Invoicing Available</span>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/hara-emblem-light.png" 
              alt="HARA WORKSHOP Logo" 
              className="h-11 w-11 object-contain p-1 rounded-xl bg-metal-900 border border-metal-800 shadow-md group-hover:border-brand-red transition-all group-hover:scale-105" 
            />
            <div>
              <span className="text-lg sm:text-xl font-black tracking-wider text-white block uppercase leading-none">
                HARA <span className="text-brand-red">WORKSHOP</span>
              </span>
              <span className="text-[10px] tracking-widest text-metal-400 uppercase font-semibold block mt-1">
                Metal and Wood Solution
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'text-brand-red bg-metal-900'
                      : 'text-gray-300 hover:text-white hover:bg-metal-900/60'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              to="/request-quote"
              className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider transition-colors shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request Quote</span>
            </Link>

            {isAuthenticated ? (
              <Link
                to={user?.role === 'CUSTOMER' ? '/portal' : '/admin'}
                className="inline-flex items-center space-x-1.5 bg-metal-850 hover:bg-metal-800 text-white text-xs font-semibold py-2.5 px-3.5 rounded-lg border border-metal-700 transition-colors"
              >
                <User className="w-4 h-4 text-brand-red" />
                <span>{user?.role === 'CUSTOMER' ? 'My Portal' : 'Admin Hub'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 bg-metal-850 hover:bg-metal-800 text-white text-xs font-semibold py-2.5 px-3.5 rounded-lg border border-metal-700 transition-colors"
              >
                <User className="w-4 h-4 text-metal-400" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              to="/request-quote"
              className="bg-brand-red hover:bg-red-700 text-white text-[11px] font-bold py-1.5 px-2.5 rounded uppercase"
            >
              Quote
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-metal-950 border-b border-metal-800 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider ${
                  isActive ? 'bg-brand-red text-white' : 'text-gray-300 hover:bg-metal-900'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-metal-800 flex flex-col gap-2">
            <Link
              to="/request-quote"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-brand-red text-white text-center py-2.5 rounded-lg font-bold text-xs uppercase"
            >
              Request Custom Quote
            </Link>
            <Link
              to={isAuthenticated ? (user?.role === 'CUSTOMER' ? '/portal' : '/admin') : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-metal-800 text-white text-center py-2.5 rounded-lg font-bold text-xs uppercase border border-metal-700"
            >
              {isAuthenticated ? 'Enter Portal' : 'Sign In / Register'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
