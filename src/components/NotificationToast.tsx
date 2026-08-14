import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Tractor, 
  Users 
} from 'lucide-react';
import { BookingStatus } from '../types';

export interface ActiveNotificationToast {
  id: string;
  title: string;
  body: string;
  status?: BookingStatus;
  bookingType?: 'sahyogi' | 'machinery';
  bookingId?: string;
  timestamp: number;
}

interface NotificationToastProps {
  toast: ActiveNotificationToast | null;
  onDismiss: () => void;
  onViewBooking?: (bookingId?: string) => void;
  onRequestPermission?: () => void;
  isPermissionGranted?: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onDismiss,
  onViewBooking,
  onRequestPermission,
  isPermissionGranted = false,
}) => {
  if (!toast) return null;

  const getStatusBadge = () => {
    switch (toast.status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Confirmed
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" /> Declined
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle className="w-3 h-3 text-blue-600" /> Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
            <AlertCircle className="w-3 h-3 text-slate-500" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Bell className="w-3 h-3 text-amber-600" /> Update
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed top-16 right-3 sm:right-6 z-50 max-w-sm w-full pointer-events-none">
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-emerald-500/30 overflow-hidden ring-4 ring-emerald-500/10"
        >
          {/* Header Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-green-600 animate-pulse" />

          <div className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-xs">
                  {toast.bookingType === 'machinery' ? (
                    <Tractor className="w-4 h-4 text-emerald-700" />
                  ) : toast.bookingType === 'sahyogi' ? (
                    <Users className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Bell className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                    {toast.title}
                  </h4>
                  <div className="mt-0.5">{getStatusBadge()}</div>
                </div>
              </div>

              <button
                onClick={onDismiss}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-1">
              {toast.body}
            </p>

            <div className="pt-1 flex items-center justify-between gap-2">
              {onViewBooking ? (
                <button
                  onClick={() => {
                    onViewBooking(toast.bookingId);
                    onDismiss();
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View in Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : <div />}

              {!isPermissionGranted && onRequestPermission && (
                <button
                  onClick={onRequestPermission}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                  title="Enable browser push notifications"
                >
                  <Bell className="w-3 h-3 text-emerald-600" /> Enable Popups
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
