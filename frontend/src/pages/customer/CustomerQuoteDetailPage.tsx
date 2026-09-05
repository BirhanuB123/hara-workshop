import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Layers, 
  AlertCircle,
  Truck,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { quotesApi } from '../../services/api';
import { Quote } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerQuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (id) {
      loadQuote(id);
    }
  }, [id]);

  const loadQuote = async (quoteId: string) => {
    try {
      const res = await quotesApi.getById(quoteId);
      setQuote(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!quote || !window.confirm('Accept this quotation proposal and convert into an active workshop order?')) return;
    setActionLoading(true);
    try {
      const res = await quotesApi.accept(quote.id);
      setFeedbackMsg('Quote proposal accepted! Workshop order has been generated.');
      loadQuote(quote.id);
      setTimeout(() => navigate('/portal/orders'), 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept quote.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!quote || !window.confirm('Are you sure you want to decline this quotation proposal?')) return;
    setActionLoading(true);
    try {
      await quotesApi.reject(quote.id);
      setFeedbackMsg('Quotation declined.');
      loadQuote(quote.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject quote.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading quotation details..." />;
  if (!quote) return <div className="text-white p-8 text-center">Quotation not found.</div>;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <Link
        to="/portal/quotes"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Quotations</span>
      </Link>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="font-mono text-sm font-black text-brand-red">{quote.quote_number}</span>
            <StatusBadge status={quote.status} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            {quote.project_title}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Issued on {new Date(quote.created_at).toLocaleDateString()} • Service Type: {quote.service_type}
          </p>
        </div>

        {quote.status === 'PRICE_PROPOSED' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAcceptProposal}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Proposal</span>
            </button>
            <button
              onClick={handleRejectProposal}
              disabled={actionLoading}
              className="bg-metal-800 hover:bg-red-900/80 text-gray-300 hover:text-red-300 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Itemized Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              Project & Material Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
              <div>
                <span className="text-gray-500 block">Material Preference:</span>
                <span className="font-semibold text-white">{quote.material_preference || 'Standard Specification'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Dimensions:</span>
                <span className="font-semibold text-white">
                  {quote.length_cm ? `${quote.length_cm} × ${quote.width_cm} × ${quote.height_cm} cm` : 'Custom Drawing'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Quantity:</span>
                <span className="font-semibold text-white">{quote.quantity} Unit(s)</span>
              </div>
              <div>
                <span className="text-gray-500 block">Addis Ababa Delivery:</span>
                <span className="font-semibold text-white">{quote.delivery_required ? quote.delivery_address || 'Delivery Included' : 'Customer Pickup'}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-gray-500 block text-xs">Customer Notes & Requirements:</span>
              <p className="text-xs text-gray-300 mt-1 bg-metal-950 p-3 rounded-lg border border-metal-800">
                {quote.description || 'No additional notes provided.'}
              </p>
            </div>

            {quote.workshop_notes && (
              <div className="pt-2">
                <span className="text-brand-red block text-xs font-bold uppercase">Craftsman & Engineering Notes:</span>
                <p className="text-xs text-gray-200 mt-1 bg-metal-950 p-3 rounded-lg border border-brand-red/30">
                  {quote.workshop_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Cost Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
              Itemized Quotation (ETB)
            </h3>

            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Raw Materials:</span>
                <span className="font-mono text-white">{quote.materials_cost?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Workshop Fabrication Labor:</span>
                <span className="font-mono text-white">{quote.labor_cost?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Site Transport:</span>
                <span className="font-mono text-white">{quote.transportation_cost?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Installation & Fitting:</span>
                <span className="font-mono text-white">{quote.installation_cost?.toLocaleString()} ETB</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Special Discount:</span>
                  <span className="font-mono">-{quote.discount?.toLocaleString()} ETB</span>
                </div>
              )}

              <div className="pt-3 border-t border-metal-800 flex justify-between items-baseline">
                <span className="font-black text-white uppercase text-sm">Total Proposal:</span>
                <span className="text-xl font-black text-brand-red font-mono">
                  {quote.total_amount?.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-gray-500 border-t border-metal-800">
              <p>Quote valid for 30 days from date of issue. Inclusive of workshop testing and Bole Arabsa quality inspection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
