import React, { useEffect, useState } from 'react';
import { TrendingDown, PlusCircle } from 'lucide-react';
import { expensesApi } from '../../services/api';
import { Expense } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [category, setCategory] = useState('RAW_MATERIALS');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [method, setMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const res = await expensesApi.getAll();
      setExpenses(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expensesApi.create({
        category,
        amount: Number(amount),
        description: desc,
        payment_method: method,
        date: new Date().toISOString().split('T')[0],
      });
      setShowModal(false);
      setAmount('');
      setDesc('');
      loadExpenses();
    } catch (err) {
      alert('Failed to log expense.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading workshop expenses..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Workshop Operating Expenses
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Log machinery maintenance, welding gas, diesel generator fuel, cutting consumables, and facility overhead.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">Expense #</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{e.expense_number}</td>
                  <td className="px-4 py-3 uppercase text-[11px] font-semibold text-brand-red">{e.category.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-200">{e.description}</td>
                  <td className="px-4 py-3 uppercase text-[10px]">{e.payment_method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{e.amount?.toLocaleString()} ETB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Workshop Expense">
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="RAW_MATERIALS">Raw Materials Restock</option>
                <option value="EQUIPMENT_MAINTENANCE">Equipment & Welding Machine Maintenance</option>
                <option value="UTILITIES">Electricity & Water</option>
                <option value="TRANSPORT">Diesel & Transport</option>
                <option value="RENT">Workshop Facility Rent</option>
                <option value="MISC">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Amount (ETB) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 8500"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Description / Reason *</label>
            <textarea
              rows={2}
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. 50L Diesel fuel for standby generator during power outage..."
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Recording...' : 'Save Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
