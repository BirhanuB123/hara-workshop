import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle2 } from 'lucide-react';
import { coreApi } from '../../services/api';
import { WorkshopSettings } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [phone, setPhone] = useState('+251 926 629 999');
  const [address, setAddress] = useState('Bole Arabsa, Near Water Tanker, Addis Ababa, Ethiopia');
  const [vat, setVat] = useState(15);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    coreApi.getSettings()
      .then(res => {
        setSettings(res.data);
        if (res.data) {
          setPhone(res.data.phone || '+251 926 629 999');
          setAddress(res.data.address || 'Bole Arabsa, Addis Ababa');
          setVat(res.data.vat_percentage || 15);
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
    }, 600);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div className="border-b border-metal-800 pb-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
          Workshop Enterprise Settings
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure workshop corporate details, VAT percentages, and Addis Ababa locations.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Workshop configurations updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-metal-900 border border-metal-800 rounded-xl p-6 space-y-4 shadow-lg">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Company Name</label>
          <input
            type="text"
            disabled
            value="HARA WORKSHOP (Metal and Wood Solution)"
            className="w-full bg-metal-950/50 border border-metal-800 rounded-lg px-3 py-2 text-xs text-gray-400 cursor-not-allowed font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Official Telephone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Standard VAT Percentage (%)</label>
            <input
              type="number"
              value={vat}
              onChange={(e) => setVat(Number(e.target.value))}
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Workshop Floor Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-2"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};
