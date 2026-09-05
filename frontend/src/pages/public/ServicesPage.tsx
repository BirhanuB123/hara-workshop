import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  Clock, 
  Tag, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Hammer,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { servicesApi } from '../../services/api';
import { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// Mapping fallback high-resolution imagery and capabilities for the 3 primary services
const SERVICE_ENHANCEMENTS: Record<string, {
  image: string;
  badge: string;
  icon: any;
  capabilities: string[];
}> = {
  'Metal Works': {
    image: '/images/services/service-metal-works.jpg',
    badge: 'Heavy Fabrication & Welding',
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

// Target list of ONLY the 3 allowed services in exact requested order
const ALLOWED_SERVICES = [
  'Metal Works',
  'Wood Works',
  'Hybrid Metal + Wood Construction'
];

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesApi.getAll()
      .then(res => {
        const rawServices: Service[] = res.data.results || res.data || [];
        // Filter strictly for the 3 requested services and order them
        const filtered = rawServices.filter(s => ALLOWED_SERVICES.includes(s.title));
        
        // If the backend has fewer or different titles, ensure all 3 are represented
        const ordered = ALLOWED_SERVICES.map(title => {
          const match = filtered.find(s => s.title === title);
          if (match) return match;
          // Fallback mock service record if not yet synced in DB
          return {
            id: title.toLowerCase().replace(/\s+/g, '-'),
            title: title,
            category: title,
            category_name: title,
            slug: title.toLowerCase().replace(/\s+/g, '-'),
            short_description: title === 'Metal Works' 
              ? 'Heavy-duty structural steel fabrication, architectural frameworks, and precision welding.'
              : title === 'Wood Works'
              ? 'Bespoke solid hardwood furniture, architectural cabinetry, and luxury timber craftsmanship.'
              : 'Architectural fusion combining structural matte-black steel frameworks with warm, rich solid hardwood.',
            full_description: title === 'Metal Works'
              ? 'Comprehensive industrial metal fabrication engineered with thick-gauge structural steel, anti-corrosive powder coating, and precision laser cutting.'
              : title === 'Wood Works'
              ? 'Master carpentry utilizing seasoned Ethiopian and imported hardwoods with durable satin finishes.'
              : 'Our flagship engineering specialty marrying industrial steel structural integrity with the timeless warmth of natural timber.',
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
        // Fallback to the 3 guaranteed services
        const fallback = ALLOWED_SERVICES.map(title => ({
          id: title.toLowerCase().replace(/\s+/g, '-'),
          title: title,
          category: title,
          category_name: title,
          slug: title.toLowerCase().replace(/\s+/g, '-'),
          short_description: title,
          full_description: title,
          starting_price: title === 'Metal Works' ? 35000 : title === 'Wood Works' ? 45000 : 95000,
          price_unit: 'per project',
          turnaround_time: '1-2 weeks',
          is_active: true,
          image: SERVICE_ENHANCEMENTS[title]?.image,
          created_at: new Date().toISOString(),
        } as Service));
        setServices(fallback);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Top Header & Overview */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-brand-red/10 border border-brand-red/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-red uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core Workshop Specialties</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
          Fabrication & Craftsmanship Services
        </h1>
        <p className="text-base text-gray-300">
          HARA WORKSHOP operates dedicated industrial metal fabrication and master carpentry facilities in Bole Arabsa, delivering three core pillars of engineering excellence.
        </p>
      </div>

      {/* Featured Picture on the Service Page: Active Workshop Atmosphere */}
      <div className="relative rounded-2xl overflow-hidden border border-metal-700 shadow-2xl bg-metal-900 group">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <img 
            src="/images/services/service-hero-workshop.jpg" 
            alt="Hara Workshop - Active Metal and Wood Fabrication Floor" 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-metal-950 via-metal-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-metal-950/80 via-transparent to-metal-950/60" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-brand-red text-white">
                Live Workshop Floor • Bole Arabsa
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                Where Steel Meets Woodcraft
              </h2>
              <p className="text-xs sm:text-sm text-gray-200">
                Full-cycle in-house fabrication: From raw structural beams and seasoned timber boards to finished architectural installations.
              </p>
            </div>

            <div className="hidden md:flex items-center space-x-3 text-xs text-gray-300 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-metal-700">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>10-Stage QA Protocol</span>
              </div>
              <span className="text-metal-600">•</span>
              <span>Mon - Sat 8AM - 6PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Dedicated Service Cards */}
      {loading ? (
        <LoadingSpinner text="Loading workshop services..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {services.map((service, index) => {
            const enhancement = SERVICE_ENHANCEMENTS[service.title] || {
              image: '/images/services/service-metal-works.jpg',
              badge: service.category_name || 'Fabrication',
              icon: Wrench,
              capabilities: []
            };
            const IconComponent = enhancement.icon;

            return (
              <div 
                key={service.id || service.title}
                className="bg-metal-900 border border-metal-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-brand-red/60 transition-all shadow-xl group hover:shadow-2xl hover:shadow-brand-red/10"
              >
                <div>
                  {/* Service Card Visual Picture */}
                  <div className="relative h-56 w-full overflow-hidden bg-metal-950">
                    <img 
                      src={enhancement.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-metal-900 via-transparent to-black/30" />
                    
                    {/* Category / Badge & Number */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/20">
                        {enhancement.badge}
                      </span>
                      <span className="text-sm font-black text-white/80 bg-brand-red/90 px-2.5 py-0.5 rounded-md">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center shadow-lg">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">
                        {service.title}
                      </span>
                    </div>
                  </div>

                  {/* Service Details & Capabilities */}
                  <div className="p-6 space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-brand-red transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed mt-2">
                        {service.full_description || service.short_description}
                      </p>
                    </div>

                    {/* Scope of Capabilities Checklist */}
                    <div className="space-y-2 pt-2 border-t border-metal-800">
                      <span className="text-[11px] font-bold text-metal-300 uppercase tracking-wider block">
                        Included Capabilities:
                      </span>
                      <ul className="space-y-2 text-xs text-gray-300">
                        {enhancement.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-red flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Specifications Micro Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-metal-800 text-xs">
                      <div className="bg-metal-950 p-2.5 rounded-lg border border-metal-800/80">
                        <span className="text-[10px] text-gray-400 uppercase block flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-brand-red" /> Lead Time
                        </span>
                        <span className="font-bold text-white text-xs mt-0.5 block">
                          {service.turnaround_time || '1-2 weeks'}
                        </span>
                      </div>
                      <div className="bg-metal-950 p-2.5 rounded-lg border border-metal-800/80">
                        <span className="text-[10px] text-gray-400 uppercase block flex items-center">
                          <Tag className="w-3 h-3 mr-1 text-brand-red" /> Pricing Model
                        </span>
                        <span className="font-bold text-white text-xs mt-0.5 block">
                          {service.price_unit || 'per project'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Price & CTA */}
                <div className="p-6 pt-0">
                  <div className="p-4 rounded-xl bg-metal-950 border border-metal-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Starting Estimate</span>
                      <span className="text-lg font-black text-brand-red tracking-tight">
                        {Number(service.starting_price || 0).toLocaleString()} <span className="text-xs text-gray-400 font-semibold">ETB</span>
                      </span>
                    </div>
                    <Link
                      to={`/request-quote?service=${encodeURIComponent(service.title)}`}
                      className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider transition-all shadow-md hover:shadow-brand-red/30"
                    >
                      <span>Request Quote</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Consultation Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-metal-900 via-metal-850 to-metal-900 border border-metal-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-left">
          <span className="text-xs font-bold text-brand-red uppercase tracking-wider">Custom Engineering Solutions</span>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase">Need a combined structural quotation?</h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            Our master fabricators and draftsmen provide on-site laser measurements across Addis Ababa. We break down exact material requirements and labor with 15% VAT invoicing.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-4">
          <Link
            to="/request-quote"
            className="inline-flex items-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-lg"
          >
            <span>Request Consultation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="tel:+251926629999"
            className="inline-flex items-center space-x-2 bg-metal-800 hover:bg-metal-700 text-white font-semibold py-3 px-5 rounded-lg text-xs border border-metal-700 transition-colors"
          >
            <span>Call Workshop</span>
          </a>
        </div>
      </div>
    </div>
  );
};
