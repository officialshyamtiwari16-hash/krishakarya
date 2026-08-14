import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  Shield, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  X, 
  ArrowRight, 
  AtSign, 
  Loader2, 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  Calendar, 
  Smartphone, 
  Check, 
  Sun, 
  Moon,
  KeyRound,
  ChevronLeft
} from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { 
  saveUserToFirestore, 
  checkUsernameAvailability, 
  normalizeUsername, 
  findUserInFirestoreByIdentifier, 
  getUserFromFirestore 
} from '../lib/firestoreService';
import { KrishakaryaLogo } from './KrishakaryaLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  initialTab?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  initialTab = 'login',
}) => {
  // Theme state
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Main mode: 'login' | 'signup' | 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>(initialTab);

  // Reset form inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setLoginIdentifier('');
      setLoginPassword('');
      setSignUpStep(1);
      setFullName('');
      setDob('');
      setGender('male');
      setUsername('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setForgotEmail('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, initialTab]);

  // Login Flexible Identifier logic
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot password flow states
  const [forgotEmail, setForgotEmail] = useState('');

  // Sign Up Multi-Step Flow (Steps 1 to 3)
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'custom'>('male');

  // Step 2: Account Identifiers
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Security
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Rate Limiting & Feedback States
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Rate Limiter Timer Effect
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((lockedUntil - now) / 1000);
      if (diff <= 0) {
        setLockedUntil(null);
        setRemainingTime(0);
        setAttempts(0);
        setErrorMessage('');
      } else {
        setRemainingTime(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  if (!isOpen) return null;

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    if (lockedUntil && Date.now() < lockedUntil) {
      setErrorMessage(`Security Lockout: Please wait ${remainingTime}s.`);
      return false;
    }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= 6) {
      const lockDuration = 30000;
      setLockedUntil(Date.now() + lockDuration);
      setRemainingTime(30);
      setErrorMessage('Security rate limit: Too many attempts. Please wait 30 seconds.');
      return false;
    }
    return true;
  };

  // Detect identifier type for flexible input
  const getIdentifierType = (val: string): 'email' | 'phone' | 'username' | 'empty' => {
    const trimmed = val.trim();
    if (!trimmed) return 'empty';
    if (trimmed.includes('@') && trimmed.includes('.')) return 'email';
    if (/^\+?[0-9\s-]{8,15}$/.test(trimmed)) return 'phone';
    return 'username';
  };

  const detectedIdentifierType = getIdentifierType(loginIdentifier);

  // Calculate age from DOB
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(dob);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (score === 3) return { score: 50, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score === 4) return { score: 75, label: 'Strong', color: 'bg-green-500', text: 'text-green-500' };
    return { score: 100, label: 'Very Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Auto handle name change -> username suggestion
  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!username) {
      const suggested = '@' + val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (suggested.length >= 4) {
        handleUsernameChange(suggested);
      }
    }
  };

  // Username validation check
  const handleUsernameChange = async (val: string) => {
    setUsername(val);
    const formatted = normalizeUsername(val);
    if (!formatted || formatted.length < 4) {
      setUsernameError('Username handle must be at least 3 characters after @');
      setIsUsernameValid(false);
      return;
    }
    setIsCheckingUsername(true);
    const res = await checkUsernameAvailability(formatted);
    setIsCheckingUsername(false);

    if (!res.available) {
      setUsernameError(res.error || 'Username handle is already registered.');
      setIsUsernameValid(false);
    } else {
      setUsernameError('');
      setIsUsernameValid(true);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;

      // Look up existing user profile in Firestore
      let existingUser = await getUserFromFirestore(fbUser.uid);
      if (!existingUser && fbUser.email) {
        existingUser = await findUserInFirestoreByIdentifier(fbUser.email);
      }

      if (existingUser) {
        const authenticatedUser: User = {
          ...existingUser,
          id: fbUser.uid,
          email: fbUser.email || existingUser.email,
          profileImage: existingUser.profileImage || fbUser.photoURL || '',
        };
        await saveUserToFirestore(authenticatedUser);
        onLoginSuccess(authenticatedUser);
        onClose();
        return;
      }

      const cleanName = (fbUser.displayName || 'User').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const generatedUsername = `@${cleanName}_${fbUser.uid.slice(0, 4)}`;

      const authenticatedUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Krishakarya Member',
        username: generatedUsername,
        phone: fbUser.phoneNumber || '+91 XXXXX XXXXX',
        email: fbUser.email || `${fbUser.uid}@krishakarya.app`,
        village: 'Village Center',
        post: 'Post Office',
        district: 'Main District',
        pincode: '208001',
        state: 'Uttar Pradesh',
        profileImage: fbUser.photoURL || '',
        farmSizeAcres: 0,
        primaryCrops: [],
        isVerified: true,
        joinedDate: new Date().toISOString().split('T')[0],
        isSahyogi: false,
        isMachineryOwner: false,
        bio: 'Verified member on Krishakarya platform.',
      };
      await saveUserToFirestore(authenticatedUser);
      onLoginSuccess(authenticatedUser);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup
        return;
      }
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Real Firebase Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!checkRateLimit()) return;

    const trimmedIdentifier = loginIdentifier.trim();
    if (!trimmedIdentifier) {
      setErrorMessage('Please enter your Username, Email, or Mobile Phone.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      let targetEmail = trimmedIdentifier;

      // If user provided username or phone instead of email, look up their account email from Firestore
      if (!trimmedIdentifier.includes('@')) {
        const foundUser = await findUserInFirestoreByIdentifier(trimmedIdentifier);
        if (!foundUser || !foundUser.email) {
          throw new Error('No account found matching this identifier. Please check or sign up.');
        }
        targetEmail = foundUser.email;
      }

      // Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
      const fbUser = userCredential.user;

      // Fetch user profile from Firestore
      let userProfile = await getUserFromFirestore(fbUser.uid);
      if (!userProfile) {
        userProfile = await findUserInFirestoreByIdentifier(targetEmail);
      }

      if (!userProfile) {
        const defaultUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || targetEmail.split('@')[0],
          username: `@${targetEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          phone: fbUser.phoneNumber || '+91 XXXXX XXXXX',
          email: fbUser.email || targetEmail,
          village: 'Village Center',
          post: 'Main Post Office',
          district: 'District',
          pincode: '208001',
          state: 'Uttar Pradesh',
          profileImage: fbUser.photoURL || '',
          farmSizeAcres: 0,
          primaryCrops: [],
          isVerified: true,
          joinedDate: new Date().toISOString().split('T')[0],
          isSahyogi: false,
          isMachineryOwner: false,
        };
        await saveUserToFirestore(defaultUser);
        userProfile = defaultUser;
      } else {
        userProfile = { ...userProfile, id: fbUser.uid };
      }

      setSuccessMessage('Logged in successfully!');
      onLoginSuccess(userProfile);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMessage('Invalid username/email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please reset your password or try again later.');
      } else {
        setErrorMessage(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up step progress helper
  const handleSignUpNext = () => {
    setErrorMessage('');
    
    // Step 1 validation
    if (signUpStep === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!dob) {
        setErrorMessage('Please select your Date of Birth.');
        return;
      }
      if (calculatedAge !== null && calculatedAge < 13) {
        setErrorMessage('You must be at least 13 years old to create an account.');
        return;
      }
      setSignUpStep(2);
      return;
    }

    // Step 2 validation
    if (signUpStep === 2) {
      if (!isUsernameValid || usernameError) {
        setErrorMessage('Please choose a valid unique username handle.');
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
        return;
      }
      if (phone.replace(/\D/g, '').length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile phone number.');
        return;
      }
      setSignUpStep(3);
      return;
    }
  };

  // Real Firebase Sign Up Submission
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      const finalUsername = normalizeUsername(username) || `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      const newUser: User = {
        id: fbUser.uid,
        name: fullName.trim(),
        username: finalUsername,
        phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
        email: email.trim(),
        village: 'Village Center',
        post: 'Head Post Office',
        district: 'Main District',
        pincode: '208001',
        state: 'Uttar Pradesh',
        profileImage: '',
        farmSizeAcres: 0,
        primaryCrops: [],
        isVerified: true,
        joinedDate: new Date().toISOString().split('T')[0],
        isSahyogi: false,
        isMachineryOwner: false,
        bio: `Member on Krishakarya network.`,
      };

      await saveUserToFirestore(newUser);
      setSuccessMessage('Account created successfully!');
      onLoginSuccess(newUser);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use a stronger password.');
      } else {
        setErrorMessage(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real Firebase Password Reset Email
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      let targetEmail = trimmed;
      if (!trimmed.includes('@')) {
        const foundUser = await findUserInFirestoreByIdentifier(trimmed);
        if (!foundUser || !foundUser.email) {
          throw new Error('No account found matching this username or phone.');
        }
        targetEmail = foundUser.email;
      }

      await sendPasswordResetEmail(auth, targetEmail);
      setSuccessMessage(`Password reset link has been dispatched to ${targetEmail}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset email. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = themeMode === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div 
        className={`relative w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden my-auto max-h-[94vh] flex flex-col transition-colors duration-200 ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Bar */}
        <div className={`px-5 py-4 border-b flex items-center justify-between flex-shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <KrishakaryaLogo size={32} />
            <span className="font-['Outfit',sans-serif] font-black text-xl tracking-tight leading-none text-emerald-700 dark:text-emerald-400">
              Krishakarya
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isDark 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Secure Auth Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              title="Toggle Light / Dark Mode"
              className={`p-1.5 rounded-xl border transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`grid grid-cols-2 border-b text-xs font-bold flex-shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-100/60'
        }`}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-3 text-center transition-all border-b-2 ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setSignUpStep(1);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-3 text-center transition-all border-b-2 ${
              activeTab === 'signup'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Rate Limit Banner */}
          {lockedUntil && (
            <div className="mb-4 bg-amber-950/80 border border-amber-800 text-amber-300 rounded-2xl p-3.5 text-xs flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-200">Security Rate Limit Active</p>
                <p className="text-[11px] text-amber-300/80">
                  Please wait <span className="font-mono font-bold text-amber-100">{remainingTime}s</span> before attempting again.
                </p>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && !lockedUntil && (
            <div className="mb-4 bg-red-950/60 border border-red-800 text-red-300 rounded-2xl p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl p-3 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FLOW */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-black tracking-tight">Welcome Back</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sign in to your Krishakarya account with Email, Username, or Google
                </p>
              </div>

              {/* Social Login Option */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || !!lockedUntil}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
                </div>
                <span className={`relative px-2 text-[10px] uppercase font-bold tracking-wider ${
                  isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'
                }`}>
                  Or Sign In with Password
                </span>
              </div>

              {/* PASSWORD LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Flexible Identifier Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email, Username, or Phone
                    </label>
                    {detectedIdentifierType !== 'empty' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        detectedIdentifierType === 'email'
                          ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                          : detectedIdentifierType === 'phone'
                          ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      }`}>
                        {detectedIdentifierType === 'email' && <Mail className="w-3 h-3" />}
                        {detectedIdentifierType === 'phone' && <Smartphone className="w-3 h-3" />}
                        {detectedIdentifierType === 'username' && <AtSign className="w-3 h-3" />}
                        {detectedIdentifierType.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter email, @username, or phone"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark 
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-[11px] text-emerald-600 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        isDark 
                          ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !!lockedUntil}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className={`text-center pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setSignUpStep(1);
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Create New Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP MULTI-STEP FLOW */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              {/* Step Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Step {signUpStep} of 3: {
                    signUpStep === 1 ? 'Personal Info' :
                    signUpStep === 2 ? 'Account Identifiers' : 'Security & Password'
                  }</span>
                  <span>{Math.round((signUpStep / 3) * 100)}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${(signUpStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* STEP 1: Personal Info */}
              {signUpStep === 1 && (
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-600" /> Step 1: Personal Details
                  </h3>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span>Date of Birth</span>
                      {calculatedAge !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          calculatedAge >= 13 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600'
                        }`}>
                          {calculatedAge >= 13 ? `Age: ${calculatedAge} Yrs (Eligible)` : `Age: ${calculatedAge} (Requires 13+)`}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Gender Selection
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['female', 'male', 'custom'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                            gender === g
                              ? 'bg-emerald-800 text-white border-emerald-700 shadow-sm'
                              : isDark 
                              ? 'bg-slate-800/60 border-slate-700 text-slate-400' 
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignUpNext}
                    className="w-full mt-2 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Account Handles</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Account Identifiers */}
              {signUpStep === 2 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                      <AtSign className="w-4 h-4 text-emerald-600" /> Step 2: Account Handles
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSignUpStep(1)}
                      className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span>Desired Username Handle</span>
                      {isCheckingUsername && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. @farmer_ramesh"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 ${
                        usernameError
                          ? 'border-red-500 bg-red-950/20 text-red-400'
                          : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {usernameError ? (
                      <p className="text-[10px] text-red-500 mt-1">{usernameError}</p>
                    ) : isUsernameValid && username ? (
                      <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Handle available
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSignUpNext}
                    className="w-full mt-2 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Security & Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 3: Security & Password Strength Meter */}
              {signUpStep === 3 && (
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" /> Step 3: Security & Create Account
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSignUpStep(2)}
                      className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Create Strong Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Dynamic Strength Meter */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span>Password Strength:</span>
                          <span className={passwordStrength.text}>{passwordStrength.label}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.score}%` }}
                          ></div>
                        </div>

                        {/* Visual Checklist */}
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                          <span className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {password.length >= 8 ? <Check className="w-3 h-3" /> : '○'} 8+ Characters
                          </span>
                          <span className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Uppercase
                          </span>
                          <span className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Number
                          </span>
                          <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {/[^A-Za-z0-9]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Symbol
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create & Register Profile</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-extrabold text-sm">Account Recovery</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Enter your registered Email Address or Username to receive a password reset link.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Registered Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter email (name@domain.com) or @username"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
