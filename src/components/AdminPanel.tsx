import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { CollectionReceipt, Language, MemberApplication, OrganizationProfile } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { exportMembersToExcel, exportMemberToDoc, triggerPrint } from '../utils/exportTools';
import { toBengaliDigits } from '../utils/numberToWords';
import { exportEntireDatabase, restoreEntireDatabase, saveAdminPin } from '../utils/storage';
import { AdmissionFormPrintView } from './AdmissionFormPrintView';

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

  // Pin change
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [pinChangedMsg, setPinChangedMsg] = useState('');

  // Unlock check
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setInternalUnlocked(true);
      onUnlock?.();
      setPinError('');
    } else {
      setPinError(t.wrongPin);
    }
  };

  // Change PIN
  const handleChangePin = (e: React.FormEvent) => {
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

    saveAdminPin(newPin);
    onUpdateAdminPin?.(newPin);
    setPinChangedMsg(isBn ? '✓ অ্যাডমিন পিন সফলভাবে পরিবর্তন ও ক্লাউডে সংরক্ষিত হয়েছে!' : '✓ Admin PIN updated and saved to cloud successfully!');
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPinChangedMsg(''), 5000);
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
  const filteredMembers = members.filter((m) => {
    const matchesQuery = 
      m.fullNameBn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primaryMobile?.includes(searchQuery) ||
      m.memberIdNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.presentAddress?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.presentAddress?.villageOrArea?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true : m.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  // KPI counts
  const approvedMembersCount = members.filter((m) => m.status === 'approved').length;
  const pendingMembersCount = members.filter((m) => m.status === 'pending').length;
  const totalCollections = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

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

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={t.adminPinPlaceholder}
                className="w-full text-center px-4 py-3 text-lg font-bold tracking-widest border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
              {pinError && <p className="text-xs text-red-600 mt-1.5 font-medium">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{t.unlockAdmin}</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            {isBn ? 'ডিফল্ট পিন কোড: 1234' : 'Default PIN: 1234'}
          </p>
        </div>
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

          {/* Change PIN / Password */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">
                {isBn ? 'অ্যাডমিন পিন / পাসওয়ার্ড পরিবর্তন' : 'Change Admin PIN / Password'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBn 
                ? 'অ্যাডমিন প্যানেল সুরক্ষিত রাখতে আপনার পছন্দমতো নতুন পাসওয়ার্ড বা ৪ সংখ্যার পিন কোড সেট করুন। এটি ক্লাউডে যুক্ত হয়ে সব ডিভাইসে আপডেট হয়ে যাবে।' 
                : 'Set a new PIN or password to secure the admin panel across all your devices.'}
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
                    placeholder={isBn ? 'বর্তমান পিন (ডিফল্ট: 1234)' : 'Current PIN'}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'নতুন পিন কোড / পাসওয়ার্ড' : 'New PIN / Password'}
                </label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={isBn ? 'নতুন ৪+ ডিজিটের পিন (যেমন: 2026)' : 'New PIN (4+ digits)'}
                  minLength={4}
                  maxLength={12}
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
                  maxLength={12}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
                />
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
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                {isBn ? 'পাসওয়ার্ড সংরক্ষণ ও ক্লাউড সিঙ্ক করুন' : 'Save & Sync Password'}
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

    </div>
  );
};
