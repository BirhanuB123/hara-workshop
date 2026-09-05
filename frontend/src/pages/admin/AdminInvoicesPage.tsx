import React, { useEffect, useState } from 'react';
import { Receipt, Eye } from 'lucide-react';
import { invoicesApi } from '../../services/api';
import { Invoice } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesApi.getAll()
      .then(res => setInvoices(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading invoices ledger..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Invoices & 15% VAT Ledger
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Government compliant 15% VAT invoicing, subtotal calculations, and balance reconciliation.
        </p>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">15% VAT</th>
                <th className="px-4 py-3 text-right">Total (ETB)</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-mono text-metal-300">{inv.order_number}</td>
                  <td className="px-4 py-3 font-semibold text-white">{inv.customer?.full_name || 'Client'}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right font-mono">{inv.subtotal?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-right font-mono text-metal-400">{inv.tax_amount?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{inv.total_amount?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">{inv.amount_remaining?.toLocaleString()} ETB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
