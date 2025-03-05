import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, Heart, MessageCircle, User } from 'lucide-react';

// Extend your existing database types
type Notification = {
  id: string;
  type: 'follow' | 'like' | 'comment';
  content: {
    fromUserId: string;
    fromUserFullName: string;
    entityId?: string;
  };
  read: boolean;
  created_at: string;
};

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  // Fetch notifications
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, 
        type, 
        read,
        created_at
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data as Notification[]);
    setUnreadCount(data.filter(n => !n.read).length);
  };

  // Mark a single notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => prev - 1);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId);

    if (!error) {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  };

  // Real-time notifications
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Render notification icon based on type
  const renderNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return <User className="text-primary size-5" />;
      case 'like':
        return <Heart className="text-red-500 size-5" />;
      case 'comment':
        return <MessageCircle className="text-green-500 size-5" />;
      default:
        return <Bell className="text-muted-foreground size-5" />;
    }
  };

  return {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllAsRead,
    renderNotificationIcon
  };
}

// Utility function to create a notification
export async function createNotification(
  supabase: any,
  recipientId: string,
  senderId: string,
  type: Notification['type'],
  content: Notification['content']
) {
  return await supabase
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      sender_id: senderId,
      type,
      content,
      read: false
    });
}