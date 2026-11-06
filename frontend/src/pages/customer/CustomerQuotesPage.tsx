import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, ArrowRight, Eye, Calendar } from 'lucide-react';
import { quotesApi } from '../../services/api';
import { Quote } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguageStore } from '../../store/languageStore';

export const CustomerQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguageStore();

  useEffect(() => {
    quotesApi.getAll()
      .then(res => setQuotes(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text={t('common.loading')} />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {t('customer.quotesTitle')}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('customer.quotesSubtitle')}
          </p>
        </div>
        <Link
          to="/request-quote"
          className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('customer.newQuoteRequest')}</span>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          title={t('customer.noQuotesTitle')}
          description={t('customer.noQuotesDesc')}
          actionText={t('common.requestQuote')}
          actionLink="/request-quote"
        />
      ) : (
        <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
                <tr>
                  <th className="px-4 py-3">{t('customer.quoteNum')}</th>
                  <th className="px-4 py-3">{t('quote.projectTitle')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('customer.dimensionsQty')}</th>
                  <th className="px-4 py-3 text-right">{t('customer.total')} ({t('common.etb')})</th>
                  <th className="px-4 py-3 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-metal-800 font-medium">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-metal-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {q.quote_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{q.project_title}</div>
                      <span className="text-[10px] text-gray-500">{new Date(q.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {q.length_cm ? `${q.length_cm}×${q.width_cm}×${q.height_cm} cm` : 'Custom Spec'} 
                      <span className="block text-[10px] text-metal-500">Qty: {q.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-red font-mono">
                      {q.total_amount ? `${q.total_amount.toLocaleString()} ${t('common.etb')}` : t('customer.pendingReview')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/customer/quotes/${q.id}`}
                        className="inline-flex items-center space-x-1 bg-metal-800 hover:bg-brand-red text-white px-3 py-1.5 rounded text-[11px] font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('common.viewDetails')}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

