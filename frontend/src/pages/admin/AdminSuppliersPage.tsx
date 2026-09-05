import React, { useEffect, useState } from 'react';
import { Truck, PlusCircle, Phone, Mail, MapPin } from 'lucide-react';
import { suppliersApi } from '../../services/api';
import { Supplier } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Add form
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [materials, setMaterials] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await suppliersApi.getAll();
      setSuppliers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await suppliersApi.create({
        name,
        contact_person: contactPerson,
        phone,
        email,
        address,
        materials_supplied: materials,
      });
      setShowModal(false);
      setName('');
      setPhone('');
      loadSuppliers();
    } catch (err) {
      alert('Failed to register supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading suppliers registry..." />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Material Suppliers Registry
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage steel tube importers, lumber sawmills, and hardware distributors.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 hover:border-metal-700 transition-all shadow-lg"
          >
            <div>
              <span className="text-[10px] text-brand-red font-bold uppercase tracking-wider block">
                {s.contact_person || 'Commercial Vendor'}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{s.name}</h3>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="w-3.5 h-3.5 text-brand-red" />
                <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
              </div>
              {s.email && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-brand-red" />
                  <span>{s.email}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-metal-500" />
                <span>{s.address}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-metal-800 text-xs">
              <span className="text-gray-500 block text-[10px] uppercase">Supplies:</span>
              <p className="text-white font-medium mt-0.5">{s.materials_supplied}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Material Supplier"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ethiopian Steel Trading Corp"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Ato Girma"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Phone (+251) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0911234567"
                className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Addis Ababa Address / Depo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kality Metal Zone, Addis Ababa"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Materials Supplied</label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. RHS tubes, SHS profiles, angle iron, chequered plates"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
          >
            {submitting ? 'Registering...' : 'Save Supplier'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
