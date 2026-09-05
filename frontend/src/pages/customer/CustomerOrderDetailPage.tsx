import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Receipt, Wrench } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      ordersApi.getById(id)
        .then(res => setOrder(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading order milestones..." />;
  if (!order) return <div className="text-white p-8 text-center">Order not found.</div>;

  const stages = [
    'ORDER_CONFIRMED',
    'MATERIAL_PREP',
    'CUTTING',
    'FABRICATION',
    'ASSEMBLY',
    'FINISHING',
    'QUALITY_INSPECTION',
    'READY_FOR_DELIVERY',
    'INSTALLATION',
    'COMPLETED'
  ];

  const currentStageIndex = order.production_job
    ? stages.indexOf(order.production_job.stage)
    : 0;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <Link
        to="/portal/orders"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </Link>

      {/* Header */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="font-mono text-sm font-black text-brand-red">{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            {order.items.map(i => i.item_title).join(', ')}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Confirmed on {new Date(order.created_at).toLocaleDateString()} • Destination: {order.delivery_address || 'Addis Ababa'}
          </p>
        </div>

        <div className="text-right bg-metal-950 px-4 py-2.5 rounded-lg border border-metal-800">
          <span className="text-[10px] text-gray-500 uppercase block">Order Balance</span>
          <span className="text-base font-black text-white">
            {(order.total_amount - order.paid_amount).toLocaleString()} ETB Remaining
          </span>
        </div>
      </div>

      {/* 10-Stage Production Pipeline Tracker */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-metal-800 pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-brand-red" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              10-Stage Workshop Pipeline
            </h3>
          </div>
          {order.production_job && (
            <span className="text-xs font-bold text-brand-red font-mono">
              Overall Progress: {order.production_job.progress_percentage}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {stages.map((stageName, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stageName}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : isCurrent
                    ? 'bg-brand-red/15 border-brand-red text-white shadow-md'
                    : 'bg-metal-950/60 border-metal-800 text-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 text-brand-red animate-spin" />
                  ) : null}
                </div>
                <span className="font-semibold uppercase tracking-tight text-[11px]">
                  {stageName.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items in Order */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
          Order Items & Specifications
        </h3>
        <div className="divide-y divide-metal-800">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white">{item.item_title}</span>
                <span className="text-gray-400 block">{item.description || 'Workshop Custom Fabrication'}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Qty: {item.quantity} × {item.unit_price.toLocaleString()} ETB</span>
                <span className="font-bold text-brand-red font-mono">{item.total_price.toLocaleString()} ETB</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
