import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Send, X, Volume2, Shield } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('krishikulture_push_enabled') === 'true';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      title: 'Welcome to Krishakarya Notifications',
      body: 'Get real-time updates when farmers accept labor requests or machinery rentals.',
      time: 'Just now',
      read: false,
    },
    {
      id: 'notif_2',
      title: 'Monsoon Crop Season Alert',
      body: 'High demand for Sahyogi helpers and tractors in your district. Book early!',
      time: '2 hours ago',
      read: true,
    },
  ]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Push Notifications are not supported on this browser.');
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('krishikulture_push_enabled', 'true');
        showToast('Push notifications successfully enabled!');
        sendPushNotification('Krishakarya Push Notifications Activated', 'You will now receive instant updates on farm labor & machinery bookings.');
      } else if (res === 'denied') {
        setNotificationsEnabled(false);
        localStorage.setItem('krishikulture_push_enabled', 'false');
        showToast('Notification permission was denied in browser settings.');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const toggleNotifications = () => {
    if (permission !== 'granted') {
      requestNotificationPermission();
    } else {
      const nextState = !notificationsEnabled;
      setNotificationsEnabled(nextState);
      localStorage.setItem('krishikulture_push_enabled', String(nextState));
      showToast(nextState ? 'Push Notifications Enabled!' : 'Push Notifications Disabled.');
    }
  };

  const sendPushNotification = (title: string, body: string) => {
    // 1. Add to in-app history
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title,
      body,
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // 2. Trigger browser native push notification if permitted
    if ('Notification' in window && Notification.permission === 'granted' && notificationsEnabled) {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch (e) {
        console.log('Browser notification fallback:', e);
      }
    }
  };

  const handleTestNotification = () => {
    sendPushNotification(
      '🚜 Krishakarya Live Push Test',
      'This is a test notification! Your device is ready to receive real-time agricultural booking alerts.'
    );
    showToast('Test Push Notification Sent!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Push Notifications</h3>
              <p className="text-xs text-emerald-100">Stay updated on bookings & labor requests</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">Browser Status:</span>
                {permission === 'granted' && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Granted
                  </span>
                )}
                {permission === 'denied' && (
                  <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-600" /> Denied
                  </span>
                )}
                {permission === 'default' && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-600" /> Permission Needed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Receive instant browser notifications when a farmer hires labor or rents machinery.
              </p>
            </div>

            {permission !== 'granted' ? (
              <button
                onClick={requestNotificationPermission}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <Bell className="w-3.5 h-3.5" /> Enable Now
              </button>
            ) : (
              <button
                onClick={toggleNotifications}
                className={`w-full sm:w-auto px-4 py-2 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
                  notificationsEnabled
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {notificationsEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
              </button>
            )}
          </div>

          {/* Test Notification Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-700" /> Test Push Alert
            </span>
            <button
              onClick={handleTestNotification}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Send Test Push
            </button>
          </div>

          {/* Notification Toast Message */}
          {toastMessage && (
            <div className="p-3 bg-emerald-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Recent Notification Stream */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Recent Notifications ({notifications.length})
            </h4>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    <Bell className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                      <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
