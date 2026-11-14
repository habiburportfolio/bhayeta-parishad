import { CollectionReceipt, MemberApplication, OrganizationProfile, PadDocument } from '../types';
import { supabase } from './supabase';

const ORG_STORAGE_KEY = 'bhayeta_org_profile';
const MEMBERS_STORAGE_KEY = 'bhayeta_members';
const RECEIPTS_STORAGE_KEY = 'bhayeta_receipts';
const PAD_DOCS_STORAGE_KEY = 'bhayeta_pad_docs';
const PIN_STORAGE_KEY = 'bhayeta_admin_pin';
const LANG_STORAGE_KEY = 'bhayeta_lang_preference';

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

export const fetchCloudAdminPin = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('org_profile')
      .select('data')
      .eq('id', 'admin_security')
      .single();

    if (error) return null;
    if (data && data.data && data.data.pin) {
      return String(data.data.pin);
    }
  } catch (err) {
    console.warn('Supabase fetch admin pin error:', err);
  }
  return null;
};

export const syncAdminPinToCloud = async (newPin: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('org_profile').upsert({
      id: 'admin_security',
      data: { pin: newPin, updatedAt: Date.now() },
    });
    if (error) {
      console.warn('Supabase save pin error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save pin network error:', err);
    return false;
  }
};
