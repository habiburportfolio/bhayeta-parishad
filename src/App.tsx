/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  CollectionReceipt, 
  Language, 
  MemberApplication, 
  OrganizationProfile, 
  PadDocument 
} from './types';
import { 
  getAdminPin, 
  getMembers, 
  getOrgProfile, 
  getPadDocuments, 
  getReceipts, 
  getSavedLanguage, 
  saveLanguage, 
  saveMembers, 
  saveOrgProfile, 
  savePadDocuments, 
  saveReceipts,
  fetchCloudMembers,
  syncMemberToCloud,
  deleteMemberFromCloud,
  fetchCloudReceipts,
  syncReceiptToCloud,
  deleteReceiptFromCloud,
  fetchCloudPadDocs,
  syncPadDocToCloud,
  deletePadDocFromCloud,
  fetchCloudOrgProfile,
  syncOrgProfileToCloud,
  saveAdminPin,
  fetchCloudAdminPin,
  syncAdminPinToCloud
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { FormAdmission } from './components/FormAdmission';
import { ReceiptBook } from './components/ReceiptBook';
import { PadKhata } from './components/PadKhata';
import { AdminPanel } from './components/AdminPanel';
import { OrgSettingsModal } from './components/OrgSettingsModal';
import { triggerPrint } from './utils/exportTools';

export default function App() {
  // Navigation & Language
  const [currentTab, setCurrentTab] = useState<'form' | 'receipt' | 'pad' | 'admin'>('form');
  const [lang, setLang] = useState<Language>(getSavedLanguage());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Core Data
  const [org, setOrg] = useState<OrganizationProfile>(getOrgProfile());
  const [members, setMembers] = useState<MemberApplication[]>(getMembers());
  const [receipts, setReceipts] = useState<CollectionReceipt[]>(getReceipts());
  const [padDocs, setPadDocs] = useState<PadDocument[]>(getPadDocuments());
  const [adminPin, setAdminPin] = useState(getAdminPin());

  // 1-Click Language Switcher
  const toggleLanguage = () => {
    const nextLang: Language = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    saveLanguage(nextLang);
  };

  // Reload all data (e.g. after backup restore)
  const reloadAllData = () => {
    setOrg(getOrgProfile());
    setMembers(getMembers());
    setReceipts(getReceipts());
    setPadDocs(getPadDocuments());
    setAdminPin(getAdminPin());
  };

  // Member handlers
  const handleSaveMember = async (newMember: MemberApplication) => {
    const existingIndex = members.findIndex((m) => m.id === newMember.id);
    let updated: MemberApplication[];
    if (existingIndex >= 0) {
      updated = [...members];
      updated[existingIndex] = newMember;
    } else {
      updated = [newMember, ...members];
    }
    setMembers(updated);
    saveMembers(updated);
    await syncMemberToCloud(newMember);
  };

  const handleUpdateMember = (updatedMember: MemberApplication) => {
    const updated = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(updated);
    saveMembers(updated);
    syncMemberToCloud(updatedMember);
  };

  const handleDeleteMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveMembers(updated);
    deleteMemberFromCloud(id);
  };

  // Receipt handlers
  const handleSaveReceipt = (receipt: CollectionReceipt) => {
    const existingIndex = receipts.findIndex((r) => r.id === receipt.id);
    let updated: CollectionReceipt[];
    if (existingIndex >= 0) {
      updated = [...receipts];
      updated[existingIndex] = receipt;
    } else {
      updated = [receipt, ...receipts];
    }
    setReceipts(updated);
    saveReceipts(updated);
    syncReceiptToCloud(receipt);
  };

  const handleDeleteReceipt = (id: string) => {
    const updated = receipts.filter((r) => r.id !== id);
    setReceipts(updated);
    saveReceipts(updated);
    deleteReceiptFromCloud(id);
  };

  // Pad handlers
  const handleSavePadDoc = (doc: PadDocument) => {
    const existingIndex = padDocs.findIndex((p) => p.id === doc.id);
    let updated: PadDocument[];
    if (existingIndex >= 0) {
      updated = [...padDocs];
      updated[existingIndex] = doc;
    } else {
      updated = [doc, ...padDocs];
    }
    setPadDocs(updated);
    savePadDocuments(updated);
    syncPadDocToCloud(doc);
  };

  const handleDeletePadDoc = (id: string) => {
    const updated = padDocs.filter((p) => p.id !== id);
    setPadDocs(updated);
    savePadDocuments(updated);
    deletePadDocFromCloud(id);
  };

  // Org profile handler
  const handleSaveOrg = (updatedOrg: OrganizationProfile) => {
    setOrg(updatedOrg);
    saveOrgProfile(updatedOrg);
    syncOrgProfileToCloud(updatedOrg);
  };

  // Admin PIN handler (Local + Cloud Sync)
  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    saveAdminPin(newPin);
    syncAdminPinToCloud(newPin);
  };

  // Initial cloud sync
  useEffect(() => {
    const syncFromCloud = async () => {
      try {
        const [cloudMembers, cloudReceipts, cloudPadDocs, cloudOrg, cloudPin] = await Promise.all([
          fetchCloudMembers(),
          fetchCloudReceipts(),
          fetchCloudPadDocs(),
          fetchCloudOrgProfile(),
          fetchCloudAdminPin(),
        ]);

        if (cloudMembers && cloudMembers.length > 0) {
          setMembers(cloudMembers);
          saveMembers(cloudMembers);
        }
        if (cloudReceipts && cloudReceipts.length > 0) {
          setReceipts(cloudReceipts);
          saveReceipts(cloudReceipts);
        }
        if (cloudPadDocs && cloudPadDocs.length > 0) {
          setPadDocs(cloudPadDocs);
          savePadDocuments(cloudPadDocs);
        }
        if (cloudOrg) {
          setOrg(cloudOrg);
          saveOrgProfile(cloudOrg);
        }
        if (cloudPin) {
          setAdminPin(cloudPin);
          saveAdminPin(cloudPin);
        }
      } catch (err) {
        console.warn('Initial cloud sync error:', err);
      }
    };

    syncFromCloud();
  }, []);

  useEffect(() => {
    // Sync document title with active language
    document.title = lang === 'bn' 
      ? `${org.nameBn} | ডিজিটাল সিস্টেম`
      : `${org.nameEn} | Digital System`;
  }, [lang, org.nameBn, org.nameEn]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-serif selection:bg-emerald-100 selection:text-emerald-900 print:min-h-0 print:bg-white print:p-0 print:m-0">
      
      {/* Top Navbar with 1-Click Language Toggle */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        toggleLang={toggleLanguage}
        org={org}
        openSettings={() => setIsSettingsOpen(true)}
        onQuickPrint={triggerPrint}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={() => {
          setIsAdminUnlocked(false);
          setCurrentTab('form');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 print:p-0 print:m-0 print:pb-0 print:flex-none">
        {currentTab === 'form' && (
          <FormAdmission
            org={org}
            lang={lang}
            existingMembers={members}
            onSaveMember={handleSaveMember}
          />
        )}

        {currentTab === 'receipt' && (
          isAdminUnlocked ? (
            <ReceiptBook
              receipts={receipts}
              org={org}
              lang={lang}
              onSaveReceipt={handleSaveReceipt}
              onDeleteReceipt={handleDeleteReceipt}
            />
          ) : (
            <AdminPanel
              members={members}
              receipts={receipts}
              adminPin={adminPin}
              org={org}
              lang={lang}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onDeleteReceipt={handleDeleteReceipt}
              onReloadAllData={reloadAllData}
              onUpdateAdminPin={handleUpdateAdminPin}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isUnlocked={false}
              onUnlock={() => setIsAdminUnlocked(true)}
              onLock={() => {
                setIsAdminUnlocked(false);
                setCurrentTab('form');
              }}
            />
          )
        )}

        {currentTab === 'pad' && (
          isAdminUnlocked ? (
            <PadKhata
              org={org}
              lang={lang}
              savedDocs={padDocs}
              onSaveDoc={handleSavePadDoc}
              onDeleteDoc={handleDeletePadDoc}
            />
          ) : (
            <AdminPanel
              members={members}
              receipts={receipts}
              adminPin={adminPin}
              org={org}
              lang={lang}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onDeleteReceipt={handleDeleteReceipt}
              onReloadAllData={reloadAllData}
              onUpdateAdminPin={handleUpdateAdminPin}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isUnlocked={false}
              onUnlock={() => setIsAdminUnlocked(true)}
              onLock={() => {
                setIsAdminUnlocked(false);
                setCurrentTab('form');
              }}
            />
          )
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            members={members}
            receipts={receipts}
            adminPin={adminPin}
            org={org}
            lang={lang}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onDeleteReceipt={handleDeleteReceipt}
            onReloadAllData={reloadAllData}
            onUpdateAdminPin={handleUpdateAdminPin}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isUnlocked={isAdminUnlocked}
            onUnlock={() => setIsAdminUnlocked(true)}
            onLock={() => {
              setIsAdminUnlocked(false);
              setCurrentTab('form');
            }}
          />
        )}
      </main>

      {/* Organization Settings Modal */}
      <OrgSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        org={org}
        lang={lang}
        onSaveOrg={handleSaveOrg}
      />

      {/* Footer (Hidden when printing) */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-700">
            {lang === 'bn' ? org.nameBn : org.nameEn}
          </p>
          <p className="text-[11px] text-slate-500">
            {lang === 'bn' ? org.addressBn : org.addressEn} | মোবাইল: {org.phones.join(', ')}
          </p>
          <p className="text-[10px] text-slate-400 pt-2">
            © {new Date().getFullYear()} ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ · ডিজিটাল সদস্য ভর্তি ফরম, রশিদ ও প্যাড সিস্টেম
          </p>
        </div>
      </footer>

    </div>
  );
}
