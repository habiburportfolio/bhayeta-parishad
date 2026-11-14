import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Mail, 
  Smartphone, 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { Language, OrganizationProfile, SecurityOtpSession } from '../types';
import { 
  getAdminSecurity, 
  generateSecurityOtp, 
  verifySecurityOtp, 
  verifyMasterRecoveryKey, 
  saveAdminPin, 
  syncAdminPinToCloud,
  resetFailedAttempts 
} from '../utils/storage';
import { toBengaliDigits } from '../utils/numberToWords';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationProfile;
  lang: Language;
  onSuccess: (newPin: string) => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
  isOpen,
  onClose,
  org,
  lang,
  onSuccess,
}) => {
  const isBn = lang === 'bn';
  const security = getAdminSecurity();

  // Mode: 'method' | 'verify' | 'new_password' | 'success'
  const [step, setStep] = useState<'method' | 'verify' | 'new_password' | 'success'>('method');
  const [method, setMethod] = useState<'mobile' | 'email' | 'master_key'>('mobile');
  
  // OTP state
  const [otpSession, setOtpSession] = useState<SecurityOtpSession | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // New Password state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Masking helpers
  const maskPhone = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 8) return phone;
    const start = clean.slice(0, 5);
    const end = clean.slice(-2);
    return `${start}*****${end}`;
  };

  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 3 ? `${name.slice(0, 3)}****` : `${name}***`;
    return `${maskedName}@${domain}`;
  };

  const activeMobile = security.recoveryPhone || org.phones[0] || '০১৭১৬-৮৩৬৯২১';
  const activeEmail = security.recoveryEmail || org.email || 'bhayetagjp@gmail.com';

  // Timer countdown
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setErrorMsg('');
      setEnteredOtp('');
      setMasterKeyInput('');
      setNewPin('');
      setConfirmPin('');
      setTimerSeconds(0);
      setOtpSession(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setErrorMsg('');
    if (method === 'master_key') {
      setStep('verify');
      return;
    }

    setIsSendingOtp(true);
    try {
      const destination = method === 'mobile' ? activeMobile : activeEmail;
      const session = await generateSecurityOtp(method, destination);
      setOtpSession(session);
      setTimerSeconds(300); // 5 minutes
      setStep('verify');
    } catch (e) {
      setErrorMsg(isBn ? 'কোড পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to dispatch verification code. Please retry.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify Code
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (method === 'master_key') {
      if (!masterKeyInput.trim()) {
        setErrorMsg(isBn ? 'অনুগ্রহ করে মাস্টার সিকিউরিটি কি লিখুন।' : 'Please enter master recovery key.');
        return;
      }
      if (verifyMasterRecoveryKey(masterKeyInput)) {
        setStep('new_password');
      } else {
        setErrorMsg(isBn ? 'ভুল মাস্টার সিকিউরিটি কি! অনুগ্রহ করে সঠিক কি লিখুন।' : 'Invalid master recovery key. Please check and re-enter.');
      }
      return;
    }

    if (enteredOtp.length !== 6) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সঠিক ৬ সংখ্যার ওটিপি কোড লিখুন।' : 'Please enter a valid 6-digit OTP code.');
      return;
    }

    if (verifySecurityOtp(enteredOtp)) {
      setStep('new_password');
    } else {
      setErrorMsg(isBn ? 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি কোড! অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'Invalid or expired OTP code! Please try again.');
    }
  };

  // Step 3: Save New PIN
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPin.length < 4) {
      setErrorMsg(isBn ? 'নতুন পাসওয়ার্ড বা পিন কমপক্ষে ৪ সংখ্যার হতে হবে!' : 'New password must be at least 4 digits!');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg(isBn ? 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মেলেনি!' : 'Passwords do not match!');
      return;
    }

    setIsSaving(true);
    try {
      saveAdminPin(newPin);
      await syncAdminPinToCloud(newPin);
      resetFailedAttempts();
      setStep('success');
      setTimeout(() => {
        onSuccess(newPin);
        onClose();
      }, 1800);
    } catch {
      setErrorMsg(isBn ? 'পাসওয়ার্ড সংরক্ষণে সমস্যা হয়েছে।' : 'Failed to save new password.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const str = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return isBn ? toBengaliDigits(str) : str;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isBn ? 'অ্যাডমিন পাসওয়ার্ড রিসেট ও যাচাইকরণ' : 'Admin Security & Password Reset'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {isBn ? 'দ্বি-স্তরীয় সুরক্ষা ও পরিচয় যাচাই' : '2-Factor Verification & Recovery'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Verification Method */}
          {step === 'method' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {isBn ? '১. যাচাইকরণ মাধ্যম নির্বাচন করুন' : '1. Choose Verification Method'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isBn 
                    ? 'নিরাপত্তার স্বার্থে পাসওয়ার্ড রিসেট করতে আপনার নিবন্ধিত মোবাইল নম্বর বা ইমেইলে একটি এককালীন ওটিপি কোড পাঠানো হবে।' 
                    : 'To protect your organization, an OTP verification code will be sent to your registered contact.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Option 1: Mobile */}
                <label 
                  onClick={() => setMethod('mobile')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    method === 'mobile' 
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{isBn ? 'নিবন্ধিত মোবাইল নম্বর (SMS / OTP)' : 'Registered Mobile (SMS / OTP)'}</p>
                      <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">
                        {isBn ? toBengaliDigits(maskPhone(activeMobile)) : maskPhone(activeMobile)}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="resetMethod"
                    checked={method === 'mobile'}
                    onChange={() => setMethod('mobile')}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700"
                  />
                </label>

                {/* Option 2: Email */}
                <label 
                  onClick={() => setMethod('email')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    method === 'email' 
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{isBn ? 'নিবন্ধিত ই-মেইল ঠিকানা' : 'Registered Email Address'}</p>
                      <p className="text-xs font-mono font-semibold text-blue-900 mt-0.5">
                        {maskEmail(activeEmail)}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="resetMethod"
                    checked={method === 'email'}
                    onChange={() => setMethod('email')}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700"
                  />
                </label>

                {/* Option 3: Master Recovery Key */}
                <label 
                  onClick={() => setMethod('master_key')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    method === 'master_key' 
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{isBn ? 'মাস্টার সিকিউরিটি রিকভারি কি' : 'Master Security Recovery Key'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isBn ? '১৬ ডিজিটের জরুরি অফলাইন কোড' : '16-character emergency offline key'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="resetMethod"
                    checked={method === 'master_key'}
                    onChange={() => setMethod('master_key')}
                    className="w-4 h-4 text-emerald-700 accent-emerald-700"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSendingOtp ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {method === 'master_key' 
                    ? (isBn ? 'পরবর্তী ধাপে যান' : 'Continue to Verification') 
                    : (isBn ? '৬ ডিজিটের ওটিপি কোড পাঠান' : 'Send 6-Digit OTP Code')}
                </span>
              </button>
            </div>
          )}

          {/* STEP 2: Enter OTP / Master Key */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {isBn ? '২. ভেরিফিকেশন কোড লিখুন' : '2. Enter Verification Code'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {method === 'master_key' ? (
                    isBn 
                      ? 'আপনার সংরক্ষিত ১৬ সংখ্যার মাস্টার সিকিউরিটি রিকভারি কি লিখুন।' 
                      : 'Enter your 16-character master security recovery key.'
                  ) : (
                    isBn 
                      ? `আপনার ${method === 'mobile' ? 'মোবাইলে' : 'ই-মেইলে'} প্রেরিত ৬ ডিজিটের ওটিপি কোডটি নিচে লিখুন (মেয়াদ ৫ মিনিট)।` 
                      : `Enter the 6-digit OTP code sent to your ${method === 'mobile' ? 'mobile' : 'email'} (valid for 5 mins).`
                  )}
                </p>
              </div>

              {/* Master Key Input */}
              {method === 'master_key' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'মাস্টার সিকিউরিটি কি' : 'Master Security Key'}
                  </label>
                  <input
                    type="text"
                    value={masterKeyInput}
                    onChange={(e) => setMasterKeyInput(e.target.value.toUpperCase())}
                    placeholder="BHYT-XXXX-XXXX-XXXX"
                    required
                    className="w-full text-center px-4 py-3 text-base font-mono font-bold tracking-wider border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none uppercase"
                    autoFocus
                  />
                </div>
              ) : (
                /* 6-Digit OTP Input */
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{isBn ? '৬ ডিজিটের ওটিপি কোড' : '6-Digit OTP Code'}</span>
                      {timerSeconds > 0 ? (
                        <span className="text-emerald-700 font-mono font-bold">
                          ⏱ {formatTimer(timerSeconds)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-emerald-800 underline hover:text-emerald-950 font-bold cursor-pointer"
                        >
                          {isBn ? 'পুনরায় কোড পাঠান' : 'Resend Code'}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••••"
                      required
                      className="w-full text-center px-4 py-3 text-2xl font-mono font-bold tracking-[0.4em] border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Real-time verification notice box */}
                  {otpSession && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-emerald-900">
                        <span>{isBn ? '✓ কোড সফলভাবে পাঠানো হয়েছে' : '✓ Code Dispatched'}</span>
                        <span className="font-mono text-[11px] bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded font-bold">
                          {isBn ? `ওটিপি: ${toBengaliDigits(otpSession.code)}` : `OTP: ${otpSession.code}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-snug">
                        {isBn 
                          ? `নিবন্ধিত গন্তব্য: ${maskPhone(otpSession.destination)} | তাৎক্ষণিক পরীক্ষার সুবিধার্থে ওটিপি প্রদর্শিত হয়েছে।` 
                          : `Sent to: ${maskPhone(otpSession.destination)} | Instant OTP surfaced for seamless testing.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {isBn ? 'পিছনে' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isBn ? 'কোড যাচাই করুন' : 'Verify & Proceed'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 'new_password' && (
            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{isBn ? 'পরিচয় সফলভাবে যাচাই সম্পন্ন হয়েছে! নতুন পাসওয়ার্ড দিন।' : 'Identity verified! Set your new password.'}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'নতুন পাসওয়ার্ড / পিন কোড' : 'New Password / PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder={isBn ? 'কমপক্ষে ৪ সংখ্যার পিন বা পাসওয়ার্ড' : 'At least 4 characters/digits'}
                    minLength={4}
                    maxLength={16}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-sans pr-10 focus:border-emerald-600 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'নতুন পাসওয়ার্ড পুনরায় নিশ্চিত করুন' : 'Confirm New Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder={isBn ? 'নতুন পাসওয়ার্ড আবার লিখুন' : 'Re-enter new password'}
                  minLength={4}
                  maxLength={16}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-sans focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{isBn ? 'পাসওয়ার্ড রিসেট ও সংরক্ষণ করুন' : 'Save & Sync New Password'}</span>
              </button>
            </form>
          )}

          {/* STEP 4: Success Message */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' : 'Password Reset Successful!'}
              </h4>
              <p className="text-xs text-slate-500">
                {isBn ? 'নতুন পাসওয়ার্ডটি ক্লাউডে সিঙ্ক হয়েছে। এখন লগইন করতে পারেন।' : 'Your new password has been synced to cloud. Logging you in...'}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};