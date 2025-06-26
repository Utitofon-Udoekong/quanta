import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import { supabase } from '@/app/utils/supabase/client';

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
  const [lastFetch, setLastFetch] = useState<number>(0);
  const { user } = useUserStore();

  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      //console.log('No user ID available for fetching notifications');
      return;
    }

    // Cache for 30 seconds unless forced refresh
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < 30000) {
      //console.log('Using cached notifications');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setLastFetch(now);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't clear notifications on error, keep existing ones
    } finally {
      setLoading(false);
    }
  }, [user?.id, lastFetch]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          //console.log('New notification received:', payload);
          // Add new notification to the top of the list
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          //console.log('Notification updated:', payload);
          // Update the notification in the list
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === payload.new.id 
                ? payload.new as Notification 
                : notification
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (open && user?.id) {
      fetchNotifications();
    }
  }, [open, user?.id, fetchNotifications]);

  // Auto-refresh notifications every 2 minutes when dropdown is open
  useEffect(() => {
    if (!open || !user?.id) return;

    const interval = setInterval(() => {
      fetchNotifications(true); // Force refresh
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [open, user?.id, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Don't render if user is not logged in
  if (!user?.id) {
    return null;
  }

  const markAsRead = async (ids: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Optimistically update the UI
      setNotifications(prev => 
        prev.map(notification => 
          ids.includes(notification.id) 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Revert optimistic update on error
      fetchNotifications(true);
    }
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