import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Calendar, FileText, Video, HelpCircle, MessageSquare, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminService, Notification } from '../lib/adminService';
import { cn } from '../lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';
import { toast } from 'sonner';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useClickOutside(() => setIsOpen(false));

  const fetchNotifications = async () => {
    try {
      const data = await adminService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for global notification updates
    window.addEventListener('rtft_notification_update', fetchNotifications);
    return () => {
      window.removeEventListener('rtft_notification_update', fetchNotifications);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminService.markAsRead(id);
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleReadAll = async () => {
    try {
      await adminService.readAllNotifications();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await adminService.deleteAllNotifications();
      toast.success('All notifications deleted');
    } catch (err) {
      toast.error('Failed to delete notifications');
    }
  };

  const getNotiIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'qa':
        return <HelpCircle className="w-4 h-4 text-sky-500" />;
      case 'trade':
        return <PlusCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl border border-[#262626] bg-[#141414] hover:border-sky-500/50 hover:bg-[#1c1c1c] transition-all text-neutral-400 hover:text-white group",
          isOpen && "border-sky-500/50 bg-[#1c1c1c] text-white"
        )}
      >
        <Bell className="w-4 h-4 transition-transform group-hover:rotate-12 duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-sky-500 text-black font-black text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-[0_0_12px_rgba(14,165,233,0.6)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f0f0f] border border-[#222] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between bg-[#131313]/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 font-black text-[10px] rounded-full uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={handleReadAll}
                      title="Mark all as read"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-sky-400 hover:bg-[#1a1a1a] transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      title="Delete all"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-500 hover:bg-[#1a1a1a] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notifications Feed */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-[#181818]">
              {notifications.length > 0 ? (
                <div className="divide-y divide-[#151515]">
                  {notifications.map((noti) => (
                    <div
                      key={noti.id}
                      onClick={async () => {
                        if (!noti.is_read) {
                          await adminService.markAsRead(noti.id);
                        }
                      }}
                      className={cn(
                        "p-4 flex gap-3 hover:bg-[#141414] transition-all cursor-pointer relative group",
                        !noti.is_read ? "bg-sky-500/[0.015]" : "opacity-75 hover:opacity-100"
                      )}
                    >
                      {/* Left Dot Indicator */}
                      {!noti.is_read && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
                      )}

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-[#252525]">
                        {getNotiIcon(noti.type)}
                      </div>

                      {/* Message details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className={cn(
                            "text-xs font-bold truncate text-neutral-200",
                            !noti.is_read && "text-white"
                          )}>
                            {noti.title}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-500 shrink-0 mt-0.5">
                            {formatTime(noti.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed line-clamp-2 font-medium">
                          {noti.message}
                        </p>
                      </div>

                      {/* Quick action button */}
                      {!noti.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(noti.id, e)}
                          className="self-center p-1 rounded bg-[#1f1f1f] text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#222] flex items-center justify-center text-neutral-600 mb-3">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-neutral-400">All caught up!</p>
                  <p className="text-[10px] text-neutral-600 mt-1">No new notifications at this time.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#131313]/50 border-t border-[#1f1f1f] text-center">
              <p className="text-[10px] text-neutral-500 font-mono">
                RTFT Security Core Notifications
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
