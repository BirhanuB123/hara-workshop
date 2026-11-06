import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  ShoppingBag, 
  Wrench, 
  Boxes, 
  Truck, 
  Package, 
  Tag, 
  Users, 
  MessageSquare,
  Bell, 
  Layers,
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { messagingApi } from '../../services/api';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  exact?: boolean;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const { t, language } = useLanguageStore();
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

  const isAm = language === 'am';

  const navGroups: NavGroup[] = [
    {
      group: isAm ? 'አጠቃላይ እይታ' : 'Overview',
      items: [
        { name: isAm ? 'ዳሽቦርድ' : 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, exact: true },
        { name: isAm ? 'ሪፖርቶች እና ትንተና' : 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      group: isAm ? 'ስራዎች እና ፍሰት' : 'Operations & Workflow',
      items: [
        { name: isAm ? 'የዋጋ ጥያቄዎች' : 'Quotations', path: '/admin/quotes', icon: FileText },
        { name: isAm ? 'የትዕዛዝ መዝገብ' : 'Customer Orders', path: '/admin/orders', icon: ShoppingBag },
        { name: isAm ? 'ማምረት እና ተግባራት' : 'Production & Tasks', path: '/admin/production', icon: Wrench },
      ],
    },
    {
      group: isAm ? 'ወርክሾፕ እና ጥሬ እቃ' : 'Workshop & Inventory',
      items: [
        { name: isAm ? 'ጥሬ እቃዎች' : 'Raw Materials', path: '/admin/raw-materials', icon: Boxes },
        { name: isAm ? 'አቅራቢዎች' : 'Suppliers Registry', path: '/admin/suppliers', icon: Truck },
      ],
    },
    {
      group: isAm ? 'ካታሎግ' : 'Catalog',
      items: [
        { name: isAm ? 'የምርት ካታሎግ' : 'Products Catalog', path: '/admin/products', icon: Package },
        { name: isAm ? 'ምድቦች' : 'Categories', path: '/admin/categories', icon: Tag },
        { name: isAm ? 'አገልግሎቶች እና ምስሎች' : 'Services & Media', path: '/admin/services', icon: Layers },
      ],
    },
    {
      group: isAm ? 'ደንበኞች እና ግንኙነት' : 'Customers & Communication',
      items: [
        { name: isAm ? 'ደንበኞች' : 'Customers', path: '/admin/customers', icon: Users },
        { name: isAm ? 'መልዕክቶች' : 'Messages', path: '/admin/messages', icon: MessageSquare, badge: unreadMessages },
        { name: isAm ? 'ማሳወቂያዎች' : 'Notifications', path: '/admin/notifications', icon: Bell },
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
            {isAm ? 'አድሚን እና አስተዳደር' : 'Admin & Management'}
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
                    `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-red text-white shadow-sm font-semibold'
                        : 'text-gray-300 hover:bg-metal-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {Boolean(item.badge !== undefined && item.badge > 0) && (
                    <span className="bg-white text-brand-red text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-2 flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
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
              {user?.role || 'ADMIN'}
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
