import { Booking, BookingStatus } from '../types';

/**
 * Play a pleasant two-tone agricultural notification chime using Web Audio API
 */
export const playNotificationChime = (toneType: 'success' | 'alert' | 'info' = 'success') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (toneType === 'success') {
      // Pleasant rising major chord chime (D5 -> F#5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.1); // A5
      gain2.gain.setValueAtTime(0.12, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } else if (toneType === 'alert') {
      // Soft gentle alert tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Neutral info tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // Silent fail if AudioContext is restricted by browser autoplay policy
  }
};

/**
 * Request notification permission from the browser
 */
export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    localStorage.setItem('krishakarya_push_enabled', 'true');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      if (granted) {
        localStorage.setItem('krishakarya_push_enabled', 'true');
      }
      return granted;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  return false;
};

/**
 * Check if browser notifications are allowed
 */
export const isNotificationPermissionGranted = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Trigger native browser notification and sound
 */
export const sendBrowserNotification = (
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    soundType?: 'success' | 'alert' | 'info';
    onClick?: () => void;
  }
) => {
  // Play chime
  playNotificationChime(options.soundType || 'info');

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
      });

      notif.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notif.close();
      };
    } catch (err) {
      console.warn('Native notification trigger error:', err);
    }
  }
};

/**
 * Generate formatted notification details for a booking status change
 */
export const getBookingStatusNotificationDetails = (
  booking: Booking,
  previousStatus: BookingStatus | undefined,
  currentUserId?: string
): {
  title: string;
  body: string;
  soundType: 'success' | 'alert' | 'info';
} | null => {
  const isFarmer = currentUserId ? booking.renterId === currentUserId : true;
  const isOwner = currentUserId ? booking.ownerId === currentUserId : false;
  const itemName = booking.itemName;
  const bookingCode = booking.id ? `#${booking.id.slice(-5).toUpperCase()}` : '';

  // Status changed to Confirmed
  if (booking.status === 'Confirmed' && previousStatus !== 'Confirmed') {
    if (isFarmer) {
      return {
        title: 'Booking Request Confirmed! ✅',
        body: `Your booking for "${itemName}" (${booking.startDate}) was confirmed by ${booking.ownerName || 'the provider'}.`,
        soundType: 'success',
      };
    }
    return {
      title: 'Booking Confirmed! ✅',
      body: `Booking ${bookingCode} for "${itemName}" is confirmed.`,
      soundType: 'success',
    };
  }

  // Status changed to Declined
  if (booking.status === 'Declined' && previousStatus !== 'Declined') {
    const reasonText = booking.declineReason ? ` Note: "${booking.declineReason}"` : '';
    if (isFarmer) {
      return {
        title: 'Booking Request Declined ❌',
        body: `Your booking for "${itemName}" was declined by ${booking.ownerName || 'the provider'}.${reasonText}`,
        soundType: 'alert',
      };
    }
    return {
      title: 'Booking Declined ❌',
      body: `Booking ${bookingCode} for "${itemName}" was declined.`,
      soundType: 'alert',
    };
  }

  // Status changed to Completed
  if (booking.status === 'Completed' && previousStatus !== 'Completed') {
    return {
      title: 'Work Completed! 🌾',
      body: `Booking ${bookingCode} for "${itemName}" has been marked as completed. Don't forget to review and record in Khatabook!`,
      soundType: 'success',
    };
  }

  // Status changed to Cancelled
  if (booking.status === 'Cancelled' && previousStatus !== 'Cancelled') {
    if (isOwner) {
      return {
        title: 'Booking Cancelled by Farmer ⚠️',
        body: `Farmer ${booking.renterName} has cancelled booking ${bookingCode} for "${itemName}".`,
        soundType: 'alert',
      };
    }
    return {
      title: 'Booking Cancelled',
      body: `Booking ${bookingCode} for "${itemName}" was cancelled.`,
      soundType: 'info',
    };
  }

  // New Pending request received by Owner
  if (booking.status === 'Pending' && !previousStatus && isOwner) {
    return {
      title: 'New Booking Request Received! 🚜',
      body: `${booking.renterName} requested to book "${itemName}" starting ${booking.startDate}. Click to review!`,
      soundType: 'info',
    };
  }

  return null;
};
