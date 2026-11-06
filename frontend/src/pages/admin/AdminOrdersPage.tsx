import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Search, Filter, Wrench } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getAll()
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.item_title.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner text="Loading workshop orders..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Customer Fabrication Orders
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor confirmed orders, dispatch to craftsmen, and oversee delivery schedules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search order #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-metal-900 border border-metal-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red w-48 sm:w-60"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-metal-900 border border-metal-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Production Job</th>
                <th className="px-4 py-3 text-right">Order Value (ETB)</th>
                <th className="px-4 py-3">Delivery Location</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white block">{o.customer?.full_name || 'Client'}</span>
                    <span className="text-[10px] text-gray-500">{o.customer?.phone_number}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-200">
                    {o.items.map(i => `${i.quantity}× ${i.item_title}`).join(', ')}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    {o.production_job ? (
                      <div>
                        <span className="font-mono text-brand-red font-bold block">{o.production_job.job_code}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{o.production_job.stage.replace('_', ' ')} ({o.production_job.progress_percentage}%)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500">Not queued</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{o.total_amount?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-gray-300 truncate max-w-[140px]">{o.delivery_city || o.delivery_address || 'Addis Ababa'}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to="/admin/production"
                      className="inline-flex items-center space-x-1 bg-metal-800 hover:bg-brand-red text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Job</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
