import React, { useEffect, useState } from 'react';
import { Tag, PlusCircle } from 'lucide-react';
import { categoriesApi } from '../../services/api';
import { Category } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data.results || res.data || []);
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
      await categoriesApi.create({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        is_active: true,
      });
      setShowModal(false);
      setName('');
      setDescription('');
      loadCategories();
    } catch (err) {
      alert('Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading product categories..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Product Categories
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Organize metal fabrications, wooden furniture, and architectural fittings.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => (
          <div key={c.id} className="bg-metal-900 border border-metal-800 rounded-xl p-5 space-y-2">
            <h3 className="text-base font-bold text-white uppercase">{c.name}</h3>
            <p className="text-xs text-gray-400">{c.description || 'Workshop catalog category'}</p>
            <span className="text-[10px] text-brand-red font-mono font-bold block pt-2">
              Slug: {c.slug}
            </span>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Category">
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metal Gates & Railings"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of products under this category..."
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Creating...' : 'Save Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
