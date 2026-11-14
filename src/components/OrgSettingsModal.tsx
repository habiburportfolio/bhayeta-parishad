import React, { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, Upload, Trash2, CheckCircle } from 'lucide-react';
import { OrganizationProfile, Language } from '../types';
import { DEFAULT_ORG_PROFILE, DEFAULT_DECLARATION_BN } from '../utils/storage';

interface OrgSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: OrganizationProfile;
  lang: Language;
  onSaveOrg: (updated: OrganizationProfile) => void;
}

export const OrgSettingsModal: React.FC<OrgSettingsModalProps> = ({
  isOpen,
  onClose,
  org,
  lang,
  onSaveOrg,
}) => {
  const isBn = lang === 'bn';
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<OrganizationProfile>({ ...org });
  const [phonesStr, setPhonesStr] = useState(Array.isArray(org?.phones) ? org.phones.join(', ') : '');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...org });
      setPhonesStr(Array.isArray(org?.phones) ? org.phones.join(', ') : '');
    }
  }, [isOpen, org]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneList = phonesStr.split(',').map((p) => p.trim()).filter(Boolean);
    const updated: OrganizationProfile = {
      ...formData,
      phones: phoneList.length > 0 ? phoneList : org.phones,
    };
    onSaveOrg(updated);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm(isBn ? 'মূল ডিফল্ট তথ্য ফিরিয়ে আনতে চান?' : 'Reset to default organization profile?')) {
      setFormData({ ...DEFAULT_ORG_PROFILE });
      setPhonesStr(DEFAULT_ORG_PROFILE.phones.join(', '));
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isBn ? 'সংগঠনের তথ্য ও ব্র্যান্ডিং সেটিংস' : 'Organization & Branding Settings'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn ? 'নাম, লোগো, ঠিকানা ও যোগাযোগের তথ্য পরিবর্তন করুন' : 'Customize organization name, logo, address and contacts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">

          {/* Logo upload */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-600 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-emerald-800 text-lg">ভা</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {isBn ? 'সংগঠনের অফিশিয়াল লোগো' : 'Official Organization Logo'}
              </label>
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isBn ? 'নতুন লোগো আপলোড' : 'Upload New Logo'}</span>
                </button>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                    title="লোগো মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Org Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'সংগঠনের নাম (বাংলা)' : 'Organization Name (Bengali)'}
              </label>
              <input
                type="text"
                value={formData.nameBn}
                onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-emerald-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'সংগঠনের নাম (ইংরেজি ব্লক লেটার)' : 'Organization Name (English Block)'}
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-[#1a365d] uppercase font-sans"
              />
            </div>
          </div>

          {/* Established */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'প্রতিষ্ঠার সন / সাল (বাংলা)' : 'Establishment Years (Bengali)'}
              </label>
              <input
                type="text"
                value={formData.establishedBn}
                onChange={(e) => setFormData({ ...formData, establishedBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'প্রতিষ্ঠার সন / সাল (English)' : 'Establishment Years (English)'}
              </label>
              <input
                type="text"
                value={formData.establishedEn}
                onChange={(e) => setFormData({ ...formData, establishedEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'পূর্ণ ঠিকানা (বাংলা)' : 'Full Address (Bengali)'}
              </label>
              <input
                type="text"
                value={formData.addressBn}
                onChange={(e) => setFormData({ ...formData, addressBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'পূর্ণ ঠিকানা (English)' : 'Full Address (English)'}
              </label>
              <input
                type="text"
                value={formData.addressEn}
                onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
              />
            </div>
          </div>

          {/* Phones & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'মোবাইল নম্বরসমূহ (কমা দিয়ে পৃথক)' : 'Mobile Numbers (comma separated)'}
              </label>
              <input
                type="text"
                value={phonesStr}
                onChange={(e) => setPhonesStr(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'ই-মেইল' : 'Email Address'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-sans"
              />
            </div>
          </div>

          {/* Admin Security PIN Notice */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">{isBn ? 'অ্যাডমিন পিন / পাসওয়ার্ড সুরক্ষা' : 'Admin Security PIN'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{isBn ? 'অ্যাডমিন প্যানেলের "পাসওয়ার্ড পরিবর্তন" ট্যাব থেকে যেকোনো সময় পিন কোড পরিবর্তন ও ক্লাউড সিঙ্ক করতে পারবেন।' : 'You can change and sync PIN anytime from Admin Panel > Security.'}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300 shrink-0 ml-2">
              {isBn ? 'সক্রিয়' : 'Active'}
            </span>
          </div>

          {/* Declaration / অঙ্গীকারনামা Edit Section */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                {isBn ? 'ভর্তি ফরমের অঙ্গীকারনামা (Declaration Text)' : 'Admission Form Declaration'}
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, declarationBn: DEFAULT_DECLARATION_BN })}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 underline font-medium cursor-pointer"
              >
                {isBn ? 'ডিফল্ট অঙ্গীকারনামা আনুন' : 'Load Default'}
              </button>
            </div>
            <textarea
              value={formData.declarationBn || DEFAULT_DECLARATION_BN}
              onChange={(e) => setFormData({ ...formData, declarationBn: e.target.value })}
              rows={3}
              placeholder="অঙ্গীকারনামার বক্তব্য লিখুন..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm leading-relaxed"
            />
            <p className="text-[10px] text-slate-500">
              {isBn 
                ? '* এখানে যে অঙ্গীকারনামা লিখবেন তা স্বয়ংক্রিয়ভাবে ভর্তি ফরম এবং প্রিন্ট কপিতে প্রদর্শিত হবে।' 
                : '* This declaration text will automatically be used in admission forms and print views.'}
            </p>
          </div>

          {/* Toast */}
          {savedMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings updated successfully!'}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? 'ডিফল্টে ফিরিয়ে আনুন' : 'Reset Defaults'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
