import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Hammer, 
  Wrench, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  Clock, 
  Layers, 
  Compass, 
  Eye, 
  ChevronRight,
  Send
} from 'lucide-react';
import { productsApi, servicesApi, projectsApi } from '../../services/api';
import { Product, Service, Project } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, servRes, projRes] = await Promise.all([
          productsApi.getAll({ is_featured: true }),
          servicesApi.getAll(),
          projectsApi.getAll({ is_featured: true })
        ]);
        setFeaturedProducts((prodRes.data.results || prodRes.data || []).slice(0, 4));
        setServices((servRes.data.results || servRes.data || []).slice(0, 6));
        setFeaturedProjects((projRes.data.results || projRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const workflowSteps = [
    { num: '01', title: 'Consultation & 3D Spec', desc: 'Detailed site measurements, architectural blueprints, and material selection.' },
    { num: '02', title: 'Transparent Itemized Quote', desc: 'Accurate breakdown of raw steel, hardwood lumber, fabrication labor, and installation.' },
    { num: '03', title: '10-Stage Precision Crafting', desc: 'Computerized cutting, TIG/MIG welding, joinery, and anti-corrosion finishing.' },
    { num: '04', title: 'On-Site Delivery & Setup', desc: 'Direct transport from Bole Arabsa workshop and professional installation.' }
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-metal-950 via-metal-900 to-metal-950 pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-metal-800 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2421_1px,transparent_1px),linear-gradient(to_bottom,#1f2421_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 bg-brand-red/10 border border-brand-red/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-red uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Addis Ababa Premier Metal & Wood Solution</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.1]">
                PRECISION <span className="text-brand-red">METALWORK</span> & BESPOKE <span className="text-gray-200">WOODCRAFT</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
                From structural steel frameworks and architectural railings to luxury solid wood furniture and executive office setups. Built with pride in Addis Ababa, Bole Arabsa.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/request-quote"
                  className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold px-7 py-3.5 rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-brand-red/30"
                >
                  <span>Request Custom Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center space-x-2 bg-metal-800 hover:bg-metal-700 text-white font-semibold px-6 py-3.5 rounded-lg text-sm border border-metal-700 transition-all"
                >
                  <span>View Product Catalog</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-metal-800/80 text-left">
                <div>
                  <div className="text-2xl font-black text-white">500+</div>
                  <div className="text-xs text-gray-400">Projects Delivered</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-brand-red">100%</div>
                  <div className="text-xs text-gray-400">Quality Guaranteed</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">10-Stage</div>
                  <div className="text-xs text-gray-400">Production Control</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-metal-700 shadow-2xl bg-metal-900 group flex flex-col items-center">
                <div className="relative w-full bg-gradient-to-b from-metal-900 via-metal-950 to-metal-900 p-8 flex flex-col items-center justify-center">
                  {/* Subtle red ambient glow behind emblem */}
                  <div className="absolute w-56 h-56 rounded-full bg-brand-red/20 blur-3xl group-hover:bg-brand-red/30 transition-all pointer-events-none" />

                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-white p-4 shadow-2xl border-4 border-brand-red flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <img
                      src="/hara-logo-transparent.png"
                      alt="HARA WORKSHOP Official Emblem"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="w-full p-4 sm:p-5 bg-metal-950 border-t border-metal-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-brand-red uppercase tracking-wider block">Official Brand Identity</span>
                    <p className="text-sm font-semibold text-white">Metal and Wood Solution</p>
                    <p className="text-xs text-gray-400">Addis Ababa, Bole Arabsa • +251 926 629 999</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Open Mon - Sat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Capabilities & Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Our Capabilities</span>
          <h2 className="text-3xl font-black text-white uppercase tracking-wide">
            Engineered Metal & Bespoke Wood Solutions
          </h2>
          <p className="text-sm text-gray-400">
            Comprehensive architectural craftsmanship under one roof. We blend industrial steel strength with fine timber aesthetics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-metal-900 border border-metal-800 rounded-xl p-6 hover:border-brand-red/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red mb-5 group-hover:bg-brand-red group-hover:text-white transition-colors">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-metal-400 uppercase tracking-wider block mb-1">
                  {service.category_name}
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-brand-red transition-colors mb-2">
                  {service.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {service.short_description}
                </p>
              </div>

              <div className="pt-4 border-t border-metal-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-metal-500 block">Starting from</span>
                  <span className="text-sm font-bold text-white">
                    {service.starting_price?.toLocaleString()} ETB
                  </span>
                </div>
                <Link
                  to={`/request-quote?service=${encodeURIComponent(service.title)}`}
                  className="inline-flex items-center space-x-1 text-brand-red font-semibold hover:text-red-400"
                >
                  <span>Request</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="bg-metal-900/60 border-y border-metal-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Showroom Showcase</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1">
                Featured Workshop Products
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Built to order or ready for immediate customization and delivery in Addis Ababa.
              </p>
            </div>
            <Link
              to="/products"
              className="mt-4 md:mt-0 inline-flex items-center space-x-1 text-sm font-semibold text-brand-red hover:text-red-400"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-metal-950 border border-metal-800 rounded-xl overflow-hidden hover:border-metal-700 transition-all flex flex-col group"
              >
                <div className="h-48 bg-metal-900 relative overflow-hidden flex items-center justify-center p-4">
                  {product.primary_image ? (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-metal-700 flex flex-col items-center">
                      <Layers className="w-10 h-10 mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Hara Workshop</span>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={product.stock_status} />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-metal-400 block uppercase">
                      {product.category_name}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-brand-red transition-colors line-clamp-1 mt-0.5">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-metal-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase">Base Price</span>
                      <p className="text-sm font-black text-white">
                        {product.starting_price.toLocaleString()} ETB
                      </p>
                    </div>
                    <Link
                      to={`/products/${product.id}`}
                      className="bg-metal-800 hover:bg-brand-red text-white p-2 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10-Stage Workshop Process Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Mastery in Execution</span>
          <h2 className="text-3xl font-black text-white uppercase tracking-wide">
            How We Fabricate Your Vision
          </h2>
          <p className="text-sm text-gray-400">
            From your preliminary concept or sketch to final installation at your site in Addis Ababa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="bg-metal-900/70 border border-metal-800 p-6 rounded-xl relative hover:border-metal-700 transition-all"
            >
              <div className="text-3xl font-black text-brand-red/30 mb-2 font-mono">
                {step.num}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Call to Action / Telegram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-metal-900 via-metal-850 to-metal-900 border border-metal-700 rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4 text-left">
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest">
              Visit or Call Our Workshop
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase leading-tight">
              Ready to build something lasting?
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Get an itemized quotation with materials, labor, transport, and 3D specifications. Visit our workshop at Bole Arabsa near the Water Tanker, or talk to our lead engineers now.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/request-quote"
                className="bg-brand-red hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm uppercase tracking-wider transition-all shadow-md"
              >
                Request Quotation Now
              </Link>
              <a
                href="tel:+251926629999"
                className="inline-flex items-center space-x-2 bg-metal-800 hover:bg-metal-700 text-white font-semibold px-5 py-3 rounded-lg text-sm border border-metal-700 transition-colors"
              >
                <Phone className="w-4 h-4 text-brand-red" />
                <span>+251 926 629 999</span>
              </a>
              <a
                href="https://t.me/haraworkshop"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] font-semibold px-5 py-3 rounded-lg text-sm border border-[#229ED9]/40 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Telegram: @haraworkshop</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
