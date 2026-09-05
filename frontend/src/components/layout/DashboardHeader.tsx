import React, { useState, useEffect } from 'react';
import { Menu, Bell, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { notificationsApi } from '../../services/api';
import { Notification } from '../../types';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
}) => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      const list = res.data.results || res.data || [];
      setNotifications(list.slice(0, 5));
      const unread = list.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // Gracefully silent for initial / offline loads
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Gracefully silent
    }
  };

  return (
    <header className="bg-metal-900 border-b border-metal-800 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Page Titles */}
        <div className="flex items-center space-x-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-md focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Quick link to website, notifications, and profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Public Site Link */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-gray-300 hover:text-white bg-metal-800 hover:bg-metal-700 px-3 py-1.5 rounded-md border border-metal-700 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3 h-3 text-metal-400" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-metal-800 transition-colors focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-metal-900 border border-metal-700 rounded-lg shadow-2xl py-2 z-50 text-left">
                <div className="px-4 py-2 border-b border-metal-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Notifications ({unreadCount} new)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-brand-red hover:text-red-400 flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-metal-800">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-gray-400 text-center">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors hover:bg-metal-800/60 ${
                          !n.is_read ? 'bg-brand-red/5' : ''
                        }`}
                      >
                        <p className="font-semibold text-white mb-0.5">{n.title}</p>
                        <p className="text-gray-300 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-metal-800 text-center">
                  <Link
                    to={user?.role === 'CUSTOMER' ? '/portal/notifications' : '/admin/notifications'}
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-brand-red hover:underline font-medium"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-2 pl-2 border-l border-metal-800">
            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-xs border border-red-400/40 shadow-sm">
              {user?.first_name ? user.first_name[0] : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.full_name || user?.email}
              </p>
              <span className="text-[10px] text-metal-400 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ') || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
