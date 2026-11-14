import { AdminSecurityProfile, CollectionReceipt, MemberApplication, OrganizationProfile, PadDocument, SecurityOtpSession } from '../types';
import { supabase } from './supabase';

const ORG_STORAGE_KEY = 'bhayeta_org_profile';
const MEMBERS_STORAGE_KEY = 'bhayeta_members';
const RECEIPTS_STORAGE_KEY = 'bhayeta_receipts';
const PAD_DOCS_STORAGE_KEY = 'bhayeta_pad_docs';
const PIN_STORAGE_KEY = 'bhayeta_admin_pin';
const LANG_STORAGE_KEY = 'bhayeta_lang_preference';

export const DEFAULT_DECLARATION_BN = "আমি এই মর্মে অঙ্গীকার করছি যে, ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ'-এর নিয়ম-কানুন, গঠনতন্ত্র ও লক্ষ্য-উদ্দেশ্য যথাযথভাবে মেনে চলব । গ্রামের শিক্ষা, সমাজকল্যাণ, ইসলামিক মূল্যবোধ ও সামাজিক উন্নয়নে সক্রিয় অংশগ্রহণ করব এবং আমার নির্বাচিত মাসিক চাঁদা নিয়মিত পরিষদ তহবিলে প্রদান করব । আমার প্রদত্ত সকল তথ্য সত্য ও নির্ভুল ।";
export const DEFAULT_DECLARATION_EN = "I hereby pledge to abide by the rules, constitution, and objectives of the Bhayeta Adarsha Gram Janakallyan Parishad, actively participate in village welfare, education, Islamic and social development, and regularly contribute my chosen monthly subscription to the parishad fund. All information provided by me is true and accurate.";

export const DEFAULT_ORG_PROFILE: OrganizationProfile = {
  nameBn: 'ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ',
  nameEn: 'BHAYETA ADARSHA GRAM JANAKALLYAN PARISHAD',
  establishedBn: 'স্থাপিত : ২০২৬ খ্রিস্টাব্দ, ১৪৩৩ বঙ্গাব্দ, ১৪৪৮ হিজরী',
  establishedEn: 'Est: 2026 AD, 1433 BS, 1448 Hijri',
  addressBn: 'গ্রাম: ভায়েটা, ডাকঘর: গালা, উপজেলা: টাঙ্গাইল সদর, জেলা: টাঙ্গাইল।',
  addressEn: 'Vill: Bhayeta, Post: Gala, Upazila: Tangail Sadar, Dist: Tangail.',
  phones: ['০১৫৫২-৬৩৮০০৬', '০১৭২৬-৮৭৭৯২৬', '০১৭১৬-৮৩৬৯২১'],
  email: 'bhayetagjp@gmail.com',
  logoUrl: '',
  declarationBn: DEFAULT_DECLARATION_BN,
  declarationEn: DEFAULT_DECLARATION_EN,
};

export const getOrgProfile = (): OrganizationProfile => {
  try {
    const raw = localStorage.getItem(ORG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load org profile', e);
  }
  return DEFAULT_ORG_PROFILE;
};

export const saveOrgProfile = (profile: OrganizationProfile): void => {
  localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(profile));
};

export const getMembers = (): MemberApplication[] => {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load members', e);
  }
  // Sample initial member
  const sampleMember: MemberApplication = {
    id: 'mem_001',
    formNo: '0001',
    date: '২০২৬-১১-০৫',
    photoUrl: '',
    fullNameBn: 'মোহাম্মদ হাবিবুর রহমান',
    fullNameEn: 'MD HABIBUR RAHMAN',
    fatherName: 'আব্দুল করিম',
    motherName: 'মোছাঃ ফাতেমা বেগম',
    occupation: 'ব্যবসা ও সমাজসেবা',
    education: 'স্নাতক (বি.এ)',
    dobAndAge: '১৫/০৪/১৯৯২ (৩৪ বছর)',
    bloodGroup: 'B+',
    nidOrBirthCert: '১৯৯২১৮২৬৭৭০০০১২৩৪',
    primaryMobile: '০১৭২৬-৮৭৭৯২৬',
    whatsappOrAltMobile: '০১৫৫২-৬৩৮০০৬',
    presentAddress: {
      division: 'Dhaka',
      district: 'Tangail',
      upazila: 'Tangail Sadar',
      postOffice: 'গালা',
      villageOrArea: 'ভায়েটা',
    },
    permanentAddress: {
      division: 'Dhaka',
      district: 'Tangail',
      upazila: 'Tangail Sadar',
      postOffice: 'গালা',
      villageOrArea: 'ভায়েটা',
    },
    sameAsPresentAddress: true,
    membershipType: 'lifetime',
    monthlyFee: '500',
    feeInWords: 'পাঁচশত টাকা মাত্র',
    paymentMethod: 'bkash_nagad',
    proposerNameAndId: 'মোঃ রফিকুল ইসলাম (আইডি: ১০২)',
    supporterNameAndId: 'মোঃ আনিসুর রহমান (আইডি: ১০৫)',
    applicantSignatureDate: '০৫/১১/২০২৬',
    status: 'approved',
    memberIdNo: 'ভাদ্রাজপ-২০২৬-০০১',
    admissionFee: '৫০০',
    admissionReceiptNo: 'র-১০১',
    approvalDate: '০৫/১১/২০২৬',
    approvalNotes: 'সদস্যপদ অনুমোদিত হলো',
    createdAt: Date.now() - 86400000,
  };
  return [sampleMember];
};

export const saveMembers = (members: MemberApplication[]): void => {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
};

export const addMember = (member: MemberApplication): void => {
  const current = getMembers();
  saveMembers([member, ...current]);
};

export const updateMember = (updated: MemberApplication): void => {
  const current = getMembers();
  saveMembers(current.map((m) => (m.id === updated.id ? updated : m)));
};

export const deleteMember = (id: string): void => {
  const current = getMembers();
  saveMembers(current.filter((m) => m.id !== id));
};

export const getReceipts = (): CollectionReceipt[] => {
  try {
    const raw = localStorage.getItem(RECEIPTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load receipts', e);
  }
  const sampleReceipt: CollectionReceipt = {
    id: 'rcpt_001',
    serialNo: '০১',
    date: '০৫/১১/২০২৬',
    payerName: 'মোহাম্মদ হাবিবুর রহমান',
    address: 'গ্রাম: ভায়েটা, গালা, টাঙ্গাইল সদর',
    amount: 500,
    amountInWordsBn: 'পাঁচশত টাকা মাত্র',
    amountInWordsEn: 'Five Hundred Taka Only',
    purpose: 'আজীবন সদস্য ভর্তি ফি ও অনুদান',
    receivedBy: 'মোঃ কোষাধ্যক্ষ',
    paymentMethod: 'bkash',
    createdAt: Date.now() - 3600000,
  };
  return [sampleReceipt];
};

export const saveReceipts = (receipts: CollectionReceipt[]): void => {
  localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
};

export const addReceipt = (receipt: CollectionReceipt): void => {
  const current = getReceipts();
  saveReceipts([receipt, ...current]);
};

export const deleteReceipt = (id: string): void => {
  const current = getReceipts();
  saveReceipts(current.filter((r) => r.id !== id));
};

export const getPadDocuments = (): PadDocument[] => {
  try {
    const raw = localStorage.getItem(PAD_DOCS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load pad docs', e);
  }
  return [];
};

export const savePadDocuments = (docs: PadDocument[]): void => {
  localStorage.setItem(PAD_DOCS_STORAGE_KEY, JSON.stringify(docs));
};

export const getAdminPin = (): string => {
  return localStorage.getItem(PIN_STORAGE_KEY) || '1234';
};

export const saveAdminPin = (newPin: string): void => {
  localStorage.setItem(PIN_STORAGE_KEY, newPin);
};

export const getSavedLanguage = (): 'bn' | 'en' => {
  const lang = localStorage.getItem(LANG_STORAGE_KEY);
  return lang === 'en' ? 'en' : 'bn';
};

export const saveLanguage = (lang: 'bn' | 'en'): void => {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
};

export const exportEntireDatabase = () => {
  const data = {
    orgProfile: getOrgProfile(),
    members: getMembers(),
    receipts: getReceipts(),
    padDocs: getPadDocuments(),
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bhayeta_parishad_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const restoreEntireDatabase = (jsonText: string): boolean => {
  try {
    const data = JSON.parse(jsonText);
    if (data.orgProfile) saveOrgProfile(data.orgProfile);
    if (Array.isArray(data.members)) saveMembers(data.members);
    if (Array.isArray(data.receipts)) saveReceipts(data.receipts);
    if (Array.isArray(data.padDocs)) savePadDocuments(data.padDocs);
    return true;
  } catch (e) {
    console.error('Database restore error:', e);
    return false;
  }
};

// ==========================================
// SUPABASE REAL-TIME CLOUD SYNC FUNCTIONS
// ==========================================

export const fetchCloudMembers = async (): Promise<MemberApplication[] | null> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('data')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch members note:', error.message);
      return null;
    }
    if (data && Array.isArray(data)) {
      return data.map((d: any) => d.data as MemberApplication);
    }
  } catch (err) {
    console.warn('Supabase network error (members):', err);
  }
  return null;
};

export const syncMemberToCloud = async (member: MemberApplication): Promise<boolean> => {
  try {
    const { error } = await supabase.from('members').upsert({
      id: member.id,
      form_no: member.formNo,
      full_name_bn: member.fullNameBn,
      full_name_en: member.fullNameEn,
      primary_mobile: member.primaryMobile,
      status: member.status,
      data: member,
    });
    if (error) {
      console.warn('Supabase save member error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save member network error:', err);
    return false;
  }
};

export const deleteMemberFromCloud = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete member error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete member network error:', err);
    return false;
  }
};

export const fetchCloudReceipts = async (): Promise<CollectionReceipt[] | null> => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('data')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch receipts note:', error.message);
      return null;
    }
    if (data && Array.isArray(data)) {
      return data.map((d: any) => d.data as CollectionReceipt);
    }
  } catch (err) {
    console.warn('Supabase network error (receipts):', err);
  }
  return null;
};

export const syncReceiptToCloud = async (receipt: CollectionReceipt): Promise<boolean> => {
  try {
    const { error } = await supabase.from('receipts').upsert({
      id: receipt.id,
      serial_no: receipt.serialNo,
      payer_name: receipt.payerName,
      amount: receipt.amount,
      date: receipt.date,
      data: receipt,
    });
    if (error) {
      console.warn('Supabase save receipt error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save receipt network error:', err);
    return false;
  }
};

export const deleteReceiptFromCloud = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete receipt error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete receipt network error:', err);
    return false;
  }
};

export const fetchCloudPadDocs = async (): Promise<PadDocument[] | null> => {
  try {
    const { data, error } = await supabase
      .from('pad_documents')
      .select('data')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch pad docs note:', error.message);
      return null;
    }
    if (data && Array.isArray(data)) {
      return data.map((d: any) => d.data as PadDocument);
    }
  } catch (err) {
    console.warn('Supabase network error (pad docs):', err);
  }
  return null;
};

export const syncPadDocToCloud = async (doc: PadDocument): Promise<boolean> => {
  try {
    const { error } = await supabase.from('pad_documents').upsert({
      id: doc.id,
      memo_no: doc.memoNo,
      subject: doc.subject,
      date: doc.date,
      data: doc,
    });
    if (error) {
      console.warn('Supabase save pad doc error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save pad doc network error:', err);
    return false;
  }
};

export const deletePadDocFromCloud = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('pad_documents').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete pad doc error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete pad doc network error:', err);
    return false;
  }
};

export const fetchCloudOrgProfile = async (): Promise<OrganizationProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('org_profile')
      .select('data')
      .eq('id', 'default')
      .single();

    if (error) {
      console.warn('Supabase fetch org profile note:', error.message);
      return null;
    }
    if (data && data.data) {
      return data.data as OrganizationProfile;
    }
  } catch (err) {
    console.warn('Supabase network error (org profile):', err);
  }
  return null;
};

export const syncOrgProfileToCloud = async (profile: OrganizationProfile): Promise<boolean> => {
  try {
    const { error } = await supabase.from('org_profile').upsert({
      id: 'default',
      data: profile,
    });
    if (error) {
      console.warn('Supabase save org profile error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save org profile network error:', err);
    return false;
  }
};

const SECURITY_STORAGE_KEY = 'bhayeta_admin_security';
const OTP_SESSION_KEY = 'bhayeta_active_otp';

export const generateMasterKey = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BHYT-${seg()}-${seg()}-${seg()}`;
};

export const getAdminSecurity = (): AdminSecurityProfile => {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.masterRecoveryKey) {
        parsed.masterRecoveryKey = generateMasterKey();
        saveAdminSecurity(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse admin security', e);
  }

  const defaultSecurity: AdminSecurityProfile = {
    pin: localStorage.getItem(PIN_STORAGE_KEY) || '1234',
    recoveryEmail: DEFAULT_ORG_PROFILE.email,
    recoveryPhone: DEFAULT_ORG_PROFILE.phones[0],
    masterRecoveryKey: generateMasterKey(),
    failedAttempts: 0,
    lockedUntil: null,
    lastChangedAt: new Date().toISOString(),
  };
  saveAdminSecurity(defaultSecurity);
  return defaultSecurity;
};

export const saveAdminSecurity = (sec: AdminSecurityProfile): void => {
  localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(sec));
  localStorage.setItem(PIN_STORAGE_KEY, sec.pin);
};

export const fetchCloudAdminSecurity = async (): Promise<AdminSecurityProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('org_profile')
      .select('data')
      .eq('id', 'admin_security')
      .single();

    if (error || !data?.data) return null;
    const cloud = data.data;
    const current = getAdminSecurity();
    const merged: AdminSecurityProfile = {
      pin: cloud.pin ? String(cloud.pin) : current.pin,
      recoveryEmail: cloud.recoveryEmail || current.recoveryEmail,
      recoveryPhone: cloud.recoveryPhone || current.recoveryPhone,
      masterRecoveryKey: cloud.masterRecoveryKey || current.masterRecoveryKey,
      failedAttempts: current.failedAttempts,
      lockedUntil: current.lockedUntil,
      lastChangedAt: cloud.lastChangedAt || current.lastChangedAt,
    };
    saveAdminSecurity(merged);
    return merged;
  } catch (err) {
    console.warn('Supabase fetch admin security error:', err);
    return null;
  }
};

export const syncAdminSecurityToCloud = async (sec: AdminSecurityProfile): Promise<boolean> => {
  try {
    const { error } = await supabase.from('org_profile').upsert({
      id: 'admin_security',
      data: {
        pin: sec.pin,
        recoveryEmail: sec.recoveryEmail,
        recoveryPhone: sec.recoveryPhone,
        masterRecoveryKey: sec.masterRecoveryKey,
        lastChangedAt: sec.lastChangedAt || new Date().toISOString(),
        updatedAt: Date.now(),
      },
    });
    if (error) {
      console.warn('Supabase save security error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save security network error:', err);
    return false;
  }
};

export const generateSecurityOtp = async (
  target: 'email' | 'mobile',
  destination: string
): Promise<SecurityOtpSession> => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const session: SecurityOtpSession = {
    code,
    target,
    destination,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    verified: false,
  };

  localStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));

  try {
    await supabase.from('org_profile').upsert({
      id: 'admin_pending_otp',
      data: {
        code,
        target,
        destination,
        expiresAt: session.expiresAt,
        createdAt: Date.now(),
      },
    });
  } catch (e) {
    console.warn('Failed to sync OTP to cloud:', e);
  }

  return session;
};

export const getActiveSecurityOtp = (): SecurityOtpSession | null => {
  try {
    const raw = localStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return null;
    const session: SecurityOtpSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(OTP_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const verifySecurityOtp = (enteredCode: string): boolean => {
  const active = getActiveSecurityOtp();
  if (!active) return false;
  if (active.code.trim() === enteredCode.trim() && Date.now() <= active.expiresAt) {
    localStorage.removeItem(OTP_SESSION_KEY);
    supabase.from('org_profile').delete().eq('id', 'admin_pending_otp').then();
    return true;
  }
  return false;
};

export const verifyMasterRecoveryKey = (keyInput: string): boolean => {
  const sec = getAdminSecurity();
  const normalize = (k: string) => k.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalize(keyInput) === normalize(sec.masterRecoveryKey);
};

export const recordFailedAttempt = (): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } => {
  const sec = getAdminSecurity();
  sec.failedAttempts = (sec.failedAttempts || 0) + 1;
  let isLocked = false;
  let remainingSeconds = 0;

  if (sec.failedAttempts >= 5) {
    sec.lockedUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes
    isLocked = true;
    remainingSeconds = 300;
  }
  saveAdminSecurity(sec);
  return {
    isLocked,
    remainingSeconds,
    attemptsLeft: Math.max(0, 5 - sec.failedAttempts),
  };
};

export const resetFailedAttempts = (): void => {
  const sec = getAdminSecurity();
  sec.failedAttempts = 0;
  sec.lockedUntil = null;
  saveAdminSecurity(sec);
};

export const getLockoutStatus = (): { isLocked: boolean; remainingSeconds: number } => {
  const sec = getAdminSecurity();
  if (sec.lockedUntil && sec.lockedUntil > Date.now()) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((sec.lockedUntil - Date.now()) / 1000),
    };
  }
  if (sec.lockedUntil && sec.lockedUntil <= Date.now()) {
    resetFailedAttempts();
  }
  return { isLocked: false, remainingSeconds: 0 };
};

export const fetchCloudAdminPin = async (): Promise<string | null> => {
  const sec = await fetchCloudAdminSecurity();
  return sec?.pin || null;
};

export const syncAdminPinToCloud = async (newPin: string): Promise<boolean> => {
  const sec = getAdminSecurity();
  sec.pin = newPin;
  sec.lastChangedAt = new Date().toISOString();
  saveAdminSecurity(sec);
  return syncAdminSecurityToCloud(sec);
};
