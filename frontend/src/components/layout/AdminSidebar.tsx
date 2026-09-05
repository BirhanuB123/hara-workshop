import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingBag, 
  Wrench, 
  Boxes, 
  Truck, 
  Package, 
  Tag, 
  FolderGit2, 
  Receipt, 
  CreditCard, 
  TrendingDown, 
  Users, 
  Briefcase, 
  Shield, 
  MessageSquare, 
  Bell, 
  BarChart3, 
  Settings, 
  ScrollText, 
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
        { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Operations & Workflow',
      items: [
        { name: 'Quotations', path: '/admin/quotes', icon: FileText },
        { name: 'Customer Orders', path: '/admin/orders', icon: ShoppingBag },
        { name: 'Production Jobs', path: '/admin/production', icon: Wrench },
      ],
    },
    {
      group: 'Workshop & Inventory',
      items: [
        { name: 'Raw Materials', path: '/admin/inventory', icon: Boxes },
        { name: 'Suppliers Registry', path: '/admin/suppliers', icon: Truck },
      ],
    },
    {
      group: 'Showcase & Catalog',
      items: [
        { name: 'Products Catalog', path: '/admin/products', icon: Package },
        { name: 'Categories', path: '/admin/categories', icon: Tag },
        { name: 'Workshop Services', path: '/admin/services', icon: Wrench },
        { name: 'Portfolio Projects', path: '/admin/projects', icon: FolderGit2 },
      ],
    },
    {
      group: 'Financial Management',
      items: [
        { name: 'Invoices & VAT', path: '/admin/invoices', icon: Receipt },
        { name: 'Recorded Payments', path: '/admin/payments', icon: CreditCard },
        { name: 'Workshop Expenses', path: '/admin/expenses', icon: TrendingDown },
      ],
    },
    {
      group: 'Users & CRM',
      items: [
        { name: 'Customers CRM', path: '/admin/customers', icon: Users },
        { name: 'Employees & Craftsmen', path: '/admin/employees', icon: Briefcase },
        { name: 'System Users', path: '/admin/users', icon: Shield },
      ],
    },
    {
      group: 'Communication & System',
      items: [
        { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
        { name: 'Workshop Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-metal-950 border-r border-metal-800 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-metal-800 flex items-center space-x-3 bg-metal-900/50">
        <img src="/hara-logo-transparent.png" alt="Hara Logo" className="h-10 w-10 object-contain p-0.5 rounded-full bg-white border border-brand-red/80 shadow-sm" />
        <div>
          <h2 className="text-white font-bold text-sm tracking-wider uppercase leading-tight">
            HARA <span className="text-brand-red">WORKSHOP</span>
          </h2>
          <span className="text-[10px] text-brand-red font-semibold tracking-wider uppercase block">
            Admin & Management
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {navGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-metal-400 px-3 pb-1">
              {grp.group}
            </p>
            {grp.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-red text-white shadow-sm font-semibold'
                        : 'text-gray-300 hover:bg-metal-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Account & Logout */}
      <div className="p-3 border-t border-metal-800 bg-metal-900/70">
        <div className="flex items-center space-x-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-metal-800 border border-metal-700 flex items-center justify-center text-white font-bold text-xs">
            {user?.first_name ? user.first_name[0] : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user?.full_name || 'Admin'}
            </p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-red/20 text-brand-red border border-brand-red/30 uppercase">
              {user?.role?.replace('_', ' ') || 'STAFF'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-xs font-medium text-gray-400 hover:text-red-400 w-full py-1.5 px-2 rounded hover:bg-metal-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
