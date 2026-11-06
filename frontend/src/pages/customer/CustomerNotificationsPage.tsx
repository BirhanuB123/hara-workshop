import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2 } from 'lucide-react';
import { notificationsApi } from '../../services/api';
import { Notification } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.getAll()
      .then(res => setNotifications(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-metal-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Notifications Feed
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time workshop updates on your quotations, fabrication milestones, and delivery status.
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          className="text-xs text-brand-red hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      </div>

      <div className="bg-metal-900 border border-metal-800 rounded-xl divide-y divide-metal-800 shadow-lg overflow-hidden">
        {notifications.length === 0 ? (
          <p className="p-8 text-xs text-gray-500 text-center">No notifications at this time.</p>
        ) : (
          notifications.map((n) => {
            const content = (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-brand-red inline-block" />}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{n.message}</p>
              </>
            );

            return n.link_url ? (
              <Link
                key={n.id}
                to={n.link_url}
                className={`block p-4 text-xs hover:bg-metal-850/80 transition-colors ${!n.is_read ? 'bg-brand-red/5' : ''}`}
              >
                {content}
              </Link>
            ) : (
              <div key={n.id} className={`p-4 text-xs ${!n.is_read ? 'bg-brand-red/5' : ''}`}>
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
