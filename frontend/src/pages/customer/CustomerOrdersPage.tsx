import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Calendar, Clock, CheckCircle } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getAll()
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Workshop Fabrication Orders
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Follow your projects through our 10-stage fabrication workflow in real-time.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No active orders"
          description="Once your quotation proposal is accepted, your workshop order will appear here with live progress tracking."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-metal-900 border border-metal-800 rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-metal-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-brand-red">{order.order_number}</span>
                  <StatusBadge status={order.status} />
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">
                  {order.items.map(i => i.item_title).join(', ')}
                </h3>

                {order.production_job ? (
                  <div className="bg-metal-950 p-3 rounded-lg border border-metal-800 space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Current Stage:</span>
                      <span className="font-bold text-brand-red uppercase">
                        {order.production_job.stage.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="w-full bg-metal-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-red h-2 rounded-full transition-all duration-500"
                        style={{ width: `${order.production_job.progress_percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Milestone Progress</span>
                      <span className="font-mono font-bold text-white">{order.production_job.progress_percentage}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">Queued for workshop supervisor allocation.</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-metal-800 pt-3 text-gray-300">
                  <div>
                    <span className="text-gray-500 block">Total Amount:</span>
                    <span className="font-bold text-white">{order.total_amount.toLocaleString()} ETB</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Paid Amount:</span>
                    <span className="font-bold text-emerald-400">{order.paid_amount.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/portal/orders/${order.id}`}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-metal-800 hover:bg-brand-red text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect 10-Stage Timeline</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
