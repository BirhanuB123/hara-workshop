import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Send, Clock, ShieldCheck, ChevronRight, MessageCircle } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

export const PublicFooter: React.FC = () => {
  const { t, language } = useLanguageStore();

  return (
    <footer className="bg-[#161616] text-stone-300 pt-16 pb-8 border-t border-stone-850 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & Workshop Info */}
          <div className="lg:col-span-2 text-left">
            <Link to="/" className="inline-block mb-4 group">
              <img 
                src="/hara-official-logo.png" 
                alt="HARA WORKSHOP Logo" 
                className="h-20 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </Link>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed max-w-sm">
              {language === 'am'
                ? 'በቦሌ አራብሳ የሚገኝ ዘመናዊ የብረት እና የእንጨት ውጤቶች ማዕከል። ጥራት ያላቸው የእንጨት እቃዎች፣ የብረት አርክቴክቸር እና ቅይጥ ግንባታዎች በአንድ ጥላ ስር።'
                : 'Premier metal fabrication, bespoke hardwood joinery, and hybrid architectural craftsmanship in Bole Arabsa, Addis Ababa. Engineered to your exact specifications.'}
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-3 text-stone-300">
                <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
                <span>{t('navigation.boleLocation')}</span>
              </div>
              <div className="flex items-center space-x-3 text-stone-300">
                <Phone className="w-4 h-4 text-brand-red flex-shrink-0" />
                <a href="tel:+251926629999" className="hover:text-white font-semibold transition-colors">
                  +251 926 629 999
                </a>
              </div>
              <div className="flex items-center space-x-3 text-stone-300">
                <Mail className="w-4 h-4 text-brand-red flex-shrink-0" />
                <a href="mailto:info@haraworkshop.com" className="hover:text-white transition-colors">
                  info@haraworkshop.com
                </a>
              </div>
              <div className="flex items-center space-x-3 text-stone-300">
                <Clock className="w-4 h-4 text-brand-red flex-shrink-0" />
                <span>{language === 'am' ? 'ሰኞ - ቅዳሜ፡ 8:00 AM - 6:00 PM' : 'Mon - Sat: 8:00 AM - 6:00 PM'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-brand-red pl-2">
              {t('common.explore')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {t('navigation.home')}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {t('navigation.products')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {t('navigation.services')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {t('navigation.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {t('navigation.contact')}
                </Link>
              </li>
              <li>
                <Link to="/request-quote" className="text-brand-red font-semibold hover:text-red-400 flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-brand-red" /> {language === 'am' ? 'ትዕዛዝ ይጠይቁ' : 'Request a Project'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Workshop Categories */}
          <div className="text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-brand-red pl-2">
              {language === 'am' ? 'የስራ ዘርፎች' : 'Specialties'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products?service=wood-works" className="hover:text-white text-stone-400 flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {language === 'am' ? 'የእንጨት ስራዎች (10 ክፍሎች)' : 'Wood Works (10 Categories)'}
                </Link>
              </li>
              <li>
                <Link to="/products?service=metal-works" className="hover:text-white text-stone-400 flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {language === 'am' ? 'የብረት ስራዎች (3 ክፍሎች)' : 'Metal Works (3 Categories)'}
                </Link>
              </li>
              <li>
                <Link to="/products?service=hybrid-metal-wood" className="hover:text-white text-stone-400 flex items-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 mr-1 text-stone-600" /> {language === 'am' ? 'ቅይጥ ስራዎች (5 ክፍሎች)' : 'Hybrid Construction (5 Categories)'}
                </Link>
              </li>
              <li className="text-stone-500 pt-2 text-[11px]">Bespoke Architectural Engineering</li>
              <li className="text-stone-500 text-[11px]">Precision Laser Profiling & Joinery</li>
            </ul>
          </div>

          {/* Direct Manager Connect */}
          <div className="text-left">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-brand-red pl-2">
              {language === 'am' ? 'ቀጥታ ግንኙነት' : 'Direct Connect'}
            </h4>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              {language === 'am'
                ? 'የዋርክሾፕ ማናጀራችንን በቴሌግራም ወይም በዋትስአፕ በቀጥታ ያግኙ።'
                : 'Connect directly with Workshop Manager Samuel on Telegram or WhatsApp.'}
            </p>
            <div className="space-y-2 mb-4">
              <a 
                href="https://t.me/Manager_Samuel_A" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center space-x-2 bg-[#229ED9] hover:bg-[#1c8ec4] text-white px-3 py-2 rounded-lg text-xs font-bold transition-all w-full justify-center shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ቴሌግራም፦ @Manager_Samuel_A' : 'Telegram: @Manager_Samuel_A'}</span>
              </a>
              <a 
                href="https://wa.me/251926629999" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center space-x-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-3 py-2 rounded-lg text-xs font-bold transition-all w-full justify-center shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: +251 926 629 999</span>
              </a>
            </div>
            <div className="bg-stone-900 border border-stone-800 p-2.5 rounded-lg text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>TIN Registered & Licensed</span>
              </div>
              <p className="text-[10px] text-stone-400">Official Invoicing with 15% VAT documentation.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} HARA WORKSHOP. All rights reserved. Addis Ababa, Ethiopia.</p>
          <div className="flex items-center space-x-4 text-stone-400 text-xs">
            <span>Metal Works</span>
            <span>•</span>
            <span>Wood Works</span>
            <span>•</span>
            <span>Hybrid Metal + Wood</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
