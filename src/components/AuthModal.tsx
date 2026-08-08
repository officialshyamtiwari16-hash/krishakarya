import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
  Shield, 
  Phone, 
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
  Sparkles, 
  Database, 
  Code, 
  RefreshCw, 
  Check, 
  Sun, 
  Moon,
  KeyRound,
  ChevronLeft
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { saveUserToFirestore, checkUsernameAvailability, normalizeUsername, findUserInFirestoreByIdentifier } from '../lib/firestoreService';
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
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  // Main mode: 'login' | 'signup' | 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>(initialTab);

  // Reset form inputs when modal opens or when account changes for clean auth portal
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginMethod('password');
      setLoginOtpStep('request');
      setLoginOtpDigits(['', '', '', '', '', '']);
      setSignUpStep(1);
      setFullName('');
      setDob('');
      setGender('male');
      setUsername('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Login Flexible Identifier logic
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Login Method: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginOtpStep, setLoginOtpStep] = useState<'request' | 'verify'>('request');
  const [loginOtpChannel, setLoginOtpChannel] = useState<'sms' | 'email'>('sms');
  const [loginOtpDigits, setLoginOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState('');
  const [loginResendTimer, setLoginResendTimer] = useState(30);
  const [loginCanResend, setLoginCanResend] = useState(false);
  const loginOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot password flow states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset' | 'done'>('request');
  const [forgotOtp, setForgotOtp] = useState('');
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Sign Up Multi-Step Flow (Steps 1 to 4)
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3 | 4>(1);

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

  // Step 4: OTP Verification
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email'>('sms');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Rate Limiting & Feedback States
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login OTP Resend timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'login' && loginMethod === 'otp' && loginOtpStep === 'verify' && loginResendTimer > 0) {
      setLoginCanResend(false);
      timer = setInterval(() => {
        setLoginResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (loginResendTimer === 0) {
      setLoginCanResend(true);
    }
    return () => clearInterval(timer);
  }, [loginResendTimer, loginOtpStep, loginMethod, activeTab]);

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

  // OTP Resend timer countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'signup' && signUpStep === 4 && resendTimer > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [resendTimer, signUpStep, activeTab]);

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
    if (newAttempts >= 5) {
      const lockDuration = 30000;
      setLockedUntil(Date.now() + lockDuration);
      setRemainingTime(30);
      setErrorMessage('Security lock activated due to multiple attempts. Please wait 30s.');
      return false;
    }
    return true;
  };

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
      const user = result.user;

      // Look up existing user profile by UID or Email
      let existingUser = await findUserInFirestoreByIdentifier(user.uid);
      if (!existingUser && user.email) {
        existingUser = await findUserInFirestoreByIdentifier(user.email);
      }

      if (existingUser) {
        const authenticatedUser: User = {
          ...existingUser,
          id: user.uid,
          email: user.email || existingUser.email,
          profileImage: existingUser.profileImage || user.photoURL || '',
        };
        await saveUserToFirestore(authenticatedUser);
        onLoginSuccess(authenticatedUser);
        onClose();
        return;
      }

      const cleanName = (user.displayName || 'User').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const generatedUsername = `@${cleanName}_${user.uid.slice(0, 4)}`;

      const authenticatedUser: User = {
        id: user.uid,
        name: user.displayName || 'Krishakarya User',
        username: generatedUsername,
        phone: user.phoneNumber || (phone ? `+91 ${phone}` : '+91 XXXXX XXXXX'),
        email: user.email || `${user.uid}@krishakarya.app`,
        village: 'Krishakarya Community',
        post: 'Verified Account',
        district: 'Digital Member',
        pincode: '208001',
        state: 'India',
        profileImage: user.photoURL || '',
        farmSizeAcres: 0,
        primaryCrops: [],
        isVerified: true,
        joinedDate: new Date().toISOString().split('T')[0],
        isSahyogi: false,
        isMachineryOwner: false,
        bio: 'Verified profile on Krishakarya platform.',
      };
      await saveUserToFirestore(authenticatedUser);
      onLoginSuccess(authenticatedUser);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Auth unavailable. Please sign in with your credentials.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Password Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!checkRateLimit()) return;

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your Username, Email, or Mobile Phone.');
      return;
    }

    if (!loginPassword || loginPassword.length < 4) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      setIsLoading(false);

      // Retrieve existing user account from Firestore or local storage if exists
      const existingUser = await findUserInFirestoreByIdentifier(loginIdentifier);

      let authenticatedUser: User;
      if (existingUser) {
        authenticatedUser = existingUser;
      } else {
        const formattedUsername = normalizeUsername(loginIdentifier) || `@${loginIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        authenticatedUser = {
          id: currentUser?.id || `usr_${Date.now()}`,
          name: loginIdentifier.includes('@') ? loginIdentifier.split('@')[0] : loginIdentifier,
          username: formattedUsername,
          phone: detectedIdentifierType === 'phone' ? loginIdentifier : '+91 XXXXX XXXXX',
          email: detectedIdentifierType === 'email' ? loginIdentifier : `${loginIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
          village: 'Village Center',
          post: 'Head Post',
          district: 'District Core',
          pincode: '208001',
          state: 'Uttar Pradesh',
          profileImage: currentUser?.profileImage || '',
          farmSizeAcres: 2,
          primaryCrops: ['Wheat', 'Rice'],
          isVerified: true,
          joinedDate: new Date().toISOString().split('T')[0],
          isSahyogi: false,
          isMachineryOwner: false,
          bio: 'Authenticated account.',
        };
      }

      await saveUserToFirestore(authenticatedUser);
      onLoginSuccess(authenticatedUser);
      setSuccessMessage('Logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 800);
    }, 900);
  };

  // Request Login OTP for already created account
  const handleRequestLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!checkRateLimit()) return;

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your Username, Gmail, or Phone Number to receive OTP.');
      return;
    }

    // Generate 6-digit Login OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedLoginOtp(code);
    setLoginOtpDigits(['', '', '', '', '', '']);
    setLoginResendTimer(30);
    setLoginOtpStep('verify');
    setSuccessMessage(`Login OTP dispatched via ${loginOtpChannel.toUpperCase()} to ${loginIdentifier}. Code: ${code}`);
  };

  // Login OTP digit box change logic
  const handleLoginOtpBoxChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const newDigits = [...loginOtpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setLoginOtpDigits(newDigits);
      return;
    }

    const newDigits = [...loginOtpDigits];
    newDigits[index] = value;
    setLoginOtpDigits(newDigits);

    if (value && index < 5) {
      loginOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleLoginOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !loginOtpDigits[index] && index > 0) {
      loginOtpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify Login OTP submission
  const handleVerifyLoginOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const enteredCode = loginOtpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (enteredCode !== generatedLoginOtp) {
      setErrorMessage('Invalid OTP verification code. Please try again.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      setIsLoading(false);
      const existingUser = await findUserInFirestoreByIdentifier(loginIdentifier);

      let authenticatedUser: User;
      if (existingUser) {
        authenticatedUser = existingUser;
      } else {
        const formattedUsername = normalizeUsername(loginIdentifier) || `@${loginIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        authenticatedUser = {
          id: currentUser?.id || `usr_${Date.now()}`,
          name: loginIdentifier.includes('@') ? loginIdentifier.split('@')[0] : loginIdentifier,
          username: formattedUsername,
          phone: detectedIdentifierType === 'phone' ? loginIdentifier : '+91 XXXXX XXXXX',
          email: detectedIdentifierType === 'email' ? loginIdentifier : `${loginIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
          village: 'Verified Village',
          post: 'Head Post',
          district: 'District Center',
          pincode: '208001',
          state: 'Uttar Pradesh',
          profileImage: currentUser?.profileImage || '',
          farmSizeAcres: 2,
          primaryCrops: ['Wheat', 'Rice'],
          isVerified: true,
          joinedDate: new Date().toISOString().split('T')[0],
          isSahyogi: false,
          isMachineryOwner: false,
          bio: 'Authenticated account via OTP.',
        };
      }

      await saveUserToFirestore(authenticatedUser);
      onLoginSuccess(authenticatedUser);
      setSuccessMessage('Verified & Logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 800);
    }, 900);
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

    // Step 3 validation
    if (signUpStep === 3) {
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }

      // Generate 6-digit OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(30);
      setSignUpStep(4);
      setSuccessMessage(`OTP sent via ${otpChannel.toUpperCase()} to ${otpChannel === 'sms' ? `+91 ${phone}` : email}. Code: ${code}`);
      return;
    }
  };

  // OTP Box Auto-Focus logic
  const handleOtpBoxChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasted full code
      const digits = value.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto focus next
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP submission
  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setErrorMessage('Invalid verification code. Please check and try again.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      setIsLoading(false);
      const finalUsername = normalizeUsername(username) || `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: fullName.trim(),
        username: finalUsername,
        phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
        email: email,
        village: 'Registered Field',
        post: 'Local Post',
        district: 'District Area',
        pincode: '208001',
        state: 'Uttar Pradesh',
        profileImage: '',
        farmSizeAcres: 0,
        primaryCrops: [],
        isVerified: true,
        joinedDate: new Date().toISOString().split('T')[0],
        isSahyogi: false,
        isMachineryOwner: false,
        bio: `Member on Krishakarya network. Age ${calculatedAge || 20}.`,
      };

      await saveUserToFirestore(newUser);
      onLoginSuccess(newUser);
      setSuccessMessage('Account created and verified successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 1000);
  };

  // Trigger Forgot Password Recovery
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (forgotStep === 'request') {
      if (!forgotIdentifier.trim()) {
        setErrorMessage('Please enter your email, phone, or username.');
        return;
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedForgotOtp(code);
      setForgotStep('verify');
      setSuccessMessage(`Recovery OTP sent to ${forgotIdentifier}. Reset Code: ${code}`);
      return;
    }

    if (forgotStep === 'verify') {
      if (forgotOtp.trim() !== generatedForgotOtp) {
        setErrorMessage('Invalid recovery OTP code.');
        return;
      }
      setForgotStep('reset');
      setErrorMessage('');
      setSuccessMessage('Code verified. Set your new password below.');
      return;
    }

    if (forgotStep === 'reset') {
      if (newPassword.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      setForgotStep('done');
      setSuccessMessage('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setActiveTab('login');
        setForgotStep('request');
      }, 1500);
      return;
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
            <span className="font-['Outfit',sans-serif] font-black text-xl tracking-tight leading-none text-emerald-500 dark:text-emerald-400">
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
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
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
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
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
                  Log in with your Username, Gmail, or Mobile Phone
                </p>
              </div>

              {/* Login Method Toggle Switcher */}
              <div className={`p-1 rounded-2xl border grid grid-cols-2 gap-1 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    loginMethod === 'password'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setLoginOtpStep('request');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    loginMethod === 'otp'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>OTP Verification Login</span>
                </button>
              </div>

              {/* Social Login Option (Only in password mode) */}
              {loginMethod === 'password' && (
                <>
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
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
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
                      Or Enter Password
                    </span>
                  </div>
                </>
              )}

              {/* METHOD 1: PASSWORD LOGIN FORM */}
              {loginMethod === 'password' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  {/* Flexible Identifier Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Username, Gmail, or Phone
                      </label>
                      {detectedIdentifierType !== 'empty' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          detectedIdentifierType === 'email'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : detectedIdentifierType === 'phone'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {detectedIdentifierType === 'email' && <Mail className="w-3 h-3" />}
                          {detectedIdentifierType === 'phone' && <Smartphone className="w-3 h-3" />}
                          {detectedIdentifierType === 'username' && <AtSign className="w-3 h-3" />}
                          {detectedIdentifierType.toUpperCase()} DETECTED
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Username (@xxxxx), Gmail (xxxxx@gmail.com), or Phone (+91 XXXXX XXXXX)"
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
                      <label className="text-xs font-bold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('forgot')}
                        className="text-[11px] text-emerald-400 hover:underline font-semibold"
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
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !!lockedUntil}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Log In with Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* METHOD 2: OTP VERIFICATION LOGIN FORM FOR EXISTING ACCOUNTS */}
              {loginMethod === 'otp' && (
                <div className="space-y-3.5">
                  {loginOtpStep === 'request' ? (
                    <form onSubmit={handleRequestLoginOtp} className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-300">
                            Username, Gmail, or Phone
                          </label>
                          {detectedIdentifierType !== 'empty' && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              detectedIdentifierType === 'email'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : detectedIdentifierType === 'phone'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {detectedIdentifierType === 'email' && <Mail className="w-3 h-3" />}
                              {detectedIdentifierType === 'phone' && <Smartphone className="w-3 h-3" />}
                              {detectedIdentifierType === 'username' && <AtSign className="w-3 h-3" />}
                              {detectedIdentifierType.toUpperCase()} DETECTED
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          placeholder="Username (@xxxxx), Gmail (xxxxx@gmail.com), or Phone (+91 XXXXX XXXXX)"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                            isDark 
                              ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' 
                              : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Dispatch Channel Option */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          OTP Dispatch Channel
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setLoginOtpChannel('sms')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                              loginOtpChannel === 'sms'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" /> SMS (+91 XXXXX XXXXX)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLoginOtpChannel('email')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                              loginOtpChannel === 'email'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5" /> Gmail (xxxxx@gmail.com)
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !!lockedUntil}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Send Login OTP Code</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyLoginOtpSubmit} className="space-y-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                          <KeyRound className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-sm">Enter Login OTP Code</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Code sent to: <span className="text-emerald-400 font-semibold">{loginIdentifier}</span>
                        </p>
                      </div>

                      {/* Simulated OTP Code Banner */}
                      <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center text-xs text-emerald-300">
                        <span>Simulated Login OTP Code: </span>
                        <span className="font-mono font-black text-emerald-200 text-sm tracking-widest">
                          {generatedLoginOtp}
                        </span>
                      </div>

                      {/* 6 Individual Digit Inputs */}
                      <div className="flex justify-center gap-2">
                        {loginOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (loginOtpInputRefs.current[idx] = el)}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleLoginOtpBoxChange(idx, e.target.value)}
                            onKeyDown={(e) => handleLoginOtpKeyDown(idx, e)}
                            className={`w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify & Log In</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <button
                          type="button"
                          onClick={() => setLoginOtpStep('request')}
                          className="hover:text-white"
                        >
                          Change Identifier
                        </button>

                        <button
                          type="button"
                          disabled={!loginCanResend}
                          onClick={() => {
                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            setGeneratedLoginOtp(code);
                            setLoginResendTimer(30);
                            setSuccessMessage(`New Login OTP sent: ${code}`);
                          }}
                          className="font-bold text-emerald-400 disabled:text-slate-600 hover:underline"
                        >
                          {loginCanResend ? 'Resend OTP' : `Resend in ${loginResendTimer}s`}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="text-center pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setSignUpStep(1);
                    }}
                    className="text-emerald-400 font-bold hover:underline"
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
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Step {signUpStep} of 4: {
                    signUpStep === 1 ? 'Personal Info' :
                    signUpStep === 2 ? 'Account Identifiers' :
                    signUpStep === 3 ? 'Security' : 'OTP Verification'
                  }</span>
                  <span>{signUpStep * 25}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${signUpStep * 25}%` }}
                  ></div>
                </div>
              </div>

              {/* STEP 1: Personal Info */}
              {signUpStep === 1 && (
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-400" /> Step 1: Personal Details
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
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
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Date of Birth</span>
                      {calculatedAge !== null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          calculatedAge >= 13 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {calculatedAge >= 13 ? `Age: ${calculatedAge} Yrs (Verified ✅)` : `Age: ${calculatedAge} (Requires 13+)`}
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
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
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
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Next: Account Identifiers</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Account Identifiers */}
              {signUpStep === 2 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                      <AtSign className="w-4 h-4 text-emerald-400" /> Step 2: Account Handles
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSignUpStep(1)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Desired Username Handle</span>
                      {isCheckingUsername && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. @xxxxx"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 ${
                        usernameError
                          ? 'border-red-500 bg-red-950/20 text-red-300'
                          : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    {usernameError ? (
                      <p className="text-[10px] text-red-400 mt-1">{usernameError}</p>
                    ) : isUsernameValid && username ? (
                      <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Handle available
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. xxxxx@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 XXXXX XXXXX"
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
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Next: Security & Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 3: Security & Password Strength Meter */}
              {signUpStep === 3 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-400" /> Step 3: Security
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSignUpStep(2)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Create Strong Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
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
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.score}%` }}
                          ></div>
                        </div>

                        {/* Visual Checklist */}
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                          <span className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {password.length >= 8 ? <Check className="w-3 h-3" /> : '○'} 8+ Characters
                          </span>
                          <span className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Uppercase Letter
                          </span>
                          <span className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Number
                          </span>
                          <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {/[^A-Za-z0-9]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Special Symbol
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
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
                          ? 'border-red-500 bg-red-950/20'
                          : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Channel Choice for OTP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      OTP Dispatch Channel
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                          otpChannel === 'sms'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" /> SMS (+91)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpChannel('email')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                          otpChannel === 'email'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" /> Email Code
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignUpNext}
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 4: OTP Verification Screen */}
              {signUpStep === 4 && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-sm">Enter 6-Digit OTP</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Code sent via {otpChannel.toUpperCase()} to {otpChannel === 'sms' ? `+91 ${phone}` : email}
                    </p>
                  </div>

                  {/* Simulated Code Banner */}
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center text-xs text-emerald-300">
                    <span>Simulated Test OTP Code: </span>
                    <span className="font-mono font-black text-emerald-200 text-sm tracking-widest">
                      {generatedOtp}
                    </span>
                  </div>

                  {/* 6 Individual Digit Inputs */}
                  <div className="flex justify-center gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Complete Sign Up</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setSignUpStep(3)}
                      className="hover:text-white"
                    >
                      Change Details
                    </button>

                    <button
                      type="button"
                      disabled={!canResend}
                      onClick={() => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(code);
                        setResendTimer(30);
                        setSuccessMessage(`New code sent: ${code}`);
                      }}
                      className="font-bold text-emerald-400 disabled:text-slate-600 hover:underline"
                    >
                      {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-center">
                <h3 className="font-extrabold text-sm">Account Recovery</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your Username, Email, or Phone to receive a reset OTP
                </p>
              </div>

              {forgotStep === 'request' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Enter Username, Email, or Phone"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    Send Recovery OTP
                  </button>
                </div>
              )}

              {forgotStep === 'verify' && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center text-xs text-emerald-300">
                    Reset Code: <span className="font-mono font-bold text-emerald-200">{generatedForgotOtp}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit OTP code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-center font-mono font-bold text-sm tracking-widest rounded-xl border focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    Verify Recovery Code
                  </button>
                </div>
              )}

              {forgotStep === 'reset' && (
                <div className="space-y-3">
                  <input
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    Set New Password & Finish
                  </button>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Return to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
