import React, { useEffect, useState } from 'react';
import { Boxes, PlusCircle, AlertTriangle, ArrowUpDown, Search } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { Material } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminInventoryPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Transaction form
  const [txType, setTxType] = useState('PURCHASE');
  const [txQuantity, setTxQuantity] = useState('');
  const [txUnitCost, setTxUnitCost] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New material form
  const [matSku, setMatSku] = useState('');
  const [matName, setMatName] = useState('');
  const [matCat, setMatCat] = useState('STEEL');
  const [matUnit, setMatUnit] = useState('PCS');
  const [matStock, setMatStock] = useState('10');
  const [matMinStock, setMatMinStock] = useState('5');
  const [matCost, setMatCost] = useState('1000');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const res = await inventoryApi.getAll();
      setMaterials(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openTransaction = (mat: Material) => {
    setSelectedMaterial(mat);
    setTxQuantity('');
    setTxUnitCost(String(mat.unit_cost || ''));
    setTxNotes('');
    setShowTransactionModal(true);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setSubmitting(true);
    try {
      await inventoryApi.createTransaction({
        material: selectedMaterial.id,
        transaction_type: txType,
        quantity: Number(txQuantity),
        unit_cost: Number(txUnitCost),
        notes: txNotes,
      });
      setShowTransactionModal(false);
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record stock transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryApi.create({
        sku: matSku,
        name: matName,
        category: matCat,
        unit: matUnit,
        current_stock: Number(matStock),
        minimum_stock: Number(matMinStock),
        unit_cost: Number(matCost),
        location: 'Bole Arabsa Workshop Aisle 1',
      });
      setShowAddMaterialModal(false);
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add material.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.sku.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading raw materials inventory..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Raw Materials & Workshop Inventory
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Track mild steel tubes, hardwood boards, hinges, fasteners, and automated low-stock warnings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search material or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-metal-900 border border-metal-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red w-48"
          />
          <button
            onClick={() => setShowAddMaterialModal(true)}
            className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Material Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3 text-right">Unit Cost (ETB)</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{m.sku}</td>
                  <td className="px-4 py-3 font-semibold text-white">{m.name}</td>
                  <td className="px-4 py-3 uppercase text-[11px] text-metal-400">{m.category}</td>
                  <td className="px-4 py-3 text-gray-400">{m.location}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                      m.is_low_stock 
                        ? 'bg-red-900/40 text-red-300 border border-red-700/50' 
                        : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {m.current_stock} {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-200">
                    {m.unit_cost?.toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openTransaction(m)}
                      className="inline-flex items-center space-x-1 bg-metal-800 hover:bg-brand-red text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Transact</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title={`Record Stock Transaction: ${selectedMaterial?.name}`}
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Transaction Type *</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-semibold"
              >
                <option value="PURCHASE">Purchase (+ Stock In)</option>
                <option value="CONSUMPTION">Workshop Consumption (- Stock Out)</option>
                <option value="ADJUSTMENT">Inventory Adjustment (Correction)</option>
                <option value="RETURN">Customer Return (+ Stock In)</option>
                <option value="WASTE">Scrap / Waste (- Stock Out)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Quantity ({selectedMaterial?.unit}) *</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                value={txQuantity}
                onChange={(e) => setTxQuantity(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Unit Cost (ETB)</label>
            <input
              type="number"
              min="0"
              value={txUnitCost}
              onChange={(e) => setTxUnitCost(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Transaction Remarks</label>
            <input
              type="text"
              value={txNotes}
              onChange={(e) => setTxNotes(e.target.value)}
              placeholder="e.g. Issued for Order HW-2026-0001 gate fabrication..."
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Updating...' : 'Post Inventory Transaction'}
          </button>
        </form>
      </Modal>

      {/* Add Material Modal */}
      <Modal
        isOpen={showAddMaterialModal}
        onClose={() => setShowAddMaterialModal(false)}
        title="Register New Raw Material"
      >
        <form onSubmit={handleCreateMaterial} className="space-y-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Material SKU *</label>
              <input
                type="text"
                required
                value={matSku}
                onChange={(e) => setMatSku(e.target.value)}
                placeholder="e.g. STL-RHS-8040"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Category *</label>
              <select
                value={matCat}
                onChange={(e) => setMatCat(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="STEEL">Steel & Metals</option>
                <option value="WOOD">Hardwood & Timber</option>
                <option value="HARDWARE">Hardware & Fittings</option>
                <option value="FINISHING">Paints & Chemicals</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Material Name & Spec *</label>
            <input
              type="text"
              required
              value={matName}
              onChange={(e) => setMatName(e.target.value)}
              placeholder="e.g. 80x40x2.0mm Rectangular Hollow Section"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Unit *</label>
              <input
                type="text"
                required
                value={matUnit}
                onChange={(e) => setMatUnit(e.target.value)}
                placeholder="PCS / KG / MTR"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Initial Stock</label>
              <input
                type="number"
                value={matStock}
                onChange={(e) => setMatStock(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Min. Threshold</label>
              <input
                type="number"
                value={matMinStock}
                onChange={(e) => setMatMinStock(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Unit Cost (ETB) *</label>
            <input
              type="number"
              required
              value={matCost}
              onChange={(e) => setMatCost(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Registering...' : 'Add to Inventory'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
