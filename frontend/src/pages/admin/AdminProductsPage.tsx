import React, { useEffect, useState } from 'react';
import { Package, PlusCircle, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { productsApi, categoriesApi } from '../../services/api';
import { Product, Category } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('SET');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll()
      ]);
      setProducts(pRes.data.results || pRes.data || []);
      const cats = cRes.data.results || cRes.data || [];
      setCategories(cats);
      if (cats.length > 0 && !category) setCategory(cats[0].id);
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
      await productsApi.create({
        name,
        sku,
        category,
        description,
        material,
        starting_price: Number(price),
        unit,
        stock_status: 'MADE_TO_ORDER',
        is_customizable: true,
      });
      setShowModal(false);
      setName('');
      setSku('');
      loadData();
    } catch (err) {
      alert('Failed to register product.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading products catalog..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Showroom & Products Catalog
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage standard furniture models, custom gates, and base prices in ETB.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-metal-900 border border-metal-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red w-48"
          />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-metal-950 text-[10px] uppercase font-bold text-metal-400 tracking-wider border-b border-metal-800">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Base Price (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-metal-800 font-medium">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-metal-850/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{p.sku}</td>
                  <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                  <td className="px-4 py-3 uppercase text-[11px] text-metal-400">{p.category_name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.material}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.stock_status} /></td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">
                    {p.starting_price?.toLocaleString()} ETB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register New Showroom Product">
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Product SKU *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. HW-TBL-005"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Solid Mahogany Boardroom Table"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Primary Material *</label>
              <input
                type="text"
                required
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Solid Mahogany, Steel base"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Starting Price (ETB) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 45000"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifications, finish coats, seating capacity..."
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Saving...' : 'Add to Catalog'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
