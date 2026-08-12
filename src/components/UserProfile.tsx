import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Sahyogi, Machinery, Booking, LedgerEntry } from '../types';
import { 
  User as UserIcon, 
  MapPin, 
  Upload, 
  Edit3, 
  Calendar, 
  Users, 
  Tractor, 
  ShieldCheck, 
  Save,
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Activity,
  AtSign,
  Loader2,
  Trash2,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  LogIn,
  LogOut,
  Sparkles,
  Shield,
  Key,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { checkUsernameAvailability, normalizeUsername, saveUserToFirestore } from '../lib/firestoreService';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { KisanKhatabook } from './KisanKhatabook';
import { AnimatedCounter } from './AnimatedCounter';

interface UserProfileProps {
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  onOpenAuthModal?: (initialTab?: 'login' | 'signup') => void;
  myBookings: Booking[];
  sahyogis: Sahyogi[];
  machineries: Machinery[];
  ledgerEntries?: LedgerEntry[];
  onAddLedgerEntry?: (entry: LedgerEntry) => void;
  onDeleteLedgerEntry?: (id: string) => void;
  onSyncBookingsToLedger?: () => void;
  onUpdateSahyogi: (sahyogi: Sahyogi) => void;
  onUpdateMachinery: (machinery: Machinery) => void;
  onDeleteSahyogi?: (id: string) => void;
  onDeleteMachinery?: (id: string) => void;
  onNavigate: (tab: 'sahyogi' | 'machinery') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  onUpdateUser,
  onLoginSuccess,
  onLogout,
  onOpenAuthModal,
  myBookings,
  sahyogis,
  machineries,
  ledgerEntries = [],
  onAddLedgerEntry = () => {},
  onDeleteLedgerEntry = () => {},
  onSyncBookingsToLedger = () => {},
  onUpdateSahyogi,
  onUpdateMachinery,
  onDeleteSahyogi,
  onDeleteMachinery,
  onNavigate,
}) => {
  const { t } = useLanguage();

  // Active Subtab for Logged In User
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'profile' | 'security' | 'bookings' | 'listings' | 'khatabook'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);

  // Existing User Profile Edit Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [profileUsernameError, setProfileUsernameError] = useState('');
  const [isProfileCheckingUsername, setIsProfileCheckingUsername] = useState(false);
  const [isProfileUsernameValid, setIsProfileUsernameValid] = useState(true);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [village, setVillage] = useState(currentUser?.village || '');
  const [post, setPost] = useState(currentUser?.post || '');
  const [district, setDistrict] = useState(currentUser?.district || '');
  const [pincode, setPincode] = useState(currentUser?.pincode || '');
  const [stateName, setStateName] = useState(currentUser?.state || '');
  const [farmSize, setFarmSize] = useState((currentUser?.farmSizeAcres ?? 0).toString());
  const [primaryCrops, setPrimaryCrops] = useState((currentUser?.primaryCrops || []).join(', '));
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '');

  // Security & Password Change States
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2-Step Verification (2FA) States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(currentUser?.twoFactorEnabled || false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'email' | 'app'>(currentUser?.twoFactorMethod || 'sms');
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'verify'>('idle');
  const [twoFactorOtpCode, setTwoFactorOtpCode] = useState('');
  const [generated2FAOtp, setGenerated2FAOtp] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>(currentUser?.backupCodes || []);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Keep state in sync if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.username || `@${currentUser.name.toLowerCase().replace(/\s+/g, '_')}`);
      setPhone(currentUser.phone);
      setEmail(currentUser.email);
      setVillage(currentUser.village || '');
      setPost(currentUser.post || '');
      setDistrict(currentUser.district || '');
      setPincode(currentUser.pincode || '');
      setStateName(currentUser.state || '');
      setFarmSize((currentUser.farmSizeAcres ?? 0).toString());
      setPrimaryCrops((currentUser.primaryCrops || []).join(', '));
      setBio(currentUser.bio || '');
      setProfileImage(currentUser.profileImage || '');
      setTwoFactorEnabled(currentUser.twoFactorEnabled || false);
      setTwoFactorMethod(currentUser.twoFactorMethod || 'sms');
      setBackupCodes(currentUser.backupCodes || []);
    }
  }, [currentUser]);

  // Username Handler for Profile Editing
  const handleProfileUsernameChange = async (val: string) => {
    setUsername(val);
    if (!currentUser) return;
    const formatted = normalizeUsername(val);
    if (!formatted || formatted.length < 4) {
      setProfileUsernameError('Username must be at least 3 characters after @');
      setIsProfileUsernameValid(false);
      return;
    }

    setIsProfileCheckingUsername(true);
    const res = await checkUsernameAvailability(formatted, currentUser.id);
    setIsProfileCheckingUsername(false);

    if (!res.available) {
      setProfileUsernameError(res.error || 'This handle is claimed by another user!');
      setIsProfileUsernameValid(false);
    } else {
      setProfileUsernameError('');
      setIsProfileUsernameValid(true);
    }
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!isProfileUsernameValid || profileUsernameError) {
      alert('Please enter a valid & unique username handle before saving.');
      return;
    }

    const finalUsername = normalizeUsername(username) || `@user_${Date.now().toString().slice(-6)}`;

    const updated: User = {
      ...currentUser,
      name,
      username: finalUsername,
      phone,
      email,
      village,
      post,
      district,
      pincode,
      state: stateName,
      farmSizeAcres: parseFloat(farmSize) || 0,
      primaryCrops: primaryCrops.split(',').map((c) => c.trim()).filter(Boolean),
      bio,
      profileImage,
    };

    await saveUserToFirestore(updated);
    onUpdateUser(updated);
    setIsEditing(false);
    alert('User Profile details & unique handle updated successfully!');
  };

  const toggleSahyogiStatus = (s: Sahyogi) => {
    const nextStatus = s.availabilityStatus === 'available' ? 'busy' : 'available';
    onUpdateSahyogi({ ...s, availabilityStatus: nextStatus });
  };

  const toggleMachineStatus = (m: Machinery) => {
    const nextStatus = m.availabilityStatus === 'available' ? 'rented' : 'available';
    onUpdateMachinery({ ...m, availabilityStatus: nextStatus });
  };

  // Render Sign In / Register prompt card when not logged in
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <UserIcon className="w-8 h-8 text-emerald-700" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Welcome to <span className="text-emerald-700 dark:text-emerald-400">Krishakarya</span> Profile
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Sign in to your account or register a new profile to view your bookings, manage listings, access Khatabook farm ledger, and update security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onOpenAuthModal?.('login')}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-300" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => onOpenAuthModal?.('signup')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-200" />
              <span className="text-white">Register / Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    );
  }



  // Security Handlers
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!newPasswordInput || newPasswordInput.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const updatedUser: User = {
        ...currentUser!,
        password: newPasswordInput,
      };
      await saveUserToFirestore(updatedUser);
      onUpdateUser(updatedUser);
      setSecuritySuccess('Password successfully updated and encrypted!');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleInitiate2FASetup = () => {
    setSecurityError('');
    setSecuritySuccess('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGenerated2FAOtp(code);
    setTwoFactorOtpCode('');
    setTwoFactorStep('verify');
  };

  const handleVerifyAndActivate2FA = async () => {
    setSecurityError('');
    if (twoFactorOtpCode.trim() !== generated2FAOtp) {
      setSecurityError('Invalid 2FA verification code. Please check and try again.');
      return;
    }

    const generatedBackupCodes = Array.from({ length: 4 }, () => 
      'KBK-' + Math.floor(1000 + Math.random() * 9000).toString()
    );

    try {
      const updatedUser: User = {
        ...currentUser!,
        twoFactorEnabled: true,
        twoFactorMethod: twoFactorMethod,
        backupCodes: generatedBackupCodes,
      };
      await saveUserToFirestore(updatedUser);
      onUpdateUser(updatedUser);
      setTwoFactorEnabled(true);
      setBackupCodes(generatedBackupCodes);
      setTwoFactorStep('idle');
      setSecuritySuccess('2-Step Verification is now ACTIVE on your profile! Save your emergency backup codes below.');
    } catch (err: any) {
      setSecurityError('Failed to activate 2-Step Verification.');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2-Step Verification? Your account security level will be reduced.')) {
      return;
    }
    try {
      const updatedUser: User = {
        ...currentUser!,
        twoFactorEnabled: false,
        backupCodes: [],
      };
      await saveUserToFirestore(updatedUser);
      onUpdateUser(updatedUser);
      setTwoFactorEnabled(false);
      setBackupCodes([]);
      setTwoFactorStep('idle');
      setSecuritySuccess('2-Step Verification disabled.');
    } catch (err: any) {
      setSecurityError('Failed to disable 2-Step Verification.');
    }
  };

  // Render Logged In Profile Dashboard
  const mySahyogiListings = (sahyogis || []).filter((s) => s.userId === currentUser.id);
  const myMachineryListings = (machineries || []).filter((m) => m.ownerId === currentUser.id);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Profile Card - Centered Top */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 relative"
      >
        
        {/* Top Account Switcher & Logout Bar */}
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 icon-micro-rotate" /> Logged In Account
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenAuthModal?.('login')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-700" /> Sign In (Switch)
            </button>

            <button
              onClick={() => onOpenAuthModal?.('signup')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer btn-futuristic"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-200" /> Register / Add Account
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            )}
          </div>
        </div>

        <div className="relative group flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-emerald-50 ring-4 ring-emerald-600/30 shadow-md flex items-center justify-center text-emerald-800 overflow-hidden">
            {profileImage && profileImage.trim().length > 0 ? (
              <img
                src={profileImage}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-emerald-700" />
            )}
          </div>
          {isEditing && (
            <label className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-white cursor-pointer opacity-90 transition-opacity">
              <Upload className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{currentUser.name}</h1>
            <span className="bg-emerald-800 text-white font-mono text-[11px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <AtSign className="w-3 h-3 text-emerald-300" />
              {currentUser.username || `@${currentUser.name.toLowerCase().replace(/\s+/g, '_')}`}
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Member
            </span>
          </div>

          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{currentUser.village || 'Address'}, Post: {currentUser.post || 'Post Office'}, District: {currentUser.district || 'District'}, Pincode: {currentUser.pincode || 'Pincode'}, {currentUser.state || 'State'}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs">
            <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
              Phone: {currentUser.phone || 'Phone Number'}
            </span>
            <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
              Farm: <AnimatedCounter value={currentUser.farmSizeAcres || 0} /> Acres
            </span>
            <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-md text-[11px]">
              Crops: {(currentUser.primaryCrops || []).length > 0 ? currentUser.primaryCrops.join(', ') : 'Crops'}
            </span>
          </div>
        </div>

        {/* Navigation Button Bar */}
        <div className="pt-2 w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 bg-slate-100/80 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                activeSubTab === 'dashboard'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSubTab('khatabook')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                activeSubTab === 'khatabook'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Khatabook</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('profile');
                setIsEditing(true);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                activeSubTab === 'profile' || activeSubTab === 'security'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                activeSubTab === 'bookings'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bookings (<AnimatedCounter value={myBookings.length} />)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('listings')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                activeSubTab === 'listings'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Listings (<AnimatedCounter value={mySahyogiListings.length + myMachineryListings.length} />)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* SUBTAB 1: DASHBOARD STATS */}
      {activeSubTab === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase">Total Bookings</span>
                <Calendar className="w-4 h-4 text-emerald-600 icon-micro-rotate" />
              </div>
              <p className="text-2xl font-black text-slate-900"><AnimatedCounter value={myBookings.length} /></p>
              <p className="text-[10px] text-emerald-700 font-bold">Sahyogi Labor & Machinery</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase">Active Listings</span>
                <Users className="w-4 h-4 text-emerald-600 icon-micro-rotate" />
              </div>
              <p className="text-2xl font-black text-slate-900"><AnimatedCounter value={mySahyogiListings.length + myMachineryListings.length} /></p>
              <p className="text-[10px] text-emerald-700 font-bold">Labor & Equipment Services</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase">Farm Size</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 icon-micro-rotate" />
              </div>
              <p className="text-2xl font-black text-slate-900"><AnimatedCounter value={currentUser.farmSizeAcres ?? 0} /> Acres</p>
              <p className="text-[10px] text-slate-500 font-medium">Cultivated Area</p>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase">Khatabook Total</span>
                <BookOpen className="w-4 h-4 text-amber-500 icon-micro-rotate" />
              </div>
              <p className="text-2xl font-black text-slate-900"><AnimatedCounter value={ledgerEntries.length} /> Records</p>
              <p className="text-[10px] text-amber-700 font-bold">Ledger Transactions</p>
            </div>
          </div>

          {/* Embedded Ledger Quick View */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Kisan Bahi Khata Quick Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('khatabook')}
                className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 transition-all"
              >
                Open Full Khatabook →
              </button>
            </div>

            <KisanKhatabook
              currentUser={currentUser}
              ledgerEntries={ledgerEntries}
              myBookings={myBookings}
              onAddLedgerEntry={onAddLedgerEntry}
              onDeleteLedgerEntry={onDeleteLedgerEntry}
              onSyncBookingsToLedger={onSyncBookingsToLedger}
            />
          </div>
        </motion.div>
      )}

      {/* SUBTAB 2: FULL KHATABOOK */}
      {activeSubTab === 'khatabook' && (
        <KisanKhatabook
          currentUser={currentUser}
          ledgerEntries={ledgerEntries}
          myBookings={myBookings}
          onAddLedgerEntry={onAddLedgerEntry}
          onDeleteLedgerEntry={onDeleteLedgerEntry}
          onSyncBookingsToLedger={onSyncBookingsToLedger}
        />
      )}


      {/* SUBTAB 2: EDIT PROFILE & SECURITY (2FA) */}
      {(activeSubTab === 'profile' || activeSubTab === 'security') && (
        <div className="space-y-6">
          {/* PROFILE & FARM DETAILS FORM */}
          <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Account & Farm Details</h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Step 1: Basic Info
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Unique Handle (@username)</span>
                  {isProfileCheckingUsername && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleProfileUsernameChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 ${
                    profileUsernameError ? 'border-rose-400' : 'border-slate-200'
                  }`}
                  required
                />
                {profileUsernameError && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{profileUsernameError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Village/Town</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Post Office</label>
                <input
                  type="text"
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center justify-between">
                  <span>Pincode (6 digits)</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="208001"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-extrabold text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Farm Size (Acres)</label>
                <input
                  type="number"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </div>
          </form>

          {/* MERGED SECURITY & 2-STEP VERIFICATION (2FA) SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Account Security & 2FA Protection</h3>
                  <p className="text-xs text-slate-500">Manage password security, 2-Step verification (2FA), and emergency backup codes.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                  twoFactorEnabled 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                  {twoFactorEnabled ? '2FA ACTIVE & PROTECTED' : '2FA INACTIVE'}
                </span>
              </div>
            </div>

          {/* Alert notifications */}
          {securityError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{securityError}</span>
            </div>
          )}

          {securitySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{securitySuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: CHANGE PASSWORD */}
            <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Key className="w-4 h-4 text-emerald-700" />
                <h4 className="font-extrabold text-slate-900 text-sm">Change Profile Password</h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showCurrentPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new strong password (min 6 chars)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showNewPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </form>

            {/* CARD 2: 2-STEP VERIFICATION (2FA) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-extrabold text-slate-900 text-sm">2-Step Verification (2FA)</h4>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Add an extra layer of security for protection. When signing in, a 6-digit verification OTP code will be required.
                </p>

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Verification Channel</label>
                  <select
                    value={twoFactorMethod}
                    onChange={(e) => setTwoFactorMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="sms">SMS OTP (+91 Mobile Phone)</option>
                    <option value="email">Email OTP (Gmail / Email)</option>
                    <option value="app">Authenticator App Code</option>
                  </select>
                </div>

                {/* Step 1: Initiate Setup */}
                {twoFactorStep === 'idle' && !twoFactorEnabled && (
                  <button
                    onClick={handleInitiate2FASetup}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> Enable 2-Step Verification
                  </button>
                )}

                {/* Step 2: Verification Flow */}
                {twoFactorStep === 'verify' && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Confirm 2FA OTP Code
                      </span>
                      <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        TEST CODE: {generated2FAOtp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Enter the 6-digit code sent to your preferred channel to activate extra protection:
                    </p>

                    <input
                      type="text"
                      maxLength={6}
                      value={twoFactorOtpCode}
                      onChange={(e) => setTwoFactorOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit OTP code"
                      className="w-full px-3 py-2 bg-slate-950 border border-emerald-500 rounded-xl font-mono text-center text-sm font-black text-amber-300 tracking-widest"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleVerifyAndActivate2FA}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-sm cursor-pointer"
                      >
                        Verify & Activate 2FA
                      </button>
                      <button
                        onClick={() => setTwoFactorStep('idle')}
                        className="px-3 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Status Actions & Backup Codes */}
                {twoFactorEnabled && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        2FA Active via {twoFactorMethod.toUpperCase()}
                      </span>
                      <button
                        onClick={handleDisable2FA}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Disable 2FA
                      </button>
                    </div>

                    {backupCodes.length > 0 && (
                      <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <Key className="w-3.5 h-3.5" /> Emergency Backup Codes
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(backupCodes.join('\n'));
                              setCopiedBackupCodes(true);
                              setTimeout(() => setCopiedBackupCodes(false), 2000);
                            }}
                            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-slate-200 cursor-pointer"
                          >
                            {copiedBackupCodes ? 'Copied!' : 'Copy Codes'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-center text-xs text-emerald-400 bg-slate-950 p-2 rounded-lg">
                          {backupCodes.map((code, idx) => (
                            <span key={idx} className="bg-slate-900 py-1 rounded border border-slate-800">{code}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SUBTAB 3: BOOKINGS */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">My Confirmed Bookings</h3>
          {myBookings.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border text-slate-500 text-xs">
              No active bookings found. Browse Sahyogi labor or Machinery to book.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBookings.map((b) => (
                <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 uppercase">{b.type} BOOKING</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {b.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{b.itemName}</h4>
                  <p className="text-xs text-slate-600">Start Date: {b.startDate} | Rate: ₹{b.totalCost}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: LISTINGS */}
      {activeSubTab === 'listings' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-between">
              <span>My Listed Sahyogi Labor ({mySahyogiListings.length})</span>
            </h3>
            {mySahyogiListings.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border">No labor listings published yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mySahyogiListings.map((s) => (
                  <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">{s.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSahyogiStatus(s)}
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            s.availabilityStatus === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Status: {s.availabilityStatus.toUpperCase()}
                        </button>
                        {onDeleteSahyogi && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this Sahyogi listing?')) onDeleteSahyogi(s.id);
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">₹{s.dailyRate}/day | Skills: {s.skills.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-between">
              <span>My Machinery & Tractor Listings ({myMachineryListings.length})</span>
            </h3>
            {myMachineryListings.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white p-4 rounded-xl border">No machinery listings published yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myMachineryListings.map((m) => (
                  <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">{m.title}</h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleMachineStatus(m)}
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            m.availabilityStatus === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Status: {m.availabilityStatus.toUpperCase()}
                        </button>
                        {onDeleteMachinery && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this Machinery listing?')) onDeleteMachinery(m.id);
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">₹{m.ratePerDay}/day | Category: {m.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
