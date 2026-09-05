import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { invoicesApi } from '../../services/api';
import { Invoice } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const CustomerInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesApi.getAll()
      .then(res => setInvoices(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading invoices..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Invoices & VAT Documentation
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Official workshop invoices including 15% VAT calculation and payment reconciliations.
        </p>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices issued yet"
          description="Invoices will be automatically issued once quotations are converted into active orders."
        />
      ) : (
        <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">15% VAT</th>
                  <th className="px-4 py-3 text-right">Total (ETB)</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-metal-800 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-metal-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-mono text-metal-300">{inv.order_number}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Upon Delivery'}</td>
                    <td className="px-4 py-3 text-right font-mono">{inv.subtotal?.toLocaleString()} ETB</td>
                    <td className="px-4 py-3 text-right font-mono text-metal-400">{inv.tax_amount?.toLocaleString()} ETB</td>
                    <td className="px-4 py-3 text-right font-bold text-white font-mono">{inv.total_amount?.toLocaleString()} ETB</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-red font-mono">{inv.amount_remaining?.toLocaleString()} ETB</td>
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
