import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Sahyogi, 
  Machinery, 
  Booking,
  BookingStatus,
  LedgerEntry 
} from './types';
import { 
  initialUser, 
  initialSahyogis, 
  initialMachinery
} from './data/mockData';
import {
  getUserFromFirestore,
  saveUserToFirestore,
  saveSahyogiToFirestore,
  deleteSahyogiFromFirestore,
  subscribeSahyogis,
  saveMachineryToFirestore,
  deleteMachineryFromFirestore,
  subscribeMachineries,
  saveBookingToFirestore,
  updateBookingStatusInFirestore,
  subscribeBookings,
  saveLedgerEntryToFirestore,
  deleteLedgerEntryFromFirestore,
  subscribeLedgerEntries,
  findUserInFirestoreByIdentifier,
  saveUserToLocalAccountsDb
} from './lib/firestoreService';

import {
  sendBrowserNotification,
  getBookingStatusNotificationDetails,
  requestBrowserNotificationPermission,
  isNotificationPermissionGranted
} from './lib/notificationService';
import { NotificationToast, ActiveNotificationToast } from './components/NotificationToast';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { SahyogiListings } from './components/SahyogiListings';
import { MachineryListings } from './components/MachineryListings';
import { UserProfile } from './components/UserProfile';
import { TermsModal } from './components/TermsModal';
import { AuthModal } from './components/AuthModal';
import { AddListingModal } from './components/AddListingModal';
import { ModernFarmingQA } from './components/ModernFarmingQA';
import { InboxModal } from './components/InboxModal';

export default function App() {
  // Navigation State: home, sahyogi, machinery, profile, terms, modern-farming
  const [activeTab, setActiveTab] = useState<
    'home' | 'sahyogi' | 'machinery' | 'profile' | 'terms' | 'modern-farming'
  >('home');

  // Application Data States (with LocalStorage fallback persistence)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('krishakarya_user') || localStorage.getItem('krishikulture_user') || localStorage.getItem('krishilink_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Global Inbox modal & preset prompt state
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxPresetPrompt, setInboxPresetPrompt] = useState<string | null>(null);

  const handleOpenInboxWithAi = (prompt?: string) => {
    if (prompt) setInboxPresetPrompt(prompt);
    setIsInboxOpen(true);
  };

  // In-app interactive notification toast
  const [activeToast, setActiveToast] = useState<ActiveNotificationToast | null>(null);

  // References for tracking previous bookings to detect live status transitions
  const previousBookingsRef = useRef<Map<string, Booking>>(new Map());
  const isInitialBookingsLoadRef = useRef<boolean>(true);

  // Auto-dismiss in-app notification toast after 7 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const [sahyogis, setSahyogis] = useState<Sahyogi[]>(() => {
    const saved = localStorage.getItem('krishakarya_sahyogis') || localStorage.getItem('krishikulture_sahyogis') || localStorage.getItem('krishilink_sahyogis');
    if (saved) {
      try {
        const parsed: Sahyogi[] = JSON.parse(saved);
        return parsed.filter(s => !s.id.startsWith('sah_demo_') && !s.id.startsWith('sah_10'));
      } catch (e) {
        // Fallback
      }
    }
    return initialSahyogis;
  });

  const [machineries, setMachineries] = useState<Machinery[]>(() => {
    const saved = localStorage.getItem('krishakarya_machinery') || localStorage.getItem('krishikulture_machinery') || localStorage.getItem('krishilink_machinery');
    if (saved) {
      try {
        const parsed: Machinery[] = JSON.parse(saved);
        return parsed.filter(m => !m.id.startsWith('mac_demo_') && !m.id.startsWith('mac_20'));
      } catch (e) {
        // Fallback
      }
    }
    return initialMachinery;
  });

  const [myBookings, setMyBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('krishakarya_bookings') || localStorage.getItem('krishikulture_bookings') || localStorage.getItem('krishilink_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('krishakarya_ledger') || localStorage.getItem('krishikulture_ledger') || localStorage.getItem('krishilink_ledger');
    return saved ? JSON.parse(saved) : [];
  });

  // Enforce Light Theme (Dark Mode Removed)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('krishakarya_theme');
    localStorage.removeItem('krishikulture_theme');
  }, []);

  // Modal Controls
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const handleOpenAuthModal = (tab: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthOpen(true);
  };

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubSahyogis = subscribeSahyogis((items) => {
      if (items && items.length > 0) {
        setSahyogis(items);
      } else {
        setSahyogis(initialSahyogis);
      }
    });
    const unsubMachinery = subscribeMachineries((items) => {
      if (items && items.length > 0) {
        setMachineries(items);
      } else {
        setMachineries(initialMachinery);
      }
    });

    let unsubBookings = () => {};
    let unsubLedger = () => {};

    if (isAuthReady && auth.currentUser && currentUser?.id === auth.currentUser.uid) {
      // Reset tracker on user switch
      isInitialBookingsLoadRef.current = true;
      previousBookingsRef.current.clear();

      unsubBookings = subscribeBookings(auth.currentUser.uid, (items) => {
        if (items) {
          if (isInitialBookingsLoadRef.current) {
            // First snapshot load - populate state & map without firing duplicate notifications
            const map = new Map<string, Booking>();
            items.forEach((b) => map.set(b.id, b));
            previousBookingsRef.current = map;
            isInitialBookingsLoadRef.current = false;
            setMyBookings(items);
          } else {
            // Subsequent live updates from Firestore
            const prevMap = previousBookingsRef.current;
            const nextMap = new Map<string, Booking>();

            items.forEach((newB) => {
              nextMap.set(newB.id, newB);
              const prevB = prevMap.get(newB.id);

              if (prevB) {
                // 1. Existing booking status changed (e.g. Confirmed, Declined, Completed, Cancelled)
                if (prevB.status !== newB.status) {
                  const notifDetails = getBookingStatusNotificationDetails(
                    newB,
                    prevB.status,
                    currentUser?.id
                  );
                  if (notifDetails) {
                    sendBrowserNotification(notifDetails.title, {
                      body: notifDetails.body,
                      soundType: notifDetails.soundType,
                      tag: `booking-status-${newB.id}-${newB.status}`,
                      onClick: () => {
                        setActiveTab('profile');
                      },
                    });

                    setActiveToast({
                      id: `toast_${Date.now()}_${newB.id}`,
                      title: notifDetails.title,
                      body: notifDetails.body,
                      status: newB.status,
                      bookingType: newB.type,
                      bookingId: newB.id,
                      timestamp: Date.now(),
                    });
                  }
                }
              } else {
                // 2. New incoming booking request received in real-time
                const notifDetails = getBookingStatusNotificationDetails(
                  newB,
                  undefined,
                  currentUser?.id
                );
                if (notifDetails) {
                  sendBrowserNotification(notifDetails.title, {
                    body: notifDetails.body,
                    soundType: notifDetails.soundType,
                    tag: `booking-new-${newB.id}`,
                    onClick: () => {
                      setActiveTab('profile');
                    },
                  });

                  setActiveToast({
                    id: `toast_${Date.now()}_${newB.id}`,
                    title: notifDetails.title,
                    body: notifDetails.body,
                    status: newB.status,
                    bookingType: newB.type,
                    bookingId: newB.id,
                    timestamp: Date.now(),
                  });
                }
              }
            });

            previousBookingsRef.current = nextMap;
            setMyBookings(items);
          }
        }
      });

      unsubLedger = subscribeLedgerEntries(auth.currentUser.uid, (items) => {
        if (items) {
          setLedgerEntries(items);
        }
      });
    } else if (isAuthReady && !auth.currentUser) {
      setMyBookings([]);
      setLedgerEntries([]);
      previousBookingsRef.current.clear();
      isInitialBookingsLoadRef.current = true;
    }

    return () => {
      unsubSahyogis();
      unsubMachinery();
      unsubBookings();
      unsubLedger();
    };
  }, [isAuthReady, currentUser?.id]);


  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setIsAuthReady(true);
      if (fbUser) {
        try {
          let dbUser = await getUserFromFirestore(fbUser.uid);
          if (!dbUser && fbUser.email) {
            dbUser = await findUserInFirestoreByIdentifier(fbUser.email);
          }
          if (dbUser) {
            const matchedUser = { ...dbUser, id: fbUser.uid };
            setCurrentUser(matchedUser);
            saveUserToFirestore(matchedUser).catch(console.error);
          } else {
            // If newly signed up, check if localStorage already has the profile being saved
            const localSaved = localStorage.getItem('krishakarya_user');
            let fallbackName = fbUser.displayName || 'Farmer Member';
            let fallbackUsername = `@${(fbUser.displayName || 'user').toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
            let fallbackPhone = fbUser.phoneNumber || '+91 9876543210';
            
            if (localSaved) {
              try {
                const parsed = JSON.parse(localSaved);
                if (parsed && parsed.name) fallbackName = parsed.name;
                if (parsed && parsed.username) fallbackUsername = parsed.username;
                if (parsed && parsed.phone) fallbackPhone = parsed.phone;
              } catch {}
            }

            const newUser: User = {
              id: fbUser.uid,
              name: fallbackName,
              username: fallbackUsername,
              phone: fallbackPhone,
              email: fbUser.email || `${fbUser.uid}@krishakarya.app`,
              profileImage: fbUser.photoURL || '',
              village: 'Krishakarya Village',
              post: 'Head Post Office',
              district: 'Barabanki',
              pincode: '225001',
              state: 'Uttar Pradesh',
              farmSizeAcres: 0,
              primaryCrops: ['Wheat', 'Paddy'],
              isVerified: true,
              joinedDate: new Date().toISOString().split('T')[0],
              isSahyogi: false,
              isMachineryOwner: false,
            };
            await saveUserToFirestore(newUser);
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.warn('Firebase user sync note:', err);
        }
      } else {
        // If unauthenticated on Firebase, check if user is in an active demo session
        const localRaw = localStorage.getItem('krishakarya_user');
        if (localRaw) {
          try {
            const parsed = JSON.parse(localRaw);
            if (parsed && typeof parsed.id === 'string' && parsed.id.startsWith('demo_')) {
              setCurrentUser(parsed);
              return;
            }
          } catch {}
        }
        setCurrentUser(null);
        localStorage.removeItem('krishakarya_user');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('krishakarya_user', JSON.stringify(currentUser));
      saveUserToFirestore(currentUser).catch(console.error);
    } else {
      localStorage.removeItem('krishakarya_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('krishakarya_sahyogis', JSON.stringify(sahyogis));
  }, [sahyogis]);

  useEffect(() => {
    localStorage.setItem('krishakarya_machinery', JSON.stringify(machineries));
  }, [machineries]);

  useEffect(() => {
    localStorage.setItem('krishakarya_bookings', JSON.stringify(myBookings));
  }, [myBookings]);

  useEffect(() => {
    localStorage.setItem('krishakarya_ledger', JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  // Ledger Operations
  const handleAddLedgerEntry = (entry: LedgerEntry) => {
    setLedgerEntries((prev) => [entry, ...prev]);
    if (currentUser?.id) {
      saveLedgerEntryToFirestore(entry).catch(console.error);
    }
  };

  const handleDeleteLedgerEntry = (id: string) => {
    setLedgerEntries((prev) => prev.filter((e) => e.id !== id));
    deleteLedgerEntryFromFirestore(id).catch(console.error);
  };

  const handleSyncBookingsToLedger = () => {
    if (!currentUser) return;
    const existingBookingIds = new Set(ledgerEntries.map((e) => e.bookingId).filter(Boolean));
    const newEntries: LedgerEntry[] = [];

    myBookings.forEach((b) => {
      if (!existingBookingIds.has(b.id)) {
        const isSahyogi = b.type === 'sahyogi';
        const entry: LedgerEntry = {
          id: `led_bk_${b.id}`,
          userId: currentUser.id,
          date: b.startDate || new Date().toISOString().split('T')[0],
          title: `${isSahyogi ? 'Sahyogi Labor' : 'Machinery Rent'} - ${b.itemName}`,
          type: 'expense',
          category: isSahyogi ? 'sahyogi_labor' : 'machinery_rental',
          amount: b.totalAmount || b.totalCost || 0,
          bookingId: b.id,
          partyName: b.itemName,
          paymentMode: 'online',
          notes: `Auto-synced from Krishakarya Booking (${b.status})`,
          createdAt: new Date().toISOString(),
        };
        newEntries.push(entry);
        saveLedgerEntryToFirestore(entry).catch(console.error);
      }
    });

    if (newEntries.length > 0) {
      setLedgerEntries((prev) => [...newEntries, ...prev]);
    }
  };

  // Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveUserToFirestore(user).catch(console.error);
    setIsAuthOpen(false);
  };

  const handleLogout = async () => {
    if (currentUser) {
      saveUserToLocalAccountsDb(currentUser);
      saveUserToFirestore(currentUser).catch(console.error);
    }
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('krishakarya_user');
    localStorage.removeItem('krishikulture_user');
    localStorage.removeItem('krishilink_user');
  };

  const triggerPushAlert = (
    title: string, 
    body: string, 
    soundType: 'success' | 'alert' | 'info' = 'info',
    status?: BookingStatus,
    bookingType?: 'sahyogi' | 'machinery',
    bookingId?: string
  ) => {
    sendBrowserNotification(title, {
      body,
      soundType,
      tag: bookingId ? `booking-${bookingId}-${status || 'alert'}` : undefined,
      onClick: () => {
        setActiveTab('profile');
      },
    });

    setActiveToast({
      id: `toast_${Date.now()}_${bookingId || 'gen'}`,
      title,
      body,
      status,
      bookingType,
      bookingId,
      timestamp: Date.now(),
    });
  };

  const handleBookSahyogi = (booking: Booking) => {
    setMyBookings((prev) => [booking, ...prev]);
    saveBookingToFirestore(booking).catch(console.error);
    triggerPushAlert(
      'Sahyogi Labor Booking Placed! 🌾',
      `Booking for ${booking.itemName} on ${booking.startDate} is submitted (Status: ${booking.status}). You will receive an instant notification once confirmed!`,
      'info',
      booking.status,
      'sahyogi',
      booking.id
    );
  };

  const handleBookMachinery = (booking: Booking) => {
    setMyBookings((prev) => [booking, ...prev]);
    saveBookingToFirestore(booking).catch(console.error);
    triggerPushAlert(
      'Machinery Rental Placed! 🚜',
      `Rental for ${booking.itemName} starting on ${booking.startDate} is submitted (Status: ${booking.status}). You will receive an instant notification once confirmed!`,
      'info',
      booking.status,
      'machinery',
      booking.id
    );
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus, declineReason?: string) => {
    setMyBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status,
            declineReason: declineReason !== undefined ? declineReason : b.declineReason,
          };
        }
        return b;
      })
    );

    updateBookingStatusInFirestore(bookingId, status, declineReason).catch(console.error);

    const booking = myBookings.find((b) => b.id === bookingId);
    const itemName = booking?.itemName || 'Booking';

    if (status === 'Confirmed') {
      triggerPushAlert(
        'Booking Confirmed! ✅',
        `Booking for "${itemName}" has been confirmed.`,
        'success',
        'Confirmed',
        booking?.type,
        bookingId
      );
    } else if (status === 'Declined') {
      triggerPushAlert(
        'Booking Request Declined ❌',
        `Booking request for "${itemName}" was declined.${declineReason ? ` Note: ${declineReason}` : ''}`,
        'alert',
        'Declined',
        booking?.type,
        bookingId
      );
    } else if (status === 'Cancelled') {
      triggerPushAlert(
        'Booking Cancelled',
        `Booking for "${itemName}" has been cancelled.`,
        'info',
        'Cancelled',
        booking?.type,
        bookingId
      );
    } else if (status === 'Completed') {
      triggerPushAlert(
        'Work Completed! 🌾',
        `Booking for "${itemName}" marked as completed.`,
        'success',
        'Completed',
        booking?.type,
        bookingId
      );
    }
  };

  const handleAddSahyogiReview = (sahyogiId: string, rating: number, comment: string) => {
    setSahyogis((prev) =>
      prev.map((s) => {
        if (s.id === sahyogiId) {
          const newReview = {
            id: `rev_${Date.now()}`,
            authorName: currentUser?.name || 'User',
            rating: rating,
            date: new Date().toISOString().split('T')[0],
            comment: comment,
            type: 'sahyogi' as const,
          };
          const updatedReviews = [newReview, ...s.reviews];
          const avgRating = Number(
            (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
          );
          const updated = {
            ...s,
            reviews: updatedReviews,
            rating: avgRating,
            reviewCount: updatedReviews.length,
          };
          saveSahyogiToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
  };

  const handleAddMachineryReview = (machineryId: string, rating: number, comment: string) => {
    setMachineries((prev) =>
      prev.map((m) => {
        if (m.id === machineryId) {
          const newReview = {
            id: `rev_m_${Date.now()}`,
            authorName: currentUser?.name || 'User',
            rating: rating,
            date: new Date().toISOString().split('T')[0],
            comment: comment,
            type: 'machinery' as const,
          };
          const updatedReviews = [newReview, ...m.reviews];
          const avgRating = Number(
            (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
          );
          const updated = {
            ...m,
            reviews: updatedReviews,
            rating: avgRating,
            reviewCount: updatedReviews.length,
          };
          saveMachineryToFirestore(updated).catch(console.error);
          return updated;
        }
        return m;
      })
    );
  };

  const handleAddSahyogiListing = (sahyogi: Sahyogi) => {
    setSahyogis((prev) => [sahyogi, ...prev]);
    saveSahyogiToFirestore(sahyogi).catch(console.error);
  };

  const handleAddMachineryListing = (machinery: Machinery) => {
    setMachineries((prev) => [machinery, ...prev]);
    saveMachineryToFirestore(machinery).catch(console.error);
  };

  const handleUpdateSahyogi = (updated: Sahyogi) => {
    setSahyogis((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    saveSahyogiToFirestore(updated).catch(console.error);
  };

  const handleUpdateMachinery = (updated: Machinery) => {
    setMachineries((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    saveMachineryToFirestore(updated).catch(console.error);
  };

  const handleDeleteSahyogi = (id: string) => {
    setSahyogis((prev) => prev.filter((s) => s.id !== id));
    deleteSahyogiFromFirestore(id).catch(console.error);
  };

  const handleDeleteMachinery = (id: string) => {
    setMachineries((prev) => prev.filter((m) => m.id !== id));
    deleteMachineryFromFirestore(id).catch(console.error);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col font-sans bg-mesh-animated bg-grid-pattern text-slate-900 transition-colors duration-200 overflow-x-hidden">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddListing={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsAddListingOpen(true);
          }
        }}
        onOpenInbox={() => setIsInboxOpen(true)}
        onLogout={handleLogout}
        bookingCount={myBookings.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-5 py-4 pb-28 sm:pb-32 md:pb-8">
        {activeTab === 'home' && (
          <HomePage
            currentUser={currentUser}
            sahyogis={sahyogis}
            machineries={machineries}
            ledgerEntries={ledgerEntries}
            myBookings={myBookings}
            onNavigate={setActiveTab}
            onOpenAddListing={() => {
              if (!currentUser) setIsAuthOpen(true);
              else setIsAddListingOpen(true);
            }}
            onAddToLedger={handleAddLedgerEntry}
            onAddLedgerEntry={handleAddLedgerEntry}
            onDeleteLedgerEntry={handleDeleteLedgerEntry}
            onSyncBookingsToLedger={handleSyncBookingsToLedger}
            onOpenInboxWithPrompt={handleOpenInboxWithAi}
          />
        )}

        {activeTab === 'sahyogi' && (
          <SahyogiListings
            sahyogis={sahyogis}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBookSahyogi={handleBookSahyogi}
            onAddReview={handleAddSahyogiReview}
            onOpenAddListing={() => {
              if (!currentUser) setIsAuthOpen(true);
              else setIsAddListingOpen(true);
            }}
          />
        )}

        {activeTab === 'machinery' && (
          <MachineryListings
            machineries={machineries}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBookMachinery={handleBookMachinery}
            onAddReview={handleAddMachineryReview}
            onOpenAddListing={() => {
              if (!currentUser) setIsAuthOpen(true);
              else setIsAddListingOpen(true);
            }}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfile
            currentUser={currentUser}
            onUpdateUser={setCurrentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onOpenAuthModal={handleOpenAuthModal}
            myBookings={myBookings}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            sahyogis={sahyogis}
            machineries={machineries}
            ledgerEntries={ledgerEntries}
            onAddLedgerEntry={handleAddLedgerEntry}
            onDeleteLedgerEntry={handleDeleteLedgerEntry}
            onSyncBookingsToLedger={handleSyncBookingsToLedger}
            onUpdateSahyogi={handleUpdateSahyogi}
            onUpdateMachinery={handleUpdateMachinery}
            onDeleteSahyogi={handleDeleteSahyogi}
            onDeleteMachinery={handleDeleteMachinery}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'modern-farming' && (
          <ModernFarmingQA
            currentUser={currentUser}
            onOpenInboxWithAi={handleOpenInboxWithAi}
          />
        )}

        {activeTab === 'terms' && <TermsModal />}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={setActiveTab}
        onOpenAddListing={() => {
          if (!currentUser) handleOpenAuthModal('login');
          else setIsAddListingOpen(true);
        }}
      />

      {/* Global Inbox Modal (Accessible with preset AI prompts) */}
      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => {
          setIsInboxOpen(false);
          setInboxPresetPrompt(null);
        }}
        currentUser={currentUser}
        presetPrompt={inboxPresetPrompt}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authModalTab}
      />

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={isAddListingOpen}
        onClose={() => setIsAddListingOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onAddSahyogi={handleAddSahyogiListing}
        onAddMachinery={handleAddMachineryListing}
      />

      {/* Real-time Notification Toast Banner */}
      <NotificationToast
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewBooking={() => {
          setActiveTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onRequestPermission={requestBrowserNotificationPermission}
        isPermissionGranted={isNotificationPermissionGranted()}
      />
    </div>
  );
}
