import React, { useEffect, useState } from 'react';
import { Users, Phone, MapPin, Building } from 'lucide-react';
import { accountsApi } from '../../services/api';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getUsers({ role: 'CUSTOMER' })
      .then(res => setCustomers(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading customers CRM..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Customers CRM Directory
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Clients across Addis Ababa requesting metal and wood fabrication projects.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((c) => (
          <div key={c.id} className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-red font-bold text-sm">
                {c.first_name ? c.first_name[0] : 'C'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{c.full_name || 'Customer'}</h3>
                <span className="text-[10px] text-gray-400">{c.email}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-metal-800 space-y-1.5 text-xs text-gray-300">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-brand-red" />
                <span>{c.phone_number || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-metal-500" />
                <span>{c.customer_profile?.address || 'Addis Ababa'}</span>
              </div>
              {c.customer_profile?.company_name && (
                <div className="flex items-center space-x-2">
                  <Building className="w-3.5 h-3.5 text-metal-500" />
                  <span>{c.customer_profile.company_name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
