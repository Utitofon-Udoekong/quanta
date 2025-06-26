import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (ids: string[]) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-[#212121] transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
      >
        <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#8B25FF] text-white text-xs font-bold rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#18122B] border border-[#222] rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#222]">
            <span className="font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-[#8B25FF] hover:underline"
                onClick={() => markAsRead(notifications.filter(n => !n.is_read).map(n => n.id))}
              >
                Mark all as read
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No notifications</div>
          ) : (
            <ul>
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={`px-4 py-3 border-b border-[#222] last:border-b-0 flex items-start gap-2 ${n.is_read ? 'bg-transparent' : 'bg-[#8B25FF]/10'}`}
                >
                  <div className="flex-shrink-0 pt-1">
                    <Icon icon={
                      n.type === 'new_content' ? 'mdi:newspaper-variant-outline' :
                      n.type === 'payment_success' ? 'mdi:check-circle-outline' :
                      n.type === 'payment_failed' ? 'mdi:alert-circle-outline' :
                      n.type === 'subscription_expiring' ? 'mdi:clock-alert-outline' :
                      n.type === 'subscription_cancelled' ? 'mdi:cancel' :
                      'mdi:bell-outline'
                    } className="w-5 h-5 text-[#8B25FF]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white mb-1">{n.message}</div>
                    <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && (
                    <button
                      className="ml-2 text-xs text-[#8B25FF] hover:underline"
                      onClick={() => markAsRead([n.id])}
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 