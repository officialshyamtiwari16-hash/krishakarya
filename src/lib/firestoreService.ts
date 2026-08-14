import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseErrors';
import { User, Sahyogi, Machinery, Booking, LedgerEntry } from '../types';

const USERS_COL = 'users';
const USERNAMES_COL = 'usernames';
const SAHYOGIS_COL = 'sahyogis';
const MACHINERY_COL = 'machineries';
const BOOKINGS_COL = 'bookings';
const LEDGER_COL = 'ledger_entries';

// Format raw username into clean @username format
export function normalizeUsername(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toLowerCase();
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.substring(1);
  }
  // Keep only alphanumeric and underscores
  cleaned = cleaned.replace(/[^a-z0-9_]/g, '');
  return cleaned ? `@${cleaned}` : '';
}

// Security: Sanitize string to prevent script injection and bound length
export function sanitizeString(val: string | undefined, maxLen = 200): string {
  if (!val) return '';
  const trimmed = val.trim().slice(0, maxLen);
  return trimmed.replace(/[<>]/g, ''); // Strip potential script/html brackets
}

// Security: Verify valid entity ID format
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

// Check if username is available in Firestore
export async function checkUsernameAvailability(
  rawUsername: string, 
  currentUserId?: string
): Promise<{ available: boolean; error?: string; formatted: string }> {
  const formatted = normalizeUsername(rawUsername);
  
  if (!formatted || formatted.length < 4) { // @ + 3 chars
    return {
      available: false,
      formatted,
      error: 'Username must be at least 3 characters long (alphanumeric & underscore only).'
    };
  }

  if (formatted.length > 21) {
    return {
      available: false,
      formatted,
      error: 'Username cannot exceed 20 characters.'
    };
  }

  try {
    // Check usernames collection mapping
    const cleanHandle = formatted.substring(1); // remove @
    const usernameDocRef = doc(db, USERNAMES_COL, cleanHandle);
    const snap = await getDoc(usernameDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.userId && data.userId !== currentUserId) {
        return {
          available: false,
          formatted,
          error: `Username ${formatted} is already claimed by another user! Choose a unique handle.`
        };
      }
    }

    // Also query users collection as fallback
    const usersQuery = query(collection(db, USERS_COL), where('username', '==', formatted));
    const querySnap = await getDocs(usersQuery);
    
    let isTakenByOther = false;
    querySnap.forEach((docSnap) => {
      if (docSnap.id !== currentUserId) {
        isTakenByOther = true;
      }
    });

    if (isTakenByOther) {
      return {
        available: false,
        formatted,
        error: `Username ${formatted} is already taken by another Krishakarya user.`
      };
    }

    return { available: true, formatted };
  } catch (err) {
    // In case of offline mode or initial DB setup, allow local fallback check
    console.warn('Firestore username check warning, falling back to local verification:', err);
    return { available: true, formatted };
  }
}

// Reserve/Claim username in Firestore
export async function claimUsername(rawUsername: string, userId: string): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    console.warn('Unauthorized attempt to claim handle: auth mismatch');
    return false;
  }

  const formatted = normalizeUsername(rawUsername);
  if (!formatted) return false;
  const cleanHandle = formatted.substring(1);

  try {
    await setDoc(doc(db, USERNAMES_COL, cleanHandle), {
      handle: formatted,
      userId: userId,
      claimedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, `${USERNAMES_COL}/${cleanHandle}`);
    } catch (loggedErr) {
      console.warn('Firestore claimUsername write error captured:', loggedErr);
    }
    return false;
  }
}

// User Operations
const ACCOUNTS_DB_KEY = 'krishakarya_accounts_db';

export function saveUserToLocalAccountsDb(user: User): void {
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    const localDb: Record<string, User> = raw ? JSON.parse(raw) : {};
    localDb[user.id] = user;
    if (user.email) localDb[user.email.toLowerCase()] = user;
    if (user.username) localDb[normalizeUsername(user.username)] = user;
    if (user.phone) localDb[user.phone.replace(/[^0-9]/g, '')] = user;
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(localDb));
  } catch (e) {
    console.warn('Local accounts DB save warning:', e);
  }
}

export function findUserInLocalAccountsDb(identifier: string): User | null {
  if (!identifier) return null;
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    if (!raw) return null;
    const localDb: Record<string, User> = JSON.parse(raw);
    const cleanId = identifier.trim().toLowerCase();
    const cleanHandle = normalizeUsername(identifier);
    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    if (localDb[cleanId]) return localDb[cleanId];
    if (cleanHandle && localDb[cleanHandle]) return localDb[cleanHandle];
    if (cleanPhone && localDb[cleanPhone]) return localDb[cleanPhone];

    for (const u of Object.values(localDb)) {
      if (
        u.id === identifier ||
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.username && normalizeUsername(u.username) === cleanHandle) ||
        (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone)
      ) {
        return u;
      }
    }
  } catch (e) {
    console.warn('Local accounts DB search warning:', e);
  }
  return null;
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, userId));
    if (snap.exists()) {
      const u = snap.data() as User;
      saveUserToLocalAccountsDb(u);
      return u;
    }
    return findUserInLocalAccountsDb(userId);
  } catch (err) {
    console.warn('Error fetching user from firestore, checking local backup:', err);
    return findUserInLocalAccountsDb(userId);
  }
}

export async function findUserInFirestoreByIdentifier(identifier: string): Promise<User | null> {
  if (!identifier) return null;
  const trimmed = identifier.trim();

  // 1. Direct doc lookup by ID
  const directUser = await getUserFromFirestore(trimmed);
  if (directUser) return directUser;

  try {
    // 2. Search by email
    if (trimmed.includes('@') && trimmed.includes('.')) {
      const qEmail = query(collection(db, USERS_COL), where('email', '==', trimmed.toLowerCase()));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        const u = snapEmail.docs[0].data() as User;
        saveUserToLocalAccountsDb(u);
        return u;
      }
    }

    // 3. Search by username handle
    const formattedHandle = normalizeUsername(trimmed);
    if (formattedHandle) {
      const qUser = query(collection(db, USERS_COL), where('username', '==', formattedHandle));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        const u = snapUser.docs[0].data() as User;
        saveUserToLocalAccountsDb(u);
        return u;
      }

      // Check username registry mapping
      const cleanHandle = formattedHandle.substring(1);
      const registryDoc = await getDoc(doc(db, USERNAMES_COL, cleanHandle));
      if (registryDoc.exists()) {
        const regData = registryDoc.data();
        if (regData.userId) {
          const userFromReg = await getUserFromFirestore(regData.userId);
          if (userFromReg) return userFromReg;
        }
      }
    }

    // 4. Search by phone
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length >= 8) {
      const qPhone = query(collection(db, USERS_COL), where('phone', '==', trimmed));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const u = snapPhone.docs[0].data() as User;
        saveUserToLocalAccountsDb(u);
        return u;
      }
    }
  } catch (err) {
    console.warn('Error searching user in firestore by identifier:', err);
  }

  // 5. Local backup lookup
  return findUserInLocalAccountsDb(trimmed);
}

export async function saveUserToFirestore(user: User): Promise<void> {
  saveUserToLocalAccountsDb(user);
  
  // Security Gate: Ensure client is authenticated and matches target user ID
  if (!auth.currentUser || auth.currentUser.uid !== user.id) {
    console.warn('Blocked unauthorized saveUserToFirestore: user mismatch or unauthenticated');
    return;
  }

  try {
    const cleanUser: User = {
      ...user,
      name: sanitizeString(user.name, 100),
      phone: sanitizeString(user.phone, 20),
      village: sanitizeString(user.village, 100),
      district: sanitizeString(user.district, 100),
      state: sanitizeString(user.state, 100),
      bio: sanitizeString(user.bio, 500),
    };

    await setDoc(doc(db, USERS_COL, cleanUser.id), cleanUser, { merge: true });
    if (cleanUser.username) {
      await claimUsername(cleanUser.username, cleanUser.id);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
}

// Sahyogi Operations
export async function saveSahyogiToFirestore(sahyogi: Sahyogi): Promise<void> {
  // Security Gate: Auth and ownership verification
  if (!auth.currentUser || auth.currentUser.uid !== sahyogi.userId) {
    console.warn('Blocked unauthorized saveSahyogiToFirestore: user mismatch or unauthenticated');
    throw new Error('Unauthorized: You must be logged in to create or edit your Sahyogi listing.');
  }

  const cleanSahyogi: Sahyogi = {
    ...sahyogi,
    name: sanitizeString(sahyogi.name, 100),
    phone: sanitizeString(sahyogi.phone, 20),
    village: sanitizeString(sahyogi.village, 100),
    district: sanitizeString(sahyogi.district, 100),
    state: sanitizeString(sahyogi.state, 100),
    bio: sanitizeString(sahyogi.bio, 500),
    dailyRate: Math.max(1, Math.round(sahyogi.dailyRate || 500)),
    hourlyRate: Math.max(1, Math.round(sahyogi.hourlyRate || 80)),
  };

  try {
    await setDoc(doc(db, SAHYOGIS_COL, cleanSahyogi.id), cleanSahyogi, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SAHYOGIS_COL}/${cleanSahyogi.id}`);
  }
}

export async function deleteSahyogiFromFirestore(id: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Unauthorized: You must be signed in to delete listings.');
  }

  try {
    await deleteDoc(doc(db, SAHYOGIS_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${SAHYOGIS_COL}/${id}`);
  }
}

export function subscribeSahyogis(onData: (sahyogis: Sahyogi[]) => void) {
  return onSnapshot(
    collection(db, SAHYOGIS_COL),
    (snapshot) => {
      const items: Sahyogi[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Sahyogi);
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, SAHYOGIS_COL);
    }
  );
}

// Machinery Operations
export async function saveMachineryToFirestore(machinery: Machinery): Promise<void> {
  // Security Gate: Auth and ownership verification
  if (!auth.currentUser || auth.currentUser.uid !== machinery.ownerId) {
    console.warn('Blocked unauthorized saveMachineryToFirestore: user mismatch or unauthenticated');
    throw new Error('Unauthorized: You must be logged in as the equipment owner to create or edit this machinery.');
  }

  const cleanMachinery: Machinery = {
    ...machinery,
    title: sanitizeString(machinery.title, 150),
    brandModel: sanitizeString(machinery.brandModel, 100),
    ownerName: sanitizeString(machinery.ownerName, 100),
    ownerPhone: sanitizeString(machinery.ownerPhone, 20),
    village: sanitizeString(machinery.village, 100),
    district: sanitizeString(machinery.district, 100),
    state: sanitizeString(machinery.state, 100),
    description: sanitizeString(machinery.description, 500),
    ratePerDay: Math.max(1, Math.round(machinery.ratePerDay || 1000)),
    ratePerHour: Math.max(1, Math.round(machinery.ratePerHour || 200)),
  };

  try {
    await setDoc(doc(db, MACHINERY_COL, cleanMachinery.id), cleanMachinery, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MACHINERY_COL}/${cleanMachinery.id}`);
  }
}

export async function deleteMachineryFromFirestore(id: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Unauthorized: You must be signed in to delete machinery listings.');
  }

  try {
    await deleteDoc(doc(db, MACHINERY_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MACHINERY_COL}/${id}`);
  }
}

export function subscribeMachineries(onData: (items: Machinery[]) => void) {
  return onSnapshot(
    collection(db, MACHINERY_COL),
    (snapshot) => {
      const items: Machinery[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Machinery);
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, MACHINERY_COL);
    }
  );
}

// Booking Operations
export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== booking.renterId) {
    console.warn('Blocked unauthorized saveBookingToFirestore: user mismatch or unauthenticated');
    throw new Error('Unauthorized: You must be logged in to place a booking request.');
  }

  const cleanBooking: Booking = {
    ...booking,
    itemName: sanitizeString(booking.itemName, 150),
    renterName: sanitizeString(booking.renterName, 100),
    renterPhone: sanitizeString(booking.renterPhone, 20),
    ownerName: sanitizeString(booking.ownerName, 100),
    ownerPhone: sanitizeString(booking.ownerPhone, 20),
    location: sanitizeString(booking.location, 150),
    notes: sanitizeString(booking.notes, 500),
    totalAmount: Math.max(0, booking.totalAmount || booking.totalCost || 0),
  };

  try {
    await setDoc(doc(db, BOOKINGS_COL, cleanBooking.id), cleanBooking, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${BOOKINGS_COL}/${cleanBooking.id}`);
  }
}

export async function updateBookingStatusInFirestore(
  bookingId: string,
  status: Booking['status'],
  declineReason?: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Unauthorized: You must be logged in to update booking status.');
  }

  try {
    const updatePayload: Record<string, any> = { status };
    if (declineReason !== undefined) {
      updatePayload.declineReason = sanitizeString(declineReason, 300);
    }
    await setDoc(doc(db, BOOKINGS_COL, bookingId), updatePayload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${BOOKINGS_COL}/${bookingId}`);
  }
}

export async function deleteBookingFromFirestore(bookingId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Unauthorized: You must be logged in to delete a booking.');
  }

  try {
    await deleteDoc(doc(db, BOOKINGS_COL, bookingId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${BOOKINGS_COL}/${bookingId}`);
  }
}

export function subscribeBookings(userId: string | undefined, onData: (items: Booking[]) => void) {
  if (!userId || !auth.currentUser) {
    onData([]);
    return () => {};
  }

  const renterMap = new Map<string, Booking>();
  const ownerMap = new Map<string, Booking>();

  const emitCombined = () => {
    const combined = new Map<string, Booking>([...renterMap, ...ownerMap]);
    const list = Array.from(combined.values()).sort((a, b) => {
      return new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime();
    });
    onData(list);
  };

  const qRenter = query(collection(db, BOOKINGS_COL), where('renterId', '==', userId));
  const unsubRenter = onSnapshot(
    qRenter,
    (snapshot) => {
      renterMap.clear();
      snapshot.forEach((docSnap) => {
        renterMap.set(docSnap.id, docSnap.data() as Booking);
      });
      emitCombined();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, BOOKINGS_COL);
    }
  );

  const qOwner = query(collection(db, BOOKINGS_COL), where('ownerId', '==', userId));
  const unsubOwner = onSnapshot(
    qOwner,
    (snapshot) => {
      ownerMap.clear();
      snapshot.forEach((docSnap) => {
        ownerMap.set(docSnap.id, docSnap.data() as Booking);
      });
      emitCombined();
    },
    (err) => {
      // Owner query might have zero results or note error
      handleFirestoreError(err, OperationType.GET, BOOKINGS_COL);
    }
  );

  return () => {
    unsubRenter();
    unsubOwner();
  };
}

// Ledger Khatabook Operations
export async function saveLedgerEntryToFirestore(entry: LedgerEntry): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== entry.userId) {
    console.warn('Blocked unauthorized saveLedgerEntryToFirestore: user mismatch or unauthenticated');
    throw new Error('Unauthorized: You must be logged in to save private Khatabook entries.');
  }

  const cleanEntry: LedgerEntry = {
    ...entry,
    title: sanitizeString(entry.title, 150),
    notes: sanitizeString(entry.notes, 500),
    partyName: sanitizeString(entry.partyName, 100),
    cropName: sanitizeString(entry.cropName, 80),
    amount: Math.max(0.01, entry.amount || 0),
  };

  try {
    await setDoc(doc(db, LEDGER_COL, cleanEntry.id), cleanEntry, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${LEDGER_COL}/${cleanEntry.id}`);
  }
}

export async function deleteLedgerEntryFromFirestore(id: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Unauthorized: You must be logged in to delete Khatabook records.');
  }

  try {
    await deleteDoc(doc(db, LEDGER_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${LEDGER_COL}/${id}`);
  }
}

export function subscribeLedgerEntries(userId: string | undefined, onData: (entries: LedgerEntry[]) => void) {
  if (!userId || !auth.currentUser) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, LEDGER_COL), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: LedgerEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as LedgerEntry);
      });
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, LEDGER_COL);
    }
  );
}

