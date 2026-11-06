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
  ShieldCheck,
  MessageSquare,
  Paperclip,
  FileText,
  FileCode,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { quotesApi } from '../../services/api';
import { Quote } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ImageLightboxModal } from '../../components/common/ImageLightboxModal';
import { getMediaUrl, isImageFile, isCadFile, downloadFile } from '../../utils/media';

export const CustomerQuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);
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
      setTimeout(() => navigate('/customer/orders'), 1500);
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
        to="/customer/quotes"
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
                  {quote.length_cm ? `${quote.length_cm} × ${quote.width_cm} × ${quote.height_cm} cm` : 'As per specifications'}
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

            {/* Attachments Section */}
            <div className="pt-3 border-t border-metal-800 space-y-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 text-xs">
                <Paperclip className="w-3.5 h-3.5 text-brand-red" />
                <span>Submitted Blueprints & Files ({quote.attachments?.length || 0})</span>
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
                  No architectural drawings or reference photos were attached to this quotation request.
                </p>
              )}
            </div>
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

            <div className="pt-3 border-t border-metal-800">
              <Link
                to={`/customer/messages`}
                className="w-full py-2.5 px-3 bg-metal-800 hover:bg-metal-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition border border-metal-700 shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-brand-red" />
                <span>Message Workshop About This Quote</span>
              </Link>
            </div>
          </div>
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
