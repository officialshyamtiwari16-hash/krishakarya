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
import { db } from './firebase';
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
  try {
    await setDoc(doc(db, USERS_COL, user.id), user, { merge: true });
    if (user.username) {
      await claimUsername(user.username, user.id);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
}

// Sahyogi Operations
export async function saveSahyogiToFirestore(sahyogi: Sahyogi): Promise<void> {
  try {
    await setDoc(doc(db, SAHYOGIS_COL, sahyogi.id), sahyogi, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SAHYOGIS_COL}/${sahyogi.id}`);
  }
}

export async function deleteSahyogiFromFirestore(id: string): Promise<void> {
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
  try {
    await setDoc(doc(db, MACHINERY_COL, machinery.id), machinery, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MACHINERY_COL}/${machinery.id}`);
  }
}

export async function deleteMachineryFromFirestore(id: string): Promise<void> {
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
  try {
    await setDoc(doc(db, BOOKINGS_COL, booking.id), booking, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${BOOKINGS_COL}/${booking.id}`);
  }
}

export function subscribeBookings(onData: (items: Booking[]) => void) {
  return onSnapshot(
    collection(db, BOOKINGS_COL),
    (snapshot) => {
      const items: Booking[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Booking);
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, BOOKINGS_COL);
    }
  );
}

// Ledger Khatabook Operations
export async function saveLedgerEntryToFirestore(entry: LedgerEntry): Promise<void> {
  try {
    await setDoc(doc(db, LEDGER_COL, entry.id), entry, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${LEDGER_COL}/${entry.id}`);
  }
}

export async function deleteLedgerEntryFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, LEDGER_COL, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${LEDGER_COL}/${id}`);
  }
}

export function subscribeLedgerEntries(userId: string, onData: (entries: LedgerEntry[]) => void) {
  if (!userId) {
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

