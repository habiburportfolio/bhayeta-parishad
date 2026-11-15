import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Key, 
  UserCheck, 
  FileText,
  Printer,
  Settings,
  ShieldCheck,
  Smartphone,
  Mail,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { CollectionReceipt, Language, MemberApplication, OrganizationProfile } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { exportMembersToExcel, exportMemberToDoc, triggerPrint } from '../utils/exportTools';
import { toBengaliDigits } from '../utils/numberToWords';
import { 
  exportEntireDatabase, 
  restoreEntireDatabase, 
  saveAdminPin, 
  syncAdminPinToCloud,
  getAdminSecurity, 
  saveAdminSecurity, 
  generateSecurityOtp, 
  verifySecurityOtp, 
  recordFailedAttempt, 
  resetFailedAttempts, 
  getLockoutStatus, 
  syncAdminSecurityToCloud 
} from '../utils/storage';
import { AdmissionFormPrintView } from './AdmissionFormPrintView';
import { AdminResetPasswordModal } from './AdminResetPasswordModal';

interface AdminPanelProps {
  members: MemberApplication[];
  receipts: CollectionReceipt[];
  adminPin: string;
  org: OrganizationProfile;
  lang: Language;
  onUpdateMember: (member: MemberApplication) => void;
  onDeleteMember: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onReloadAllData: () => void;
  onUpdateAdminPin?: (pin: string) => void;
  onOpenSettings?: () => void;
  isUnlocked?: boolean;
  onUnlock?: () => void;
  onLock?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  members,
  receipts,
  adminPin,
  org,
  lang,
  onUpdateMember,
  onDeleteMember,
  onDeleteReceipt,
  onReloadAllData,
  onUpdateAdminPin,
  onOpenSettings,
  isUnlocked: controlledIsUnlocked,
  onUnlock,
  onLock,
}) => {
  const t = TRANSLATIONS[lang];
  const isBn = lang === 'bn';

  // Auth lock (controlled or internal)
  const [internalUnlocked, setInternalUnlocked] = useState(false);
  const isUnlocked = controlledIsUnlocked !== undefined ? controlledIsUnlocked : internalUnlocked;

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active admin tab: 'members' | 'receipts' | 'backup'
  const [activeTab, setActiveTab] = useState<'members' | 'receipts' | 'backup'>('members');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<MemberApplication | null>(null);

  // Security & Reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [securityProfile, setSecurityProfile] = useState(getAdminSecurity());

  // In-tab PIN change OTP state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [changePinMethod, setChangePinMethod] = useState<'mobile' | 'email'>('mobile');
  const [changePinOtp, setChangePinOtp] = useState('');
  const [isSendingChangeOtp, setIsSendingChangeOtp] = useState(false);
  const [changeOtpTimer, setChangeOtpTimer] = useState(0);
  const [changeOtpNotice, setChangeOtpNotice] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [pinChangedMsg, setPinChangedMsg] = useState('');
  const [copiedMasterKey, setCopiedMasterKey] = useState(false);

  // Recovery contacts editing
  const fallbackPhone = (org?.phones && org.phones.length > 0) ? org.phones[0] : '০১৭১৬-৮৩৬৯২১';
  const fallbackEmail = org?.email || 'bhayetagjp@gmail.com';
  const [editRecoveryEmail, setEditRecoveryEmail] = useState(securityProfile?.recoveryEmail || fallbackEmail);
  const [editRecoveryPhone, setEditRecoveryPhone] = useState(securityProfile?.recoveryPhone || fallbackPhone);
  const [recoveryContactsSavedMsg, setRecoveryContactsSavedMsg] = useState('');

  // Check lockout on mount
  useEffect(() => {
    const status = getLockoutStatus();
    if (status.isLocked) {
      setLockoutSeconds(status.remainingSeconds);
    }
  }, []);

  // Countdown for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          resetFailedAttempts();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Countdown for in-tab OTP
  useEffect(() => {
    if (changeOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setChangeOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [changeOtpTimer]);

  // Unlock check with Brute-Force Rate Limiting
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const status = getLockoutStatus();
    if (status.isLocked) {
      setPinError(
        isBn 
          ? `⚠️ অতিরিক্ত ভুল চেষ্টার কারণে প্যানেল সাময়িকভাবে লক রয়েছে। ${toBengaliDigits(status.remainingSeconds)} সেকেন্ড অপেক্ষা করুন।`
          : `⚠️ Temporarily locked due to too many failed attempts. Please wait ${status.remainingSeconds}s.`
      );
      return;
    }

    if (pinInput === adminPin) {
      resetFailedAttempts();
      setInternalUnlocked(true);
      onUnlock?.();
      setPinError('');
    } else {
      const result = recordFailedAttempt();
      if (result.isLocked) {
        setLockoutSeconds(300);
        setPinError(
          isBn 
            ? '⚠️ ৫ বার ভুল পিন দেওয়ার কারণে অ্যাডমিন প্যানেল ৫ মিনিটের জন্য লক করা হয়েছে। পাসওয়ার্ড ভুলে গেলে নিচে "রিসেট করুন" বাটনে ক্লিক করুন।'
            : '⚠️ 5 failed attempts. Admin panel locked for 5 minutes. If forgotten, click Reset below.'
        );
      } else {
        setPinError(
          isBn 
            ? `ভুল পিন কোড! আর ${toBengaliDigits(result.attemptsLeft)} বার চেষ্টা করা যাবে।`
            : `Incorrect PIN! ${result.attemptsLeft} attempts remaining.`
        );
      }
    }
  };

  // Send OTP for Change PIN
  const handleSendChangePinOtp = async () => {
    setIsSendingChangeOtp(true);
    setPinErrorMsg('');
    try {
      const destination = changePinMethod === 'mobile' 
        ? (securityProfile?.recoveryPhone || fallbackPhone) 
        : (securityProfile?.recoveryEmail || fallbackEmail);
      const session = await generateSecurityOtp(changePinMethod, destination);
      setChangeOtpTimer(300);
      setChangeOtpNotice(
        isBn 
          ? `✓ আপনার নিবন্ধিত ${changePinMethod === 'mobile' ? 'মোবাইলে' : 'ই-মেইলে'} ৬ ডিজিটের ওটিপি পাঠানো হয়েছে (কোড: ${toBengaliDigits(session.code)})` 
          : `✓ 6-digit OTP sent to your registered ${changePinMethod} (Code: ${session.code})`
      );
    } catch {
      setPinErrorMsg(isBn ? 'ওটিপি কোড পাঠাতে সমস্যা হয়েছে।' : 'Failed to send OTP code.');
    } finally {
      setIsSendingChangeOtp(false);
    }
  };

  // Change PIN with Mandatory OTP Verification
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinErrorMsg('');
    setPinChangedMsg('');

    if (currentPinInput !== adminPin) {
      setPinErrorMsg(isBn ? 'বর্তমান পিন কোডটি সঠিক নয়!' : 'Current PIN does not match!');
      return;
    }
    if (newPin.length < 4) {
      setPinErrorMsg(isBn ? 'নতুন পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে!' : 'New PIN must be at least 4 digits!');
      return;
    }
    if (newPin !== confirmPin) {
      setPinErrorMsg(isBn ? 'নতুন পিন ও কনফার্ম পিন মেলেনি!' : 'New PIN and confirm PIN do not match!');
      return;
    }

    // MANDATORY OTP VERIFICATION
    if (!changePinOtp.trim()) {
      setPinErrorMsg(isBn ? 'পাসওয়ার্ড পরিবর্তনের জন্য মোবাইল বা ইমেইল ভেরিফিকেশন কোড (OTP) প্রদান আবশ্যক!' : 'OTP verification is mandatory to change password!');
      return;
    }

    if (!verifySecurityOtp(changePinOtp)) {
      setPinErrorMsg(isBn ? 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি কোড! অনুগ্রহ করে নতুন কোড নিয়ে চেষ্টা করুন।' : 'Invalid or expired OTP code! Please try again.');
      return;
    }

    saveAdminPin(newPin);
    await syncAdminPinToCloud(newPin);
    onUpdateAdminPin?.(newPin);
    setPinChangedMsg(isBn ? '✓ মোবাইল/ইমেইল যাচাই সম্পন্ন! অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন ও ক্লাউডে সিঙ্ক হয়েছে।' : '✓ Verified! Admin password successfully updated and synced to cloud.');
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    setChangePinOtp('');
    setChangeOtpNotice('');
    setTimeout(() => setPinChangedMsg(''), 6000);
  };

  // Save Recovery Contacts
  const handleSaveRecoveryContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...securityProfile,
      recoveryEmail: editRecoveryEmail.trim(),
      recoveryPhone: editRecoveryPhone.trim(),
    };
    saveAdminSecurity(updated);
    setSecurityProfile(updated);
    await syncAdminSecurityToCloud(updated);
    setRecoveryContactsSavedMsg(isBn ? '✓ রিকভারি মোবাইল ও ইমেইল সফলভাবে সংরক্ষিত হয়েছে!' : '✓ Recovery contacts updated successfully!');
    setTimeout(() => setRecoveryContactsSavedMsg(''), 4000);
  };

  // Status toggle
  const toggleStatus = (member: MemberApplication) => {
    const updated: MemberApplication = {
      ...member,
      status: member.status === 'approved' ? 'pending' : 'approved',
      approvalDate: member.status === 'approved' ? '' : new Date().toISOString().slice(0, 10),
    };
    onUpdateMember(updated);
  };

  // Restore file
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && restoreEntireDatabase(text)) {
          alert(isBn ? 'ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে!' : 'Database successfully restored!');
          onReloadAllData();
        } else {
          alert(isBn ? 'ভুল ফাইল ফরম্যাট!' : 'Invalid backup JSON file!');
        }
      };
      reader.readAsText(file);
    }
  };

  // Filtered members
  const safeMemberList = Array.isArray(members) ? members.filter(Boolean) : [];
  const filteredMembers = safeMemberList.filter((m) => {
    if (!m) return false;
    const matchesQuery = 
      m.fullNameBn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primaryMobile?.includes(searchQuery) ||
      m.memberIdNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.presentAddress?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.presentAddress?.villageOrArea?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true : m.status === statusFilter;

    return Boolean(matchesQuery && matchesStatus);
  });

  // KPI counts
  const approvedMembersCount = safeMemberList.filter((m) => m?.status === 'approved').length;
  const pendingMembersCount = safeMemberList.filter((m) => m?.status === 'pending').length;
  const safeReceipts = Array.isArray(receipts) ? receipts.filter(Boolean) : [];
  const totalCollections = safeReceipts.reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);

  // If locked, render PIN screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.adminTitle}</h2>
            <p className="text-xs text-slate-500 mt-1">{t.adminPinPrompt}</p>
          </div>

          {lockoutSeconds > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {isBn 
                  ? `অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে লক। অপেক্ষা করুন: ${toBengaliDigits(lockoutSeconds)} সেকেন্ড` 
                  : `Temporarily locked. Retry in: ${lockoutSeconds}s`}
              </span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={16}
                value={pinInput}
                disabled={lockoutSeconds > 0}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={t.adminPinPlaceholder}
                className="w-full text-center px-4 py-3 text-lg font-bold tracking-widest border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed font-sans"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-600 mt-1.5 font-medium leading-relaxed">{pinError}</p>}
            </div>

            <button
              type="submit"
              disabled={lockoutSeconds > 0}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{t.unlockAdmin}</span>
            </button>
          </form>

          {/* Forgot Password / Reset Trigger */}
          <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isBn ? 'পাসওয়ার্ড ভুলে গেছেন? রিসেট করুন' : 'Forgot Password? Reset Here'}</span>
            </button>
            <p className="text-[10.5px] text-slate-400">
              {isBn 
                ? 'সুরক্ষা নিশ্চিত করতে মোবাইল/ইমেইল ওটিপি এবং ব্রুট-ফোর্স প্রটেকশন সক্রিয়।' 
                : 'Secured with 2-Factor OTP Verification & Brute-Force Rate Limiting.'}
            </p>
          </div>
        </div>

        <AdminResetPasswordModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          org={org}
          lang={lang}
          onSuccess={(newP) => {
            onUpdateAdminPin?.(newP);
            setPinInput(newP);
            setInternalUnlocked(true);
            onUnlock?.();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & KPI Stat Cards */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t.adminTitle}</h2>
              <p className="text-xs text-slate-500">
                {isBn ? 'সদস্য তালিকা ও আর্থিক রিপোর্ট' : 'Member Directory & Financial Management'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100 cursor-pointer"
                title="প্রতিষ্ঠান তথ্য ও অঙ্গীকারনামা সম্পাদনা"
              >
                <Settings className="w-3.5 h-3.5 text-teal-700" />
                <span>{isBn ? 'অঙ্গীকারনামা ও প্রতিষ্ঠান' : 'Declaration & Settings'}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('backup')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer shadow-xs"
            >
              <Key className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change PIN'}</span>
            </button>

            <button
              onClick={() => exportMembersToExcel(members, lang)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{t.exportAllExcel}</span>
            </button>

            <button
              onClick={() => {
                setInternalUnlocked(false);
                onLock?.();
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="লক করুন"
            >
              <Lock className="w-4 h-4 inline mr-1" />
              <span>লক</span>
            </button>
          </div>
        </div>

        {/* 3 KPI Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">{t.totalMembers}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {isBn ? toBengaliDigits(members.length) : members.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase">{t.approvedCount}</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {isBn ? toBengaliDigits(approvedMembersCount) : approvedMembersCount}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase">{t.totalCollected}</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {isBn ? `${toBengaliDigits(totalCollections)} ৳` : `${totalCollections} BDT`}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
          {[
            { id: 'members', label: `${t.membersTab} (${members.length})` },
            { id: 'receipts', label: `${t.receiptsTab} (${receipts.length})` },
            { id: 'backup', label: isBn ? '🔑 পাসওয়ার্ড পরিবর্তন ও ব্যাকআপ' : '🔑 Change PIN & Backup' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1: Member Roster ================= */}
      {activeTab === 'members' && (
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">{t.allStatuses}</option>
                <option value="approved">{t.approvedCount}</option>
                <option value="pending">{t.pendingCount}</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3">ছবি ও নাম</th>
                  <th className="px-3 py-3">{isBn ? 'আইডি / অনলাইন ফরম নং' : 'ID / Online Form No'}</th>
                  <th className="px-3 py-3">মোবাইল</th>
                  <th className="px-3 py-3">ঠিকানা</th>
                  <th className="px-3 py-3">সদস্যপদ ও চাঁদা</th>
                  <th className="px-3 py-3">স্ট্যাটাস</th>
                  <th className="px-3 py-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                      কোনো সদস্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Photo & Name */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-600">
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              m.fullNameBn?.slice(0, 1) || 'ভা'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{m.fullNameBn || m.fullNameEn}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-sans">{m.fullNameEn}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID / Form */}
                      <td className="px-3 py-3 font-sans">
                        <span className="font-bold text-emerald-900">{m.memberIdNo || (isBn ? 'প্রক্রিয়াধীন' : 'Pending')}</span>
                        <div className="text-[10px] text-slate-400">ফরম: {m.formNo}</div>
                      </td>

                      {/* Mobile */}
                      <td className="px-3 py-3 font-sans">{m.primaryMobile}</td>

                      {/* Address */}
                      <td className="px-3 py-3 max-w-[180px] truncate">
                        {m.presentAddress?.villageOrArea || ''}, {m.presentAddress?.upazila || ''}, {m.presentAddress?.district || ''}
                      </td>

                      {/* Tier & Fee */}
                      <td className="px-3 py-3">
                        <span className="font-medium text-slate-800">{m.membershipType}</span>
                        <div className="text-[11px] text-emerald-800 font-bold">
                          {(() => {
                            const feeVal = m.monthlyFee === 'other' ? (m.customMonthlyFee || 'অন্যান্য') : m.monthlyFee;
                            return isBn ? `${toBengaliDigits(feeVal)} ৳/মাস` : `${feeVal} BDT/m`;
                          })()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleStatus(m)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            m.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {m.status === 'approved' ? t.approved : t.suspended}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => setSelectedMemberForModal(m)}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                          title="১:১ ফর্ম ভিউ ও প্রিন্ট"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => exportMemberToDoc(m, org, lang)}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Docs / Word এ ডাউনলোড"
                        >
                          <FileText className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(t.confirmDelete)) {
                              onDeleteMember(m.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: Receipts Ledger ================= */}
      {activeTab === 'receipts' && (
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">{t.receiptLedger}</h3>
            <span className="text-xs font-semibold text-slate-500">
              মোট: {isBn ? toBengaliDigits(totalCollections) : totalCollections} টাকা
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">{t.slNo}</th>
                  <th className="px-3 py-2.5">{t.receiptDate}</th>
                  <th className="px-3 py-2.5">{t.payerName}</th>
                  <th className="px-3 py-2.5">{t.payerAddress}</th>
                  <th className="px-3 py-2.5">{t.amountInDigits}</th>
                  <th className="px-3 py-2.5">{t.collectorSign}</th>
                  <th className="px-3 py-2.5 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-bold font-sans">
                      {isBn ? toBengaliDigits(r.serialNo) : r.serialNo}
                    </td>
                    <td className="px-3 py-2.5 font-sans">{r.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{r.payerName}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate">{r.address}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-900">
                      {isBn ? `${toBengaliDigits(r.amount)}/-` : `${r.amount}/-`}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{r.receivedBy || '-'}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onDeleteReceipt(r.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: Backup & PIN Security ================= */}
      {activeTab === 'backup' && (
        <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Backup & Restore Database */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">{t.backupDatabase}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBn 
                ? 'আপনার সকল সদস্যের তথ্য, আদায়কৃত রশীদ ও সংরক্ষিত চিঠি ব্যাকআপ ফাইল হিসেবে ডাউনলোড করে নিরাপদে সংরক্ষণ করুন।'
                : 'Download full JSON database snapshot including member rosters, receipts, and letterhead records.'}
            </p>

            <button
              onClick={exportEntireDatabase}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isBn ? 'ব্যাকআপ ফাইল ডাউনলোড করুন (JSON)' : 'Download Backup JSON'}</span>
            </button>

            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">{t.restoreDatabase}</label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>
          </div>

          {/* Change PIN / Password with 2FA Mobile/Email Verification */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {isBn ? 'পাসওয়ার্ড পরিবর্তন (ওটিপি যাচাই বাধ্যতামূলক)' : 'Change PIN (Mandatory 2FA OTP)'}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                {isBn ? '২-স্তরীয় সুরক্ষা' : '2-Factor Security'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBn 
                ? 'যেকোনো ধরনের অননুমোদিত অ্যাক্সেস ঠেকাতে পাসওয়ার্ড পরিবর্তনের সময় আপনার নিবন্ধিত মোবাইল বা ইমেইলে প্রেরিত ওটিপি যাচাই করা বাধ্যতামূলক।' 
                : 'To prevent unauthorized changes, password modification strictly requires 6-digit OTP verification via your registered contact.'}
            </p>

            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'বর্তমান পিন কোড' : 'Current PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder={isBn ? 'বর্তমান পিন লিখুন' : 'Enter current PIN'}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'নতুন পাসওয়ার্ড / পিন' : 'New PIN'}
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder={isBn ? 'নতুন ৪+ ডিজিটের পিন' : 'New PIN (4+ digits)'}
                    minLength={4}
                    maxLength={16}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? 'নতুন পিন পুনরায় নিশ্চিত করুন' : 'Confirm New PIN'}
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder={isBn ? 'নতুন পিন আবার লিখুন' : 'Re-enter new PIN'}
                    minLength={4}
                    maxLength={16}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
                  />
                </div>
              </div>

              {/* Mandatory OTP Verification Section */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>{isBn ? 'যাচাইকরণ মাধ্যম ও ওটিপি (OTP)' : 'Verification Channel & OTP'}</span>
                  </div>
                  {changeOtpTimer > 0 && (
                    <span className="text-emerald-700 font-mono font-bold">
                      ⏱ {isBn ? toBengaliDigits(changeOtpTimer) : changeOtpTimer}s
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="changePinChannel"
                      checked={changePinMethod === 'mobile'}
                      onChange={() => setChangePinMethod('mobile')}
                      className="accent-emerald-700"
                    />
                    <span>{isBn ? 'মোবাইল (SMS/OTP)' : 'Mobile (SMS)'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="changePinChannel"
                      checked={changePinMethod === 'email'}
                      onChange={() => setChangePinMethod('email')}
                      className="accent-emerald-700"
                    />
                    <span>{isBn ? 'ই-মেইল' : 'Email'}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={changePinOtp}
                    onChange={(e) => setChangePinOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="৬ ডিজিটের ওটিপি কোড"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={handleSendChangePinOtp}
                    disabled={isSendingChangeOtp || changeOtpTimer > 0}
                    className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg text-xs transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    {isSendingChangeOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    <span>
                      {changeOtpTimer > 0 
                        ? (isBn ? 'কোড পাঠানো হয়েছে' : 'Code Sent') 
                        : (isBn ? 'ওটিপি কোড পাঠান' : 'Send OTP')}
                    </span>
                  </button>
                </div>

                {changeOtpNotice && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11.5px] text-emerald-900 font-medium">
                    {changeOtpNotice}
                  </div>
                )}
              </div>

              {pinErrorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                  {pinErrorMsg}
                </div>
              )}

              {pinChangedMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold">
                  {pinChangedMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isBn ? 'যাচাই সম্পন্ন করে পাসওয়ার্ড সংরক্ষণ করুন' : 'Verify & Save New Password'}</span>
              </button>
            </form>
          </div>

          {/* Master Recovery Key & Security Contacts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-700" />
              <h3 className="text-base font-bold text-slate-900">
                {isBn ? 'মাস্টার সিকিউরিটি রিকভারি কি (জরুরি ব্যাকআপ)' : 'Master Security Recovery Key'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBn 
                ? 'যদি কখনো মোবাইল বা ইমেইল অ্যাক্সেস হারিয়ে ফেলেন, তবে এই ১৬ সংখ্যার গোপন মাস্টার কি ব্যবহার করে তাৎক্ষণিক পাসওয়ার্ড রিসেট করা যাবে। এটি নিরাপদ কোথাও লিখে বা কপি করে রাখুন।' 
                : 'Emergency 16-character master key to bypass OTP and reset password if your phone or email is lost.'}
            </p>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono text-sm sm:text-base font-extrabold text-amber-950 tracking-wider">
                {securityProfile.masterRecoveryKey}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(securityProfile.masterRecoveryKey);
                  setCopiedMasterKey(true);
                  setTimeout(() => setCopiedMasterKey(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                {copiedMasterKey ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-amber-800" />}
                <span>{copiedMasterKey ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি করুন' : 'Copy Key')}</span>
              </button>
            </div>

            {/* Recovery Contacts Form */}
            <form onSubmit={handleSaveRecoveryContacts} className="pt-3 border-t border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-800">
                {isBn ? 'ভেরিফিকেশন কন্টাক্ট নম্বর ও ইমেইল' : 'Registered Recovery Contacts'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {isBn ? 'রিকভারি মোবাইল নম্বর' : 'Recovery Mobile'}
                  </label>
                  <input
                    type="text"
                    value={editRecoveryPhone}
                    onChange={(e) => setEditRecoveryPhone(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {isBn ? 'রিকভারি ই-মেইল' : 'Recovery Email'}
                  </label>
                  <input
                    type="email"
                    value={editRecoveryEmail}
                    onChange={(e) => setEditRecoveryEmail(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-sans font-medium"
                  />
                </div>
              </div>

              {recoveryContactsSavedMsg && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg">
                  {recoveryContactsSavedMsg}
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
              >
                {isBn ? 'কন্টাক্ট তথ্য আপডেট করুন' : 'Update Contacts'}
              </button>
            </form>
          </div>

          {/* Organization Profile & Declaration Quick Access */}
          {onOpenSettings && (
            <div className="md:col-span-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-6 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-800" />
                  <h3 className="text-base font-bold text-slate-900">
                    {isBn ? 'সংগঠনের তথ্য ও ভর্তি ফরমের অঙ্গীকারনামা' : 'Organization Profile & Declaration'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {isBn 
                    ? 'ভর্তি ফরমের অঙ্গীকারনামা (Declaration Text), সংগঠনের নাম, লোগো, ঠিকানা ও মোবাইল নম্বর যেকোনো সময় পরিবর্তন করতে পারবেন।'
                    : 'Edit admission form declaration text, organization name, official logo, address, and contact numbers.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>{isBn ? 'অঙ্গীকারনামা ও সেটিংস সম্পাদনা' : 'Edit Declaration & Info'}</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* Member Details Modal / 1:1 Print Preview Dialog */}
      {selectedMemberForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 print:p-0 print:max-h-none print:overflow-visible print:rounded-none print:shadow-none print:border-none print:w-full">
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedMemberForModal.fullNameBn || selectedMemberForModal.fullNameEn} - ফরম প্রিভিউ
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrint()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
                <button
                  onClick={() => setSelectedMemberForModal(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>

            <div className="print-only-container">
              <AdmissionFormPrintView
                member={selectedMemberForModal}
                org={org}
                lang={lang}
                isBlank={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Printable Member Directory List (Prints cleanly when quick print is triggered from Admin Panel) */}
      {!selectedMemberForModal && isUnlocked && (
        <div className="hidden print:block print:w-full print:m-0 print:p-6 print:text-black font-serif">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-emerald-800 mb-4">
            <h1 className="text-xl font-bold text-emerald-950">
              {org.nameBn}
            </h1>
            <p className="text-xs text-slate-700">
              {org.addressBn} | মোবাইল: {Array.isArray(org.phones) ? org.phones.join(', ') : ''}
            </p>
            <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-400 rounded-md text-xs font-bold mt-2">
              {activeTab === 'receipts' ? 'আদায় রশিদ বহি রেজিস্টার' : 'সাধারণ ও আজীবন সদস্য তালিকা (Member Directory)'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD')} | মোট: {toBengaliDigits(activeTab === 'receipts' ? receipts.length : members.length)} টি
            </p>
          </div>

          {activeTab === 'receipts' ? (
            /* Printable Receipts Table */
            <table className="w-full text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                  <th className="border border-slate-400 px-2 py-1 text-center">রশিদ নং</th>
                  <th className="border border-slate-400 px-2 py-1 text-center">তারিখ</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">প্রদানকারীর নাম</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">ঠিকানা</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">বিবরণ</th>
                  <th className="border border-slate-400 px-2 py-1 text-right">পরিমাণ (টাকা)</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r, idx) => (
                  <tr key={r.id || idx} className="border-b border-slate-300">
                    <td className="border border-slate-300 px-2 py-1 text-center font-bold">{toBengaliDigits(r.serialNo)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-sans">{r.date}</td>
                    <td className="border border-slate-300 px-2 py-1 font-semibold">{r.payerName}</td>
                    <td className="border border-slate-300 px-2 py-1">{r.address}</td>
                    <td className="border border-slate-300 px-2 py-1">{r.purpose}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right font-bold">{toBengaliDigits(r.amount)}/-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Printable Members Table */
            <table className="w-full text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                  <th className="border border-slate-400 px-2 py-1 text-center w-10">ক্র.</th>
                  <th className="border border-slate-400 px-2 py-1 text-center w-16">ফরম নং</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">সদস্যের নাম</th>
                  <th className="border border-slate-400 px-2 py-1 text-left">পিতা/স্বামীর নাম</th>
                  <th className="border border-slate-400 px-2 py-1 text-center">মোবাইল নম্বর</th>
                  <th className="border border-slate-400 px-2 py-1 text-center">সদস্য পদ</th>
                  <th className="border border-slate-400 px-2 py-1 text-center">সদস্য আইডি</th>
                  <th className="border border-slate-400 px-2 py-1 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={m.id || idx} className="border-b border-slate-300">
                    <td className="border border-slate-300 px-2 py-1 text-center font-bold">{toBengaliDigits(idx + 1)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-bold">{toBengaliDigits(m.formNo)}</td>
                    <td className="border border-slate-300 px-2 py-1 font-semibold">
                      {m.fullNameBn || m.fullNameEn}
                    </td>
                    <td className="border border-slate-300 px-2 py-1">{m.fatherName || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-sans">{m.primaryMobile || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {m.membershipType === 'lifetime' ? 'আজীবন' : m.membershipType === 'donor' ? 'দাতা' : 'সাধারণ'}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-sans font-bold">{m.memberIdNo || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {m.status === 'approved' ? 'অনুমোদিত' : 'বিবেচনাধীন'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Signatures at bottom */}
          <div className="pt-12 flex justify-between items-center text-xs text-slate-800">
            <div className="text-center">
              <div className="w-36 border-t border-slate-500 pt-1">সাধারণ সম্পাদক</div>
            </div>
            <div className="text-center">
              <div className="w-36 border-t border-slate-500 pt-1">সভাপতি</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
