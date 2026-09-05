import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  FileText, 
  Receipt, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2, 
  Wrench,
  AlertCircle
} from 'lucide-react';
import { quotesApi, ordersApi, invoicesApi } from '../../services/api';
import { Quote, Order, Invoice } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerDashboardPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [qRes, oRes, iRes] = await Promise.all([
          quotesApi.getAll(),
          ordersApi.getAll(),
          invoicesApi.getAll()
        ]);
        setQuotes(qRes.data.results || qRes.data || []);
        setOrders(oRes.data.results || oRes.data || []);
        setInvoices(iRes.data.results || iRes.data || []);
      } catch (err) {
        console.error('Failed to load portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Loading customer hub..." />;

  const activeOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const pendingQuotes = quotes.filter(q => q.status === 'PRICE_PROPOSED' || q.status === 'UNDER_REVIEW' || q.status === 'SUBMITTED');
  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED');

  return (
    <div className="space-y-8 text-left">
      {/* Top Banner Action */}
      <div className="bg-gradient-to-r from-metal-900 to-metal-850 border border-metal-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wide">
            Welcome to Your Workshop Portal
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Track fabrication milestones, inspect itemized quotes, and communicate directly with Bole Arabsa craftsmen.
          </p>
        </div>
        <Link
          to="/request-quote"
          className="inline-flex items-center space-x-2 bg-brand-red hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Quote Request</span>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Active Workshop Orders"
          value={activeOrders.length}
          subtitle="In fabrication or delivery"
          icon={ShoppingBag}
        />
        <StatCard
          title="Quotations in Review"
          value={pendingQuotes.length}
          subtitle="Price proposals awaiting approval"
          icon={FileText}
        />
        <StatCard
          title="Open Invoices"
          value={unpaidInvoices.length}
          subtitle="Awaiting final balance payment"
          icon={Receipt}
        />
      </div>

      {/* Active Orders Section */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-metal-800 pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-brand-red" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Fabrication Orders
            </h3>
          </div>
          <Link to="/portal/orders" className="text-xs text-brand-red font-semibold hover:underline">
            View All Orders →
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            No active fabrication orders at this moment.
          </p>
        ) : (
          <div className="divide-y divide-metal-800">
            {activeOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-bold text-brand-red">{order.order_number}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-gray-300">
                    {order.items.map(i => `${i.quantity}x ${i.item_title}`).join(', ')}
                  </p>
                  {order.production_job && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-[10px] text-metal-400 uppercase">Stage: {order.production_job.stage.replace('_', ' ')}</span>
                      <div className="w-24 bg-metal-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-brand-red h-1.5 rounded-full" 
                          style={{ width: `${order.production_job.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white font-mono">{order.production_job.progress_percentage}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase block">Total</span>
                    <span className="text-xs font-bold text-white">{order.total_amount.toLocaleString()} ETB</span>
                  </div>
                  <Link
                    to={`/portal/orders/${order.id}`}
                    className="p-2 bg-metal-800 hover:bg-brand-red text-white rounded-lg transition-colors text-xs font-semibold"
                  >
                    Track Stages
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Quotes Section */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-metal-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-red" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Quotation Proposals
            </h3>
          </div>
          <Link to="/portal/quotes" className="text-xs text-brand-red font-semibold hover:underline">
            View All Quotes →
          </Link>
        </div>

        {quotes.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            You haven't requested any quotations yet. Click "New Quote Request" to begin!
          </p>
        ) : (
          <div className="divide-y divide-metal-800">
            {quotes.slice(0, 4).map((quote) => (
              <div key={quote.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-bold text-white">{quote.quote_number}</span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <h4 className="text-xs font-bold text-white">{quote.project_title}</h4>
                  <p className="text-[11px] text-gray-400">{quote.material_preference}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase block">Proposed Total</span>
                    <span className="text-xs font-bold text-brand-red">
                      {quote.total_amount ? `${quote.total_amount.toLocaleString()} ETB` : 'Calculating...'}
                    </span>
                  </div>
                  <Link
                    to={`/portal/quotes/${quote.id}`}
                    className="p-2 bg-metal-800 hover:bg-brand-red text-white rounded-lg transition-colors text-xs font-semibold"
                  >
                    View Breakdown
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
