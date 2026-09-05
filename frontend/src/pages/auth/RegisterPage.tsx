import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Lock, Mail, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        password,
        address,
        company_name: companyName,
      });
      navigate('/portal');
    } catch (err: any) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'Registration failed. Please review your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-xl font-bold text-white uppercase tracking-wider">
          Create Customer Account
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Track orders, approve quotations, and communicate directly with craftsmen.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Almaz"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Ayalew"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="almaz@example.com"
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Phone (+251) *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0911234567"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Company / Organization (Optional)</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Addis Construction Ltd"
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Addis Ababa Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Bole Medhanialem, House 450"
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2 mt-4"
        >
          {loading ? <span>Creating Account...</span> : <><UserPlus className="w-4 h-4" /><span>Complete Registration</span></>}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-gray-400">
        <span>Already have an account? </span>
        <Link to="/login" className="text-brand-red font-semibold hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
};
