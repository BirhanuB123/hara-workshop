import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, Tag, ChevronRight, Check } from 'lucide-react';
import { servicesApi } from '../../services/api';
import { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesApi.getAll()
      .then(res => setServices(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Our Capabilities</span>
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">
          Workshop Fabrication Services
        </h1>
        <p className="text-sm text-gray-400">
          Professional metalwork, custom carpentry, and turn-key structural installations with precise specifications.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading workshop services..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div 
              key={service.id}
              className="bg-metal-900 border border-metal-800 rounded-xl p-6 flex flex-col justify-between hover:border-brand-red/50 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-xs bg-metal-800 text-metal-300 px-2.5 py-1 rounded font-medium border border-metal-700">
                    {service.category_name}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {service.full_description || service.short_description}
                </p>

                <div className="space-y-1.5 text-xs text-gray-300 py-3 border-y border-metal-800/80 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-metal-400" /> Turnaround</span>
                    <span className="font-semibold text-white">{service.turnaround_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center"><Tag className="w-3.5 h-3.5 mr-1 text-metal-400" /> Price Unit</span>
                    <span className="font-semibold text-white">{service.price_unit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Starting from</span>
                  <span className="text-base font-black text-brand-red">
                    {service.starting_price?.toLocaleString()} ETB
                  </span>
                </div>
                <Link
                  to={`/request-quote?service=${encodeURIComponent(service.title)}`}
                  className="inline-flex items-center space-x-1.5 bg-metal-800 hover:bg-brand-red text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                >
                  <span>Request Quote</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
