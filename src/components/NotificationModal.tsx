import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Send, X, Volume2, Shield, Check, XCircle } from 'lucide-react';
import { playNotificationChime } from '../lib/notificationService';

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
    return localStorage.getItem('krishakarya_push_enabled') === 'true' || localStorage.getItem('krishikulture_push_enabled') === 'true';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      title: 'Booking Request Confirmed! ✅',
      body: 'Your booking request for John Deere 5050D Tractor (2026-08-15) has been confirmed by the owner.',
      time: 'Just now',
      read: false,
    },
    {
      id: 'notif_2',
      title: 'Welcome to Krishakarya Notifications',
      body: 'Get real-time updates when service providers confirm, decline, or complete farm labor & machinery requests.',
      time: '1 hour ago',
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
        localStorage.setItem('krishakarya_push_enabled', 'true');
        showToast('Push notifications successfully enabled!');
        sendPushNotification(
          'Krishakarya Push Notifications Activated',
          'You will now receive instant alerts when a booking status changes.'
        );
      } else if (res === 'denied') {
        setNotificationsEnabled(false);
        localStorage.setItem('krishakarya_push_enabled', 'false');
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
      localStorage.setItem('krishakarya_push_enabled', String(nextState));
      showToast(nextState ? 'Push Notifications Enabled!' : 'Push Notifications Disabled.');
    }
  };

  const sendPushNotification = (title: string, body: string, soundType: 'success' | 'alert' | 'info' = 'success') => {
    playNotificationChime(soundType);

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
    if ('Notification' in window && Notification.permission === 'granted') {
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

  const handleTestConfirmedNotification = () => {
    sendPushNotification(
      'Booking Request Confirmed! ✅',
      'Great news! Your booking for "Mahindra 575 DI Tractor" (2026-08-15) was confirmed by the owner.',
      'success'
    );
    showToast('Sent Confirmed Booking Notification!');
  };

  const handleTestDeclinedNotification = () => {
    sendPushNotification(
      'Booking Request Declined ❌',
      'Your request for "Combine Harvester" was declined. Note: "Equipment under routine maintenance".',
      'alert'
    );
    showToast('Sent Declined Booking Notification!');
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
              <h3 className="font-extrabold text-base">Booking Status Notifications</h3>
              <p className="text-xs text-emerald-100">Live alerts when farmers & providers update bookings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
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
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Allowed & Active
                  </span>
                )}
                {permission === 'denied' && (
                  <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-600" /> Denied in Browser
                  </span>
                )}
                {permission === 'default' && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-600" /> Permission Needed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Receive browser notifications when a booking request is Confirmed, Declined, or Completed.
              </p>
            </div>

            {permission !== 'granted' ? (
              <button
                onClick={requestNotificationPermission}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" /> Enable Notifications
              </button>
            ) : (
              <button
                onClick={toggleNotifications}
                className={`w-full sm:w-auto px-4 py-2 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  notificationsEnabled
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {notificationsEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
              </button>
            )}
          </div>

          {/* Test Notification Options */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-700" /> Test Booking Status Alerts:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleTestConfirmedNotification}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Test "Confirmed" Alert
              </button>

              <button
                onClick={handleTestDeclinedNotification}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Test "Declined" Alert
              </button>
            </div>
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
              Recent Notification History ({notifications.length})
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
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
