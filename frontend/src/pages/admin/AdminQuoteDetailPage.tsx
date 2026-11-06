import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  DollarSign, 
  ShoppingBag, 
  Send, 
  AlertCircle, 
  MessageSquare,
  Paperclip,
  FileText,
  FileCode,
  Download,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { quotesApi } from '../../services/api';
import { Quote } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ImageLightboxModal } from '../../components/common/ImageLightboxModal';
import { getMediaUrl, isImageFile, isCadFile, downloadFile } from '../../utils/media';

export const AdminQuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Proposal form state
  const [materialsCost, setMaterialsCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [installCost, setInstallCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (id) {
      quotesApi.getById(id)
        .then(res => {
          const q = res.data;
          setQuote(q);
          setMaterialsCost(q.materials_cost || 0);
          setLaborCost(q.labor_cost || 0);
          setTransportCost(q.transportation_cost || 0);
          setInstallCost(q.installation_cost || 0);
          setDiscount(q.discount || 0);
          setNotes(q.workshop_notes || '');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const subtotal = materialsCost + laborCost + transportCost + installCost;
  const grandTotal = Math.max(0, subtotal - discount);

  const handleProposePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setSaving(true);
    try {
      await quotesApi.proposePrice(quote.id, {
        materials_cost: materialsCost,
        labor_cost: laborCost,
        transportation_cost: transportCost,
        installation_cost: installCost,
        discount,
        workshop_notes: notes,
      });
      setMsg('Price proposal submitted successfully to customer!');
      const updated = await quotesApi.getById(quote.id);
      setQuote(updated.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit price proposal.');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!quote || !window.confirm('Convert this quotation directly into a confirmed production order?')) return;
    setSaving(true);
    try {
      await quotesApi.convertToOrder(quote.id);
      setMsg('Quote converted to active order! Redirecting to orders ledger...');
      setTimeout(() => navigate('/admin/orders'), 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to convert quote.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading quotation proposal engine..." />;
  if (!quote) return <div className="text-white p-8 text-center">Quote not found.</div>;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <Link
        to="/admin/quotes"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Quotations Ledger</span>
      </Link>

      {msg && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
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
            Customer: {quote.customer?.full_name || 'Guest Client'} • {quote.customer?.phone_number || quote.customer?.email}
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Link
            to="/admin/messages"
            className="px-3 py-2.5 bg-metal-800 hover:bg-metal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-metal-700 shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-brand-red" />
            <span>Message Customer</span>
          </Link>

          {quote.status !== 'CONVERTED_TO_ORDER' && (
            <button
              type="button"
              onClick={handleConvertToOrder}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider flex items-center space-x-2 shadow-md flex-shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Convert to Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
            Client Specifications & Dimensions
          </h3>
          <div className="grid grid-cols-2 gap-3 text-gray-300">
            <div><span className="text-gray-500">Service:</span> <span className="font-bold text-white">{quote.service_type}</span></div>
            <div><span className="text-gray-500">Quantity:</span> <span className="font-bold text-white">{quote.quantity}</span></div>
            <div><span className="text-gray-500">Material:</span> <span className="font-bold text-white">{quote.material_preference}</span></div>
            {Boolean(quote.length_cm || quote.width_cm || quote.height_cm) && (
              <div>
                <span className="text-gray-500">Dimensions:</span>
                <span className="font-bold text-white"> {quote.length_cm}×{quote.width_cm}×{quote.height_cm} cm</span>
              </div>
            )}
            <div><span className="text-gray-500">Delivery:</span> <span className="font-bold text-white">{quote.delivery_required ? 'Required' : 'No'}</span></div>
            <div><span className="text-gray-500">Installation:</span> <span className="font-bold text-white">{quote.installation_required ? 'Required' : 'No'}</span></div>
          </div>
          <div>
            <span className="text-gray-500 block">Site / Delivery Address:</span>
            <p className="text-white mt-0.5">{quote.delivery_address || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-gray-500 block">Description & Client Requirements:</span>
            <p className="bg-metal-950 p-3 rounded-lg border border-metal-800 text-gray-200 mt-1">
              {quote.description || 'No additional remarks'}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="pt-3 border-t border-metal-800 space-y-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-brand-red" />
              <span>Attached Blueprints & Files ({quote.attachments?.length || 0})</span>
            </span>
            {quote.attachments && quote.attachments.length > 0 ? (
              <div className="space-y-2">
                  {quote.attachments.map((att) => {
                    const isImg = isImageFile(att.file_name || att.file);
                    const isCad = isCadFile(att.file_name || att.file);
                    const mediaUrl = getMediaUrl(att.file);

                    return (
                      <div
                        key={att.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-metal-950 border border-metal-800 rounded-lg hover:border-metal-700 transition gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          {isImg ? (
                            <div
                              onClick={() => setLightboxImage({ url: att.file, title: att.file_name })}
                              className="w-12 h-12 rounded-lg bg-black/40 border border-metal-700 overflow-hidden flex-shrink-0 cursor-pointer group relative"
                              title="Click to preview image"
                            >
                              <img
                                src={mediaUrl}
                                alt={att.file_name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : isCad ? (
                            <div className="w-12 h-12 rounded-lg bg-metal-900 border border-metal-800 flex items-center justify-center flex-shrink-0">
                              <FileCode className="w-6 h-6 text-brand-red" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-metal-900 border border-metal-800 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-brand-red" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p
                              onClick={() => {
                                if (isImg) {
                                  setLightboxImage({ url: att.file, title: att.file_name });
                                } else {
                                  downloadFile(att.file, att.file_name);
                                }
                              }}
                              className="text-white font-mono text-xs truncate cursor-pointer hover:text-brand-red transition-colors"
                              title={att.file_name}
                            >
                              {att.file_name || 'Attached Document'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {att.created_at && (
                                <span className="text-[10px] text-gray-500">
                                  Uploaded {new Date(att.created_at).toLocaleDateString()}
                                </span>
                              )}
                              {isImg && (
                                <span className="text-[10px] text-brand-red font-semibold uppercase tracking-wider">
                                  Image
                                </span>
                              )}
                              {isCad && (
                                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                                  CAD Drawing
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                          {isImg && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: att.file, title: att.file_name })}
                              className="inline-flex items-center space-x-1 bg-metal-800 hover:bg-metal-700 text-gray-200 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors"
                              title="Preview full size"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => downloadFile(att.file, att.file_name)}
                            className="inline-flex items-center space-x-1 bg-brand-red hover:bg-red-700 text-white px-2.5 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic bg-metal-950/50 p-2.5 rounded-lg border border-metal-850">
                No blueprints or CAD files uploaded by client.
              </p>
            )}
          </div>
        </div>

        {/* Pricing Proposal Form */}
        <div className="lg:col-span-6 bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-metal-800 pb-2">
            Price Proposal Calculator (ETB)
          </h3>

          <form onSubmit={handleProposePrice} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Raw Materials Cost (ETB) *</label>
                <input
                  type="number"
                  min="0"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Fabrication Labor Cost (ETB) *</label>
                <input
                  type="number"
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Transport Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Site Installation Cost (ETB)</label>
                <input
                  type="number"
                  min="0"
                  value={installCost}
                  onChange={(e) => setInstallCost(Number(e.target.value))}
                  className="w-full bg-metal-950 border border-metal-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Special Discount (ETB)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full bg-metal-950 border border-metal-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Workshop Notes for Proposal</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details of steel gauge, wood seasoning, delivery timeline..."
                className="w-full bg-metal-950 border border-metal-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="bg-metal-950 p-3 rounded-lg border border-metal-800 flex justify-between items-baseline pt-3">
              <span className="font-bold text-white uppercase text-xs">Calculated Grand Total:</span>
              <span className="text-xl font-black text-brand-red font-mono">
                {grandTotal.toLocaleString()} ETB
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Publishing Proposal...' : 'Issue Official Price Proposal'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Full-Screen Image Lightbox Preview Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || ''}
        title={lightboxImage?.title}
      />
    </div>
  );
};
