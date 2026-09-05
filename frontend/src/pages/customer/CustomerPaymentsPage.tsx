import React, { useEffect, useState } from 'react';
import { CreditCard, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { paymentsApi, ordersApi } from '../../services/api';
import { Payment, Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const CustomerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal Form State
  const [selectedOrder, setSelectedOrder] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('TELEBIRR');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        paymentsApi.getAll(),
        ordersApi.getAll()
      ]);
      setPayments(pRes.data.results || pRes.data || []);
      setOrders(oRes.data.results || oRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await paymentsApi.create({
        order: selectedOrder,
        amount: Number(amount),
        payment_method: method,
        transaction_reference: refNumber,
        notes,
      });
      setShowModal(false);
      setSelectedOrder('');
      setAmount('');
      setRefNumber('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit payment receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading payment records..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Payment Records & Receipts
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Verified Telebirr, CBE Birr, and Bank Transfer payments credited to your workshop orders.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Payment Proof</span>
        </button>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="Submit your Telebirr or CBE transaction reference number to credit your active order balance."
          actionText="Submit Payment Proof"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference / TxID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-metal-800 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-metal-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">{p.payment_number}</td>
                    <td className="px-4 py-3 font-mono text-metal-300">{p.order_number}</td>
                    <td className="px-4 py-3 uppercase text-[11px] font-semibold">{p.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-mono text-gray-400">{p.transaction_reference || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">
                      +{p.amount?.toLocaleString()} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Submit Payment Proof */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Submit Payment Transaction Proof"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Select Active Order *</label>
            <select
              required
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            >
              <option value="">-- Choose Order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} (Bal: {(o.total_amount - o.paid_amount).toLocaleString()} ETB)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Amount Paid (ETB) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Payment Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
              >
                <option value="TELEBIRR">Telebirr</option>
                <option value="CBE_BIRR">CBE Birr</option>
                <option value="BANK_TRANSFER">Bank Transfer (Commercial Bank of Ethiopia)</option>
                <option value="CASH">Cash at Bole Arabsa Workshop</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Transaction Ref / SMS Confirmation Code *</label>
            <input
              type="text"
              required
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="e.g. CI87219921 or CBE-TX-99128"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional remarks regarding the transaction..."
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Verifying...' : 'Submit Payment Proof'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
