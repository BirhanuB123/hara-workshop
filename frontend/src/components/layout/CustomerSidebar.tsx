import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  MessageSquare,
  Bell, 
  User, 
  LogOut, 
  PlusCircle 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { messagingApi } from '../../services/api';

interface CustomerSidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  exact?: boolean;
  badge?: number;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadUnread = async () => {
    try {
      const res = await messagingApi.getUnreadCount();
      setUnreadMessages(res.data?.unread_count || 0);
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { name: t('customer.dashboard'), path: '/customer/dashboard', icon: LayoutDashboard, exact: true },
    { name: t('customer.myQuotes'), path: '/customer/quotes', icon: FileText },
    { name: t('customer.myOrders'), path: '/customer/orders', icon: ShoppingBag },
    { name: t('customer.messages'), path: '/customer/messages', icon: MessageSquare, badge: unreadMessages },
    { name: t('customer.notifications'), path: '/customer/notifications', icon: Bell },
    { name: t('customer.profile'), path: '/customer/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-metal-900 border-r border-metal-800 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-metal-800 flex items-center space-x-3">
        <img src="/hara-logo-transparent.png" alt="Hara Logo" className="h-10 w-10 object-contain p-0.5 rounded-full bg-white border border-brand-red/80 shadow-sm" />
        <div>
          <h2 className="text-white font-bold text-base tracking-wide uppercase leading-tight">
            HARA <span className="text-brand-red">PORTAL</span>
          </h2>
          <span className="text-[10px] text-gray-400 tracking-wider uppercase block">{t('customer.hub')}</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="p-4">
        <NavLink
          to="/request-quote"
          onClick={onCloseMobile}
          className="flex items-center justify-center space-x-2 w-full bg-brand-red hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('customer.newQuoteRequest')}</span>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'text-gray-300 hover:bg-metal-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {Boolean(item.badge && item.badge > 0) && (
                <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-metal-800 bg-metal-950/50">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-red font-bold text-sm">
            {user?.first_name ? user.first_name[0] : 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.full_name || 'Customer'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-xs font-medium text-gray-400 hover:text-red-400 w-full py-1.5 px-2 rounded-md hover:bg-metal-800/80 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('navigation.signOut')}</span>
        </button>
      </div>
    </aside>
  );
};
