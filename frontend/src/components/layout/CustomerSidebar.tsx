import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut, 
  PlusCircle 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface CustomerSidebarProps {
  onCloseMobile?: () => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/portal', icon: LayoutDashboard, exact: true },
    { name: 'My Quotes', path: '/portal/quotes', icon: FileText },
    { name: 'My Orders', path: '/portal/orders', icon: ShoppingBag },
    { name: 'Invoices', path: '/portal/invoices', icon: Receipt },
    { name: 'Payments', path: '/portal/payments', icon: CreditCard },
    { name: 'Messages', path: '/portal/messages', icon: MessageSquare },
    { name: 'Notifications', path: '/portal/notifications', icon: Bell },
    { name: 'Profile Settings', path: '/portal/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-metal-900 border-r border-metal-800 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-metal-800 flex items-center space-x-3">
        <img src="/hara-logo.png" alt="Hara Logo" className="h-9 w-auto object-contain bg-black/40 p-1 rounded-md border border-metal-700" />
        <div>
          <h2 className="text-white font-bold text-base tracking-wide uppercase leading-tight">
            HARA <span className="text-brand-red">PORTAL</span>
          </h2>
          <span className="text-[10px] text-gray-400 tracking-wider uppercase block">Customer Service Hub</span>
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
          <span>New Quote Request</span>
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
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'text-gray-300 hover:bg-metal-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
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
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
