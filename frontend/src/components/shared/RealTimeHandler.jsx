/**
 * RealTimeHandler — Listens to socket events and updates stores
 * Mounted once inside AppLayout
 */
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../services/socket';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

export default function RealTimeHandler() {
  const queryClient = useQueryClient();
  const { incrementNotifications, setUnreadMessages, unreadMessages } = useUIStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let attempts = 0;
    let cleanup;

    const setup = () => {
      const socket = getSocket();
      if (!socket) {
        if (attempts++ < 10) setTimeout(setup, 500);
        return;
      }

      const onNotification = (notif) => {
        incrementNotifications();
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        toast(`🔔 ${notif.sender?.displayName || 'Someone'} ${notif.text}`, {
          icon: null,
          duration: 4000,
        });
      };

      const onMessage = ({ message, conversationId }) => {
        if (message.sender._id !== user?._id) {
          setUnreadMessages(unreadMessages + 1);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      };

      socket.on('notification:new', onNotification);
      socket.on('message:receive', onMessage);

      cleanup = () => {
        socket.off('notification:new', onNotification);
        socket.off('message:receive', onMessage);
      };
    };

    setup();
    return () => cleanup?.();
  }, [user]);

  return null;
}
