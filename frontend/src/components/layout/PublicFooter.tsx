import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Send, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-metal-950 text-gray-300 pt-16 pb-8 border-t border-metal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & About */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-4 group">
              <img src="/hara-logo-transparent.png" alt="HARA WORKSHOP Logo" className="h-12 w-12 object-contain p-1 rounded-full bg-white border border-brand-red/80 shadow-md group-hover:scale-105 transition-all" />
              <div>
                <span className="text-xl font-bold tracking-wider text-white block uppercase">
                  HARA <span className="text-brand-red">WORKSHOP</span>
                </span>
                <span className="text-xs tracking-widest text-metal-400 uppercase font-medium">
                  Metal and Wood Solution
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-sm">
              Precision engineering, custom metal fabrication, bespoke woodworking, and industrial furniture. 
              Delivering high-end architectural metal & wood solutions across Addis Ababa and beyond.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
                <span>Bole Arabsa, Near Water Tanker, Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="w-4 h-4 text-brand-red flex-shrink-0" />
                <a href="tel:+251926629999" className="hover:text-white font-medium">+251 926 629 999</a>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="w-4 h-4 text-brand-red flex-shrink-0" />
                <a href="mailto:info@haraworkshop.com" className="hover:text-white">info@haraworkshop.com</a>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Clock className="w-4 h-4 text-brand-red flex-shrink-0" />
                <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-l-2 border-brand-red pl-2">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-white flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-metal-500" /> Home</Link></li>
              <li><Link to="/about" className="hover:text-white flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-metal-500" /> About Us</Link></li>
              <li><Link to="/services" className="hover:text-white flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-metal-500" /> Workshop Services</Link></li>
              <li><Link to="/products" className="hover:text-white flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-metal-500" /> Products Catalog</Link></li>
              <li><Link to="/projects" className="hover:text-white flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-metal-500" /> Portfolio & Gallery</Link></li>
              <li><Link to="/request-quote" className="text-brand-red font-medium hover:text-red-400 flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-brand-red" /> Request a Quote</Link></li>
              <li><Link to="/contact" className="hover:text-white flex items-center transition-colors"><ChevronRight className="w-3.5 h-3.5 mr-1 text-metal-500" /> Contact Location</Link></li>
            </ul>
          </div>

          {/* Workshop Services */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-l-2 border-brand-red pl-2">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-gray-400">Custom Metal Gates & Railings</li>
              <li className="text-gray-400">Solid Hardwood Dining Tables</li>
              <li className="text-gray-400">Kitchen Cabinets & Closets</li>
              <li className="text-gray-400">Structural Steel Frameworks</li>
              <li className="text-gray-400">Modern Office Workstations</li>
              <li className="text-gray-400">Laser Cutting & CNC Carving</li>
              <li className="text-gray-400">Professional On-Site Installation</li>
            </ul>
          </div>

          {/* Trust & Social */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 border-l-2 border-brand-red pl-2">
              Direct Connect
            </h4>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Reach our master craftsmen and sales architects directly on Telegram or by phone.
            </p>
            <a 
              href="https://t.me/haraworkshop" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center space-x-2 bg-metal-800 hover:bg-brand-red/90 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-all mb-4 w-full justify-center border border-metal-700 hover:border-brand-red shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Telegram Channel</span>
            </a>
            <div className="bg-metal-900 border border-metal-800 p-3 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Licensed & Insured Workshop</span>
              </div>
              <p className="text-metal-400">TIN Registered • Official Invoicing with 15% VAT support.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-metal-900 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} HARA WORKSHOP. All rights reserved. Addis Ababa, Ethiopia.</p>
          <div className="flex items-center space-x-6">
            <span>Metal & Wood Solutions</span>
            <span>•</span>
            <span>Quality Craftsmen</span>
            <span>•</span>
            <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
