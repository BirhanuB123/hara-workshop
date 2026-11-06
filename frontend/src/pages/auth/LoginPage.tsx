import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const stateFrom = (location.state as any)?.from?.pathname 
    ? ((location.state as any).from.pathname + ((location.state as any).from.search || ''))
    : null;
  const targetDestination = redirectParam || stateFrom;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Fetch fresh role from state
      const user = useAuthStore.getState().user;
      if (targetDestination) {
        navigate(targetDestination, { replace: true });
      } else if (user?.role === 'CUSTOMER') {
        navigate('/customer/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Invalid email or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-xl font-bold text-white uppercase tracking-wider">
          {t('auth.signInAccount')}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {t('auth.signInAccountDesc')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            {t('auth.emailLabel')}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@haraworkshop.com"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-300">
              {t('auth.passwordLabel')}
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-metal-950 border border-metal-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2"
        >
          {loading ? (
            <span>{t('auth.signingIn')}</span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>{t('auth.signIn')}</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick Switcher */}
      <div className="pt-4 border-t border-metal-800 space-y-2">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-metal-400">
          <Sparkles className="w-3.5 h-3.5 text-brand-red" />
          <span>{t('auth.testAccounts')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@haraworkshop.com', 'Admin123!')}
            className="p-2.5 bg-metal-950 hover:bg-metal-800 border border-metal-800 rounded-lg text-xs text-left text-gray-300 hover:text-white transition-all hover:border-brand-red/50"
          >
            <span className="font-bold text-brand-red block text-xs">{t('auth.workshopAdmin')}</span>
            <span className="text-[10px] text-gray-400 font-mono">admin@haraworkshop.com</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('customer@haraworkshop.com', 'Password123!')}
            className="p-2.5 bg-metal-950 hover:bg-metal-800 border border-metal-800 rounded-lg text-xs text-left text-gray-300 hover:text-white transition-all hover:border-teal-500/50"
          >
            <span className="font-bold text-teal-400 block text-xs">{t('auth.customer')}</span>
            <span className="text-[10px] text-gray-400 font-mono">customer@haraworkshop.com</span>
          </button>
        </div>
      </div>

      <div className="pt-2 text-center text-xs text-gray-400">
        <span>{t('auth.needCustomerAccount')} </span>
        <Link 
          to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'} 
          className="text-brand-red font-semibold hover:underline"
        >
          {t('auth.registerHere')}
        </Link>
      </div>
    </div>
  );
};

