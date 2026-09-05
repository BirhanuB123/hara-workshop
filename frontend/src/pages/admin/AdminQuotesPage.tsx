import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, CheckCircle2, Search, Filter } from 'lucide-react';
import { quotesApi } from '../../services/api';
import { Quote } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotesApi.getAll()
      .then(res => setQuotes(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter(q => {
    const matchesSearch = 
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.project_title.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner text="Loading quotations ledger..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Quotation Submissions & Proposals
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Review customer blueprints, calculate materials/labor, and issue legal price proposals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search quote #, customer..."
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
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PRICE_PROPOSED">Price Proposed</option>
            <option value="CUSTOMER_ACCEPTED">Customer Accepted</option>
            <option value="CONVERTED_TO_ORDER">Converted to Order</option>
          </select>
        </div>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Quote #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Project Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Proposed Total (ETB)</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {filtered.map((q) => (
                <tr key={q.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{q.quote_number}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white block">{q.customer?.full_name || 'Guest Client'}</span>
                    <span className="text-[10px] text-gray-500">{q.customer?.phone_number || q.customer?.email}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-200">{q.project_title}</td>
                  <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(q.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">
                    {q.total_amount ? `${q.total_amount.toLocaleString()} ETB` : 'Not Proposed'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/admin/quotes/${q.id}`}
                      className="inline-flex items-center space-x-1 bg-metal-800 hover:bg-brand-red text-white px-3 py-1.5 rounded text-[11px] font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review & Price</span>
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
