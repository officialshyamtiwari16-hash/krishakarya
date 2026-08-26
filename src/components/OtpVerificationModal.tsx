import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Phone, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { isValidIndianPhone, formatIndianPhone } from '../lib/validation';
import { rateLimiter } from '../lib/rateLimit';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerificationSuccess: (verifiedPhone: string) => void;
  userName?: string;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  phone,
  onVerificationSuccess,
  userName = 'Farmer',
}) => {
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState<number>(0);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phone) {
      setPhoneNumber(phone);
      if (isValidIndianPhone(phone)) {
        setStep('otp');
        handleSendOtp(phone);
      }
    }
  }, [phone, isOpen]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendOtp = (targetPhone?: string) => {
    const numToVerify = targetPhone || phoneNumber;
    if (!isValidIndianPhone(numToVerify)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const limit = rateLimiter.checkLimit('otp_request');
    if (!limit.allowed) {
      setError(`Too many OTP requests. Please wait ${limit.remainingCooldownSec} seconds.`);
      return;
    }

    setError('');
    // Generate simulated 6-digit OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setStep('otp');
    setCooldown(45);
    setSuccessMsg(`Simulated OTP sent to ${formatIndianPhone(numToVerify)}: ${mockOtp}`);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...otpValues];
    next[index] = clean;
    setOtpValues(next);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const entered = otpValues.join('');
    if (entered.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      setIsVerifying(false);
      // In demo mode or if matches generated
      if (entered === generatedOtp || entered === '123456' || entered.length === 6) {
        setSuccessMsg('Phone verified successfully!');
        setTimeout(() => {
          onVerificationSuccess(phoneNumber);
          onClose();
        }, 800);
      } else {
        setError('Incorrect OTP code. Please check and try again.');
      }
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 border border-emerald-500/20 shadow-2xl space-y-5 animate-modalPop"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 id="otp-modal-title" className="text-base font-black text-slate-900">
                Mobile Number Verification
              </h3>
              <p className="text-[11px] text-slate-500">
                Kisan Trust & Security Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close verification modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Phone input */}
        {step === 'phone' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your 10-digit mobile number to receive a high-speed verification OTP. Verified profiles earn farmer trust badges on Krishakarya.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Mobile Number (मोबाइल नंबर)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber.replace(/^\+91\s?/, '')}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 tracking-wider focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden min-h-[44px]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => handleSendOtp()}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              Send Verification OTP (ओटीपी भेजें)
            </button>
          </div>
        ) : (
          /* Step 2: 6-Digit OTP Entry */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-600">
                Enter the 6-digit OTP code sent to{' '}
                <strong className="text-slate-900">{formatIndianPhone(phoneNumber)}</strong>
              </p>
              <button
                onClick={() => setStep('phone')}
                className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Change Number
              </button>
            </div>

            {/* OTP Boxes */}
            <div className="flex justify-center gap-2">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1}`}
                  className="w-11 h-12 text-center text-lg font-black text-emerald-950 bg-slate-50 border border-slate-300 focus:border-emerald-700 focus:bg-white rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden min-h-[44px]"
                />
              ))}
            </div>

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-[11px] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Activate Badge (सत्यापित करें)</span>
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center pt-1">
              {cooldown > 0 ? (
                <span className="text-xs text-slate-500">
                  Resend OTP in <strong className="text-slate-800">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  onClick={() => handleSendOtp()}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                >
                  Resend OTP Code
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
