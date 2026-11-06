import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Lock, Mail, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
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
      if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: any) {
      const data = err.response?.data || {};
      const emailErr = data.email?.[0] || (typeof data.email === 'string' ? data.email : undefined);
      const phoneErr = data.phone_number?.[0] || (typeof data.phone_number === 'string' ? data.phone_number : undefined);
      const genErr = data.detail || data.non_field_errors?.[0] || (!emailErr && !phoneErr ? 'Registration failed. Please review your details.' : undefined);
      
      setFieldErrors({
        email: emailErr,
        phone: phoneErr,
        general: genErr
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-xl font-bold text-white uppercase tracking-wider">
          {t('auth.createCustomerAccount')}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {t('auth.createCustomerAccountDesc')}
        </p>
      </div>

      {fieldErrors.general && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{fieldErrors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.firstName')} *</label>
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
            <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.lastName')} *</label>
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
          <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.emailLabel')} *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="almaz@example.com"
            className={`w-full bg-metal-950 border rounded-lg px-3 py-2 text-xs text-white focus:outline-none ${
              fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-metal-700 focus:border-brand-red'
            }`}
          />
          {fieldErrors.email && (
            <div className="mt-1.5 p-2 bg-red-950/60 border border-red-800/80 rounded text-xs text-red-300 space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                {fieldErrors.email}
              </p>
              <div className="pt-0.5">
                <Link
                  to={`/login?email=${encodeURIComponent(email)}`}
                  className="text-brand-red hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  {t('auth.signInHere')} &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.phoneLabel')}</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: undefined }));
              }}
              placeholder="0911234567"
              className={`w-full bg-metal-950 border rounded-lg px-3 py-2 text-xs text-white focus:outline-none ${
                fieldErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-metal-700 focus:border-brand-red'
              }`}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-[11px] text-red-400 flex items-start gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{fieldErrors.phone}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.passwordLabel')}</label>
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
          <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.companyOptional')}</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Addis Construction Ltd"
            className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">{t('auth.addisAddress')}</label>
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
          {loading ? <span>{t('auth.creatingAccount')}</span> : <><UserPlus className="w-4 h-4" /><span>{t('auth.completeRegistration')}</span></>}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-gray-400">
        <span>{t('auth.haveAccount')} </span>
        <Link 
          to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'} 
          className="text-brand-red font-semibold hover:underline"
        >
          {t('auth.signInHere')}
        </Link>
      </div>
    </div>
  );
};

