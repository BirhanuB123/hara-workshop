import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Hammer,
  ShieldCheck,
  ArrowRight,
  Phone
} from 'lucide-react';
import { servicesApi, productsApi } from '../../services/api';
import { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useLanguageStore } from '../../store/languageStore';

// Mapping fallback high-resolution imagery and capabilities for the 3 primary services
const SERVICE_ENHANCEMENTS: Record<string, {
  image: string;
  badge: string;
  badgeAm: string;
  icon: any;
  capabilities: string[];
}> = {
  'Metal Works': {
    image: '/images/services/service-metal-works.jpg',
    badge: 'Heavy Fabrication & Welding',
    badgeAm: 'የከባድ ብረት ማምረቻ እና ብየዳ',
    icon: Wrench,
    capabilities: [
      'Structural steel framing & heavy-gauge plate fabrication',
      'High-precision MIG, TIG & arc welding with seamless joints',
      'Automated CNC laser cutting & decorative perforated steel',
      'Weather-resistant electrostatic anti-corrosion powder coating',
      'Villas, commercial facilities, compound security & structural trusses'
    ]
  },
  'Wood Works': {
    image: '/images/services/service-wood-works.jpg',
    badge: 'Artisan Carpentry & Joinery',
    badgeAm: 'የተመረጡ የእንጨት እቃዎች እና የእጅ ጥበብ',
    icon: Hammer,
    capabilities: [
      'Bespoke solid hardwood furniture (Tikur Inchet, Wanza, Teak, Walnut)',
      'Custom modular kitchen suites & walk-in wardrobe cabinetry',
      'Handcrafted executive office desks, boardroom tables & display shelving',
      'Precision mortise-and-tenon structural wood joinery',
      'Multi-coat satin, matte, or high-gloss moisture-resistant lacquer finishes'
    ]
  },
  'Hybrid Metal + Wood Construction': {
    image: '/images/services/service-hybrid-works.jpg',
    badge: 'Architectural Fusion Specialty',
    badgeAm: 'ልዩ የብረት እና የእንጨት ውህደት ስራዎች',
    icon: Layers,
    capabilities: [
      'Architectural floating cantilevered staircases with solid hardwood treads',
      'Heavy structural steel-framed pergolas & outdoor living pavilions',
      'Turnkey cafe, restaurant & modern retail commercial fitouts',
      'Steel-supported hardwood ceilings, wall paneling & mezzanine platforms',
      'Millimeter-precision on-site structural anchoring & lifetime warranty'
    ]
  }
};

export const getServiceSlug = (titleOrSlug: string): string => {
  const s = (titleOrSlug || '').toLowerCase();
  if (
    s.includes('hybrid') ||
    s.includes('ቅይጥ') ||
    (s.includes('metal') && s.includes('wood')) ||
    (s.includes('ብረት') && s.includes('እንጨት'))
  ) {
    return 'hybrid-metal-wood';
  }
  if (s.includes('metal') || s.includes('ብረት')) {
    return 'metal-works';
  }
  if (s.includes('wood') || s.includes('እንጨት')) {
    return 'wood-works';
  }
  return s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Target list of ONLY the 3 allowed services in exact requested order
const ALLOWED_SERVICES = [
  'Metal Works',
  'Wood Works',
  'Hybrid Metal + Wood Construction'
];

export const ServicesPage: React.FC = () => {
  const { t, language, localize } = useLanguageStore();
  const [services, setServices] = useState<Service[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({
    METAL_WORKS: 15,
    WOOD_WORKS: 50,
    HYBRID_METAL_WOOD: 25
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load products count per category
    productsApi.getAll({ page_size: 100 })
      .then(res => {
        const prods = res.data.results || res.data || [];
        const counts: Record<string, number> = {
          METAL_WORKS: 0,
          WOOD_WORKS: 0,
          HYBRID_METAL_WOOD: 0
        };
        prods.forEach((p: any) => {
          const cat = p.service_category || (
            p.category_name?.toLowerCase().includes('metal') ? 'METAL_WORKS' :
            p.category_name?.toLowerCase().includes('wood') ? 'WOOD_WORKS' : 'HYBRID_METAL_WOOD'
          );
          counts[cat] = (counts[cat] || 0) + 1;
        });
        if (counts.METAL_WORKS > 0 || counts.WOOD_WORKS > 0 || counts.HYBRID_METAL_WOOD > 0) {
          setProductCounts(counts);
        }
      })
      .catch(console.error);

    servicesApi.getAll()
      .then(res => {
        const rawServices: Service[] = res.data.results || res.data || [];
        const filtered = rawServices.filter(s => ALLOWED_SERVICES.includes(s.title));
        
        const ordered = ALLOWED_SERVICES.map(title => {
          const match = filtered.find(s => s.title === title);
          const slug = getServiceSlug(match?.slug || title);
          const amharicTitle = title === 'Metal Works' 
            ? 'የብረት ስራዎች' 
            : title === 'Wood Works' 
            ? 'የእንጨት ስራዎች' 
            : 'ቅይጥ የብረት + እንጨት ስራዎች';

          if (match) {
            return {
              ...match,
              title_am: amharicTitle,
              short_description_am: match.short_description_am,
              full_description_am: match.full_description_am,
              slug: slug
            };
          }
          return {
            id: slug,
            title: title,
            title_am: amharicTitle,
            category: title,
            category_name: title,
            slug: slug,
            short_description: title === 'Metal Works' 
              ? 'Heavy-duty structural steel fabrication, architectural frameworks, and precision welding.'
              : title === 'Wood Works'
              ? 'Bespoke solid hardwood furniture, architectural cabinetry, and luxury timber craftsmanship.'
              : 'Architectural fusion combining structural matte-black steel frameworks with warm, rich solid hardwood.',
            short_description_am: title === 'Metal Works'
              ? 'የከባድ ብረት መዋቅራዊ ስራዎች፣ አርክቴክቸራል ማዕቀፎች እና ጥራት ያለው ብየዳ።'
              : title === 'Wood Works'
              ? 'የተመረጡ ጠንካራ የእንጨት እቃዎች፣ ዘመናዊ ካቢኔቶች እና የእጅ ጥበብ ውጤቶች።'
              : 'የጠቆረ ጠንካራ ብረት እና የተፈጥሮ ደረቅ እንጨትን ያጣመረ ውብ አርክቴክቸራል ግንባታ።',
            full_description: title === 'Metal Works'
              ? 'Comprehensive industrial metal fabrication engineered with thick-gauge structural steel, anti-corrosive powder coating, and precision laser cutting.'
              : title === 'Wood Works'
              ? 'Master carpentry utilizing seasoned Ethiopian and imported hardwoods with durable satin finishes.'
              : 'Our flagship engineering specialty marrying industrial steel structural integrity with the timeless warmth of natural timber.',
            full_description_am: title === 'Metal Works'
              ? 'ጥራት ባለው ብረት፣ በዱቄት ቀለም እና በሌዘር መቁረጫ የሚመረቱ ሁሉን አቀፍ የብረት ስራዎች።'
              : title === 'Wood Works'
              ? 'የደረቁ የሀገር ውስጥ እና የውጭ እንጨቶችን በመጠቀም በጥንቃቄ የተሰሩ ውብ የእንጨት እቃዎች።'
              : 'የብረት ጥንካሬን ከተፈጥሮ እንጨት ውበት ጋር በማዋሃድ የተዘጋጀ ልዩ አርክቴክቸራል መፍትሄ።',
            starting_price: title === 'Metal Works' ? 35000 : title === 'Wood Works' ? 45000 : 95000,
            price_unit: 'per project',
            turnaround_time: title === 'Hybrid Metal + Wood Construction' ? '2-3 weeks' : '1-2 weeks',
            is_active: true,
            image: SERVICE_ENHANCEMENTS[title]?.image,
          } as Service;
        });
        
        setServices(ordered);
      })
      .catch((err) => {
        console.error('Failed to fetch services:', err);
        const fallback = ALLOWED_SERVICES.map(title => {
          const slug = getServiceSlug(title);
          const amharicTitle = title === 'Metal Works' 
            ? 'የብረት ስራዎች' 
            : title === 'Wood Works' 
            ? 'የእንጨት ስራዎች' 
            : 'ቅይጥ የብረት + እንጨት ስራዎች';

          return {
            id: slug,
            title: title,
            title_am: amharicTitle,
            category: title,
            category_name: title,
            slug: slug,
            short_description: title,
            full_description: title,
            starting_price: title === 'Metal Works' ? 35000 : title === 'Wood Works' ? 45000 : 95000,
            price_unit: 'per project',
            turnaround_time: '1-2 weeks',
            is_active: true,
            image: SERVICE_ENHANCEMENTS[title]?.image,
            created_at: new Date().toISOString(),
          } as Service;
        });
        setServices(fallback);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 select-none">
      
      {/* 1. Header Banner */}
      <div className="bg-[#FAF7F2] border-b border-stone-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-brand-red/10 border border-brand-red/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-red uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('home.capabilitiesBadge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 uppercase tracking-tight">
            {t('home.capabilitiesTitle')}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            {t('home.capabilitiesSubtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">

        {/* 2. Active Workshop Atmosphere Hero Card (Clean & Bright Image Presentation) */}
        <div className="relative rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm bg-stone-100 group">
          <div className="relative h-72 sm:h-96 w-full overflow-hidden">
            <img 
              src="/images/services/service-hero-workshop.jpg" 
              alt="Hara Workshop - Active Metal and Wood Fabrication Floor" 
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            {/* Reduced, subtle gradient for clear photograph visibility with good contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl text-left">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-red text-white shadow-sm">
                  {t('home.boleArabsaFacility')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide drop-shadow-sm">
                  {language === 'am' ? 'ብረት ከእንጨት ጋር የሚገናኝበት' : 'Where Steel Meets Woodcraft'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-200 drop-shadow-sm leading-relaxed">
                  {language === 'am'
                    ? 'ሙሉ በሙሉ በወርክሾፓችን ውስጥ የሚከናወን ምርት፡ ከጥሬ ብረቶች እና ከደረቁ እንጨቶች ጀምሮ እስከ መጨረሻው ገጠማ ድረስ።'
                    : 'Full-cycle in-house fabrication: From raw structural beams and seasoned timber boards to finished architectural installations.'}
                </p>
              </div>

              <div className="hidden md:flex items-center space-x-3 text-xs text-stone-800 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/60 shadow-md">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('home.trustControl')}</span>
                </div>
                <span className="text-stone-300">•</span>
                <span className="font-medium text-stone-600">{t('common.openMonSat')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. The 3 Primary Service Cards (Light & Warm Design System) */}
        {loading ? (
          <div className="py-16">
            <LoadingSpinner text={t('common.loading')} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {services.map((service, index) => {
              const enhancement = SERVICE_ENHANCEMENTS[service.title] || {
                image: '/images/services/service-metal-works.jpg',
                badge: service.category_name || 'Fabrication',
                badgeAm: 'ማምረቻ',
                icon: Wrench,
                capabilities: []
              };
              const IconComponent = enhancement.icon;

              const serviceSlug = getServiceSlug(service.slug || service.title);
              const detailUrl = `/services/${serviceSlug}`;
              const displayTitle = localize(service, 'title');
              const displayDesc = localize(service, 'short_description') || localize(service, 'full_description');

              const countNum = service.title === 'Metal Works'
                ? (productCounts['METAL_WORKS'] || 15)
                : service.title === 'Wood Works'
                ? (productCounts['WOOD_WORKS'] || 50)
                : (productCounts['HYBRID_METAL_WOOD'] || 25);
              const countStr = `${countNum} ${language === 'am' ? 'ምርቶች ተዘጋጅተዋል' : 'Models Cataloged'}`;

              return (
                <Link 
                  key={service.id || service.title}
                  to={detailUrl}
                  className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-lg hover:border-brand-red/40 group cursor-pointer text-left transform hover:-translate-y-1"
                >
                  <div>
                    {/* Visual Photo Header */}
                    <div className="relative h-60 w-full overflow-hidden bg-stone-100">
                      <img 
                        src={service.primary_image || service.image || enhancement.image} 
                        alt={displayTitle} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-black/20" />
                      
                      {/* Category Badge & Number */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-stone-900 px-3 py-1 rounded-md shadow-xs border border-stone-200">
                          {language === 'am' ? enhancement.badgeAm : enhancement.badge}
                        </span>
                        <span className="text-xs font-black text-white bg-brand-red px-2 py-0.5 rounded shadow-sm">
                          0{index + 1}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-sm">
                          {displayTitle}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight group-hover:text-brand-red transition-colors flex items-center justify-between">
                          <span>{displayTitle}</span>
                          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-2">
                          {displayDesc}
                        </p>
                      </div>

                      {/* Available Products Count Badge */}
                      <div className="pt-1">
                        <div className="inline-flex items-center space-x-2 bg-stone-100 border border-stone-200/80 px-3 py-1.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
                          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                            {countStr}
                          </span>
                        </div>
                      </div>

                      {/* Capabilities Checklist Preview */}
                      <div className="space-y-2 pt-3 border-t border-stone-100">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          {t('services.offeringsBadge')}:
                        </span>
                        <ul className="space-y-1.5 text-xs text-stone-600">
                          {enhancement.capabilities.slice(0, 3).map((cap, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-red flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer CTA Button */}
                  <div className="p-6 pt-0">
                    <div className="w-full py-2.5 px-4 rounded-xl bg-stone-900 group-hover:bg-brand-red text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-between shadow-xs">
                      <span>{t('common.exploreArrow')}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 4. Bottom Consultation & Quote Banner (Warm Ivory / Beige) */}
        <div className="p-8 sm:p-10 rounded-3xl relative overflow-hidden bg-[#FAF7F2] border border-stone-200/90 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs text-left">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold text-brand-red uppercase tracking-wider">
              {t('home.capabilitiesBadge')}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 uppercase">
              {t('services.consultationBannerTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {t('services.consultationBannerDesc')}
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/request-quote"
              className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              <span>{t('common.requestQuote')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="tel:+251926629999"
              className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-stone-50 text-stone-800 font-semibold py-3.5 px-6 rounded-full text-xs border border-stone-300 shadow-xs transition-colors w-full sm:w-auto"
            >
              <Phone className="w-3.5 h-3.5 text-brand-red" />
              <span>+251 926 629 999</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
