import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { paymentsApi } from '../../services/api';
import { Payment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await paymentsApi.getAll();
      setPayments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await paymentsApi.verify(id);
      loadPayments();
    } catch (err) {
      alert('Failed to verify payment.');
    }
  };

  if (loading) return <LoadingSpinner text="Loading payment verification ledger..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Payment Transactions & Verification
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Verify Telebirr, CBE Birr, and Bank Transfer references credited toward customer workshop orders.
        </p>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Tx Ref / Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount (ETB)</th>
                <th className="px-4 py-3 text-center">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{p.payment_number}</td>
                  <td className="px-4 py-3 font-mono text-metal-300">{p.order_number}</td>
                  <td className="px-4 py-3 font-semibold text-white">{p.customer?.full_name}</td>
                  <td className="px-4 py-3 uppercase text-[11px]">{p.payment_method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{p.transaction_reference || 'N/A'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">+{p.amount?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-center">
                    {p.status !== 'CONFIRMED' && (
                      <button
                        onClick={() => handleVerify(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded transition-colors"
                      >
                        Verify
                      </button>
                    )}
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
