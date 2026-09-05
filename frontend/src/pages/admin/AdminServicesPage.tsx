import React, { useEffect, useState } from 'react';
import { Wrench, PlusCircle } from 'lucide-react';
import { servicesApi } from '../../services/api';
import { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesApi.getAll()
      .then(res => setServices(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading services..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Workshop Capabilities & Services
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Configured fabrication workflows, turnaround baselines, and unit price standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.id} className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-3 shadow-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-bold text-white">{s.title}</h3>
              <span className="text-[10px] bg-metal-800 text-brand-red px-2 py-0.5 rounded font-bold uppercase">
                {s.category_name}
              </span>
            </div>
            <p className="text-xs text-gray-400">{s.short_description}</p>
            <div className="pt-3 border-t border-metal-800 flex justify-between text-xs text-gray-300">
              <span>Turnaround: <strong className="text-white">{s.turnaround_time}</strong></span>
              <span className="font-bold text-brand-red">{s.starting_price?.toLocaleString()} ETB</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
