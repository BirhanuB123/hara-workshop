import React, { useState } from 'react';
import { User, Phone, MapPin, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { accountsApi } from '../../services/api';

export const CustomerProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [address, setAddress] = useState(user?.customer_profile?.address || '');
  const [company, setCompany] = useState(user?.customer_profile?.company_name || '');
  const [tin, setTin] = useState(user?.customer_profile?.tin_number || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await accountsApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        customer_profile: {
          address,
          company_name: company,
          tin_number: tin,
        }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Profile & Delivery Details
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage your contact phone, delivery site address, and TIN credentials for 15% VAT invoicing.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email}
              className="w-full bg-metal-950/50 border border-metal-800 rounded-lg px-3 py-2 text-xs text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Phone (+251)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Company / Organization Name</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Addis Ababa Delivery Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">TIN Number (for 15% VAT Invoicing)</label>
          <input
            type="text"
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
};
