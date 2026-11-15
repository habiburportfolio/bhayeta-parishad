import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  FileDown, 
  RotateCcw, 
  Upload, 
  Trash2, 
  Eye, 
  CheckCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { MemberApplication, OrganizationProfile, Language } from '../types';
import { BANGLADESH_DIVISIONS } from '../data/bangladeshData';
import { TRANSLATIONS } from '../data/translations';
import { AdmissionFormPrintView } from './AdmissionFormPrintView';
import { getAmountInWords, toBengaliDigits, toEnglishDigits } from '../utils/numberToWords';
import { exportMemberToDoc, triggerPrint } from '../utils/exportTools';
import { fetchCloudMembers } from '../utils/storage';

export const getNextFormNo = (list?: MemberApplication[]): string => {
  if (!list || !Array.isArray(list) || list.length === 0) return '0001';
  const nums = list
    .filter(Boolean)
    .map((m) => {
      const en = toEnglishDigits(m?.formNo || '');
      const parsed = parseInt(en.replace(/\D/g, ''), 10);
      return parsed;
    })
    .filter((n) => !isNaN(n) && n > 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(4, '0');
};

const compressImageFile = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

interface FormAdmissionProps {
  org: OrganizationProfile;
  lang: Language;
  existingMembers?: MemberApplication[];
  onSaveMember: (member: MemberApplication) => void | Promise<any>;
}

export const FormAdmission: React.FC<FormAdmissionProps> = ({
  org,
  lang,
  existingMembers = [],
  onSaveMember,
}) => {
  const isBn = lang === 'bn';
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // View mode: 'interactive' or 'replica'
  const [viewMode, setViewMode] = useState<'interactive' | 'replica'>('interactive');
  const [printBlank, setPrintBlank] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedModalData, setSubmittedModalData] = useState<MemberApplication | null>(null);
  const [hasSavedCurrentForm, setHasSavedCurrentForm] = useState(false);

  // Form State
  const initialMember: MemberApplication = {
    id: `mem_${Date.now()}`,
    formNo: getNextFormNo(existingMembers),
    date: new Date().toISOString().slice(0, 10),
    photoUrl: '',
    fullNameBn: '',
    fullNameEn: '',
    fatherName: '',
    motherName: '',
    occupation: '',
    education: '',
    dobAndAge: '',
    bloodGroup: 'B+',
    nidOrBirthCert: '',
    primaryMobile: '',
    whatsappOrAltMobile: '',
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
    membershipType: 'general',
    monthlyFee: '100',
    customMonthlyFee: '',
    feeInWords: lang === 'bn' ? 'একশত টাকা মাত্র' : 'One Hundred Taka Only',
    paymentMethod: 'cash',
    proposerNameAndId: '',
    supporterNameAndId: '',
    applicantSignatureDate: new Date().toISOString().slice(0, 10),
    applicantSignatureUrl: '',
    status: 'pending',
    memberIdNo: '',
    admissionFee: '১০০',
    admissionReceiptNo: '',
    approvalDate: '',
    approvalNotes: '',
    createdAt: Date.now(),
  };

  const [formData, setFormData] = useState<MemberApplication>(initialMember);

  // Sync formNo when existing members load or change
  useEffect(() => {
    if (existingMembers && existingMembers.length > 0 && !formData.fullNameBn && !formData.fullNameEn && !hasSavedCurrentForm) {
      const nextNo = getNextFormNo(existingMembers);
      setFormData((prev) => ({ ...prev, formNo: nextNo }));
    }
  }, [existingMembers, hasSavedCurrentForm]);

  // Handle Photo Upload with size validation and auto-compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৫MB হতে হবে' : 'Photo size must be under 5MB');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.82);
        setFormData((prev) => ({ ...prev, photoUrl: compressed }));
      } catch (err) {
        console.error('Photo compression error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle Applicant Signature Upload with compression
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'bn' ? 'স্বাক্ষরের ছবির সাইজ সর্বোচ্চ ২MB হতে হবে' : 'Signature image size must be under 2MB');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 400, 200, 0.85);
        setFormData((prev) => ({ ...prev, applicantSignatureUrl: compressed }));
      } catch (err) {
        console.error('Signature compression error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, applicantSignatureUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveSignature = () => {
    setFormData((prev) => ({ ...prev, applicantSignatureUrl: '' }));
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };

  // Handle monthly fee change
  const handleFeeChange = (val: string) => {
    let numeric = 100;
    if (val === '100') numeric = 100;
    else if (val === '200') numeric = 200;
    else if (val === '500') numeric = 500;
    else if (val === '1000') numeric = 1000;
    else if (formData.customMonthlyFee) numeric = Number(formData.customMonthlyFee) || 0;

    const words = getAmountInWords(numeric, lang);
    setFormData((prev) => ({
      ...prev,
      monthlyFee: val,
      feeInWords: words,
    }));
  };

  // Sync permanent address when checked
  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      sameAsPresentAddress: checked,
      permanentAddress: checked ? { ...prev.presentAddress } : prev.permanentAddress,
    }));
  };

  // Update present address & cascade if same
  const handlePresentAddressChange = (field: string, value: string) => {
    setFormData((prev) => {
      let updatedPresent = { ...prev.presentAddress, [field]: value };

      if (field === 'division') {
        const foundDiv = BANGLADESH_DIVISIONS.find((d) => d.nameEn === value || d.nameBn === value) || BANGLADESH_DIVISIONS[0];
        const firstDist = foundDiv?.districts?.[0];
        const firstUpz = firstDist?.upazilas?.[0];
        updatedPresent.district = firstDist?.nameEn || '';
        updatedPresent.upazila = firstUpz?.nameEn || '';
      } else if (field === 'district') {
        const foundDiv = BANGLADESH_DIVISIONS.find((d) => d.nameEn === prev.presentAddress.division || d.nameBn === prev.presentAddress.division) || BANGLADESH_DIVISIONS[0];
        const foundDist = foundDiv?.districts?.find((d) => d.nameEn === value || d.nameBn === value) || foundDiv?.districts?.[0];
        const firstUpz = foundDist?.upazilas?.[0];
        updatedPresent.upazila = firstUpz?.nameEn || '';
      }

      return {
        ...prev,
        presentAddress: updatedPresent,
        permanentAddress: prev.sameAsPresentAddress ? { ...updatedPresent } : prev.permanentAddress,
      };
    });
  };

  // Update permanent address
  const handlePermanentAddressChange = (field: string, value: string) => {
    setFormData((prev) => {
      let updatedPerm = { ...prev.permanentAddress, [field]: value };

      if (field === 'division') {
        const foundDiv = BANGLADESH_DIVISIONS.find((d) => d.nameEn === value || d.nameBn === value) || BANGLADESH_DIVISIONS[0];
        const firstDist = foundDiv?.districts?.[0];
        const firstUpz = firstDist?.upazilas?.[0];
        updatedPerm.district = firstDist?.nameEn || '';
        updatedPerm.upazila = firstUpz?.nameEn || '';
      } else if (field === 'district') {
        const foundDiv = BANGLADESH_DIVISIONS.find((d) => d.nameEn === prev.permanentAddress.division || d.nameBn === prev.permanentAddress.division) || BANGLADESH_DIVISIONS[0];
        const foundDist = foundDiv?.districts?.find((d) => d.nameEn === value || d.nameBn === value) || foundDiv?.districts?.[0];
        const firstUpz = foundDist?.upazilas?.[0];
        updatedPerm.upazila = firstUpz?.nameEn || '';
      }

      return {
        ...prev,
        permanentAddress: updatedPerm,
      };
    });
  };

  // Division & District cascades for present address
  const currentPresentDivision = BANGLADESH_DIVISIONS.find(
    (d) => d.nameEn === formData?.presentAddress?.division || d.nameBn === formData?.presentAddress?.division
  ) || BANGLADESH_DIVISIONS[0];

  const currentPresentDistricts = currentPresentDivision?.districts || [];
  const currentPresentDistrict = currentPresentDistricts.find(
    (d) => d.nameEn === formData?.presentAddress?.district || d.nameBn === formData?.presentAddress?.district
  ) || currentPresentDistricts[0];

  const currentPresentUpazilas = currentPresentDistrict?.upazilas || [];

  // Permanent address cascades
  const currentPermDivision = BANGLADESH_DIVISIONS.find(
    (d) => d.nameEn === formData?.permanentAddress?.division || d.nameBn === formData?.permanentAddress?.division
  ) || BANGLADESH_DIVISIONS[0];

  const currentPermDistricts = currentPermDivision?.districts || [];
  const currentPermDistrict = currentPermDistricts.find(
    (d) => d.nameEn === formData?.permanentAddress?.district || d.nameBn === formData?.permanentAddress?.district
  ) || currentPermDistricts[0];

  const currentPermUpazilas = currentPermDistrict?.upazilas || [];

  // Save member with real-time atomic serial allocation
  const handleSave = async () => {
    if (!formData.fullNameBn.trim() && !formData.fullNameEn.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে আবেদনকারীর নাম লিখুন' : 'Please enter applicant name');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Fetch freshest members directly from Supabase to prevent race conditions
      let latestList = existingMembers || [];
      try {
        const cloudMembers = await fetchCloudMembers();
        if (cloudMembers && Array.isArray(cloudMembers)) {
          latestList = cloudMembers;
        }
      } catch (cloudErr) {
        console.warn('Real-time cloud fetch fallback to local list:', cloudErr);
      }

      // 2. Compute final sequential formNo at the moment of submission
      const finalFormNo = getNextFormNo(latestList);

      const finalizedMember: MemberApplication = {
        ...formData,
        formNo: finalFormNo,
        createdAt: Date.now(),
      };

      // 3. Save to database / state
      await onSaveMember(finalizedMember);

      // 4. Update local form and trigger confirmation popup
      setFormData(finalizedMember);
      setSubmittedModalData(finalizedMember);
      setHasSavedCurrentForm(true);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 4000);
    } catch (error) {
      console.error('Submission error:', error);
      alert(lang === 'bn' ? 'আবেদন জমাদানে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।' : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewForm = () => {
    setSubmittedModalData(null);
    setHasSavedCurrentForm(false);
    const updatedList = submittedModalData 
      ? [...(existingMembers || []), submittedModalData]
      : (existingMembers || []);
    const nextNo = getNextFormNo(updatedList);
    setFormData({
      ...initialMember,
      id: `mem_${Date.now()}`,
      formNo: nextNo,
      date: new Date().toISOString().slice(0, 10),
      applicantSignatureDate: new Date().toISOString().slice(0, 10),
      applicantSignatureUrl: '',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (signatureInputRef.current) signatureInputRef.current.value = '';
    setViewMode('interactive');
  };

  const handleReset = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি ফর্ম রিসেট করতে চান?' : 'Are you sure you want to reset the form?')) {
      setHasSavedCurrentForm(false);
      const nextNo = getNextFormNo(existingMembers);
      setFormData({
        ...initialMember,
        id: `mem_${Date.now()}`,
        formNo: nextNo,
        date: new Date().toISOString().slice(0, 10),
        applicantSignatureDate: new Date().toISOString().slice(0, 10),
        applicantSignatureUrl: '',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (signatureInputRef.current) signatureInputRef.current.value = '';
    }
  };

  // Print helper
  const handlePrint = (blank: boolean) => {
    setPrintBlank(blank);
    setViewMode('replica');
    setTimeout(() => {
      triggerPrint();
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
      
      {/* Top Controls Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* View Mode Segmented Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => { setViewMode('interactive'); setPrintBlank(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'interactive'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>{t.modeInteractive}</span>
          </button>
          <button
            onClick={() => setViewMode('replica')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'replica'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-700" />
            <span>{t.modePrintReplica}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Blank Form */}
          <button
            onClick={() => handlePrint(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="খালি পেপার প্রিন্ট করে হাতে লেখার জন্য"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{t.printBlankForm}</span>
          </button>

          {/* Print Filled Form */}
          <button
            onClick={() => handlePrint(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>{t.printFilledForm}</span>
          </button>

          {/* Export to Word/Docs */}
          <button
            onClick={() => exportMemberToDoc(formData, org, lang)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Word বা Google Docs এ খোলার জন্য .doc ফাইল"
          >
            <FileDown className="w-4 h-4 text-emerald-700" />
            <span>{t.exportDocs}</span>
          </button>

          {/* Save to Records */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-300" />
            <span>{t.saveData}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {savedToast && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span>{t.savedSuccess}</span>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'replica' ? (
        <div className="space-y-4 print:space-y-0 print:m-0 print:p-0">
          <div className="no-print flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs sm:text-sm text-emerald-900 font-medium">
            <span>
              {printBlank
                ? 'এখন খালি ফর্ম প্রিভিউ দেখাচ্ছে (হাতে লেখার উপযোগী)'
                : 'এখন পূরণকৃত ফর্ম প্রিভিউ দেখাচ্ছে (প্রিন্ট বা PDF হিসেবে ডাউনলোডের জন্য প্রস্তুত)'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPrintBlank(!printBlank)}
                className="underline font-bold cursor-pointer"
              >
                {printBlank ? 'পূরণকৃত রূপ দেখুন' : 'খালি রূপ দেখুন'}
              </button>
            </div>
          </div>

          <div className="print-only-container overflow-x-auto pb-8 print:p-0 print:m-0 print:pb-0 print:overflow-visible">
            <AdmissionFormPrintView
              member={formData}
              org={org}
              lang={lang}
              isBlank={printBlank}
            />
          </div>
        </div>
      ) : (
        /* Interactive Input Wizard Mode */
        <>
          <div className="no-print bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
          
          {/* Header Info & Photo Upload Row */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{org.nameBn}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t.formTitle}</h2>
              <p className="text-xs sm:text-sm text-slate-500">{t.formSubtitle}</p>
            </div>

            {/* Photo Upload Box */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2 text-center overflow-hidden relative group">
                {formData.photoUrl ? (
                  <>
                    <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover rounded-md" />
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                      className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t.removePhoto}
                    >
                      <Trash2 className="w-5 h-5 mb-1 text-red-400" />
                      <span className="text-[10px]">{t.removePhoto}</span>
                    </button>
                  </>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <Upload className="w-6 h-6 mb-1 text-slate-400" />
                    <span className="text-[11px] font-medium leading-tight">{t.uploadPhotoPrompt}</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  {formData.photoUrl ? t.changePhoto : t.uploadPhotoPrompt}
                </button>
                <p className="text-[11px] text-slate-400 mt-1">পাসপোর্ট সাইজ JPG / PNG</p>
              </div>
            </div>
          </div>

          {/* Form Meta: Form No & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 border border-emerald-200/80 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {isBn ? 'অনলাইন ফরম নং' : 'Online Form No'}
                <span className="text-[10px] text-emerald-800 font-semibold ml-1.5 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  {isBn ? 'সাবমিটের ক্রমানুসারে চূড়ান্ত হবে' : 'Finalized upon Submit'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.formNo}
                  onChange={(e) => setFormData({ ...formData, formNo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-400 focus:border-emerald-600 rounded-md text-sm font-bold text-emerald-950 font-sans tracking-wider shadow-2xs"
                  placeholder="0001"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-slate-400 font-medium pointer-events-none">
                  {isBn ? '(সম্ভাব্য ক্রম)' : '(Tentative)'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 mt-1 font-medium">
                {isBn 
                  ? '⚡ একাধিক ব্যক্তি একসাথে পূরণ করলেও যিনি আগে সাবমিট করবেন, ডাটাবেজ তাকেই অগ্রাধিকার ভিত্তিতে আগের ক্রম প্রদান করবে।' 
                  : '⚡ Concurrency Safe: The earlier submission receives the prior serial number.'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">{t.formDate}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* SECTION 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b border-emerald-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>{t.section1Title}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.fullNameBn} *</label>
                <input
                  type="text"
                  value={formData.fullNameBn}
                  onChange={(e) => setFormData({ ...formData, fullNameBn: e.target.value })}
                  placeholder="যেমন: মোহাম্মদ হাবিবুর রহমান"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.fullNameEn} *</label>
                <input
                  type="text"
                  value={formData.fullNameEn}
                  onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value.toUpperCase() })}
                  placeholder="E.G. MD HABIBUR RAHMAN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm uppercase tracking-wide focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.fatherName}</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.motherName}</label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.occupation}</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="যেমন: ব্যবসা, শিক্ষকতা, কৃষি, চাকরি"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.education}</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="যেমন: এস.এস.সি / এইচ.এস.সি / বি.এ / এম.এ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.dobAndAge}</label>
                <input
                  type="text"
                  value={formData.dobAndAge}
                  onChange={(e) => setFormData({ ...formData, dobAndAge: e.target.value })}
                  placeholder="যেমন: ১৫/০৪/১৯৯২ (৩৪ বছর)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.bloodGroup}</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-sans"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.nidOrBirthCert}</label>
                <input
                  type="text"
                  value={formData.nidOrBirthCert}
                  onChange={(e) => setFormData({ ...formData, nidOrBirthCert: e.target.value })}
                  placeholder="জাতীয় পরিচয়পত্র বা জন্ম নিবন্ধন নম্বর"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.primaryMobile} *</label>
                <input
                  type="text"
                  value={formData.primaryMobile}
                  onChange={(e) => setFormData({ ...formData, primaryMobile: e.target.value })}
                  placeholder="০১৭... বা ০১৭১..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.whatsappOrAltMobile}</label>
                <input
                  type="text"
                  value={formData.whatsappOrAltMobile}
                  onChange={(e) => setFormData({ ...formData, whatsappOrAltMobile: e.target.value })}
                  placeholder="বিকল্প নম্বর বা হোয়াটসঅ্যাপ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-sans"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Cascading Address Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b border-emerald-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>{t.section2Title}</span>
            </h3>

            {/* Present Address */}
            <div className="p-4 bg-slate-50/70 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">{t.presentAddress}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Division */}
                <div>
                  <label className="block text-xs text-slate-600 mb-1">{t.division}</label>
                  <select
                    value={formData.presentAddress.division}
                    onChange={(e) => handlePresentAddressChange('division', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <option key={div.id} value={div.nameEn}>
                        {lang === 'bn' ? div.nameBn : div.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs text-slate-600 mb-1">{t.district}</label>
                  <select
                    value={formData.presentAddress.district}
                    onChange={(e) => handlePresentAddressChange('district', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                  >
                    {currentPresentDistricts.map((dist) => (
                      <option key={dist.id} value={dist.nameEn}>
                        {lang === 'bn' ? dist.nameBn : dist.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <label className="block text-xs text-slate-600 mb-1">{t.upazila}</label>
                  <select
                    value={formData.presentAddress.upazila}
                    onChange={(e) => handlePresentAddressChange('upazila', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                  >
                    {currentPresentUpazilas.map((upz, idx) => (
                      <option key={idx} value={upz.nameEn}>
                        {lang === 'bn' ? upz.nameBn : upz.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Village / Area */}
                <div>
                  <label className="block text-xs text-slate-600 mb-1">{t.villageOrArea}</label>
                  <input
                    type="text"
                    value={formData.presentAddress.villageOrArea}
                    onChange={(e) => handlePresentAddressChange('villageOrArea', e.target.value)}
                    placeholder="গ্রাম বা পাড়া"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                  />
                </div>

                {/* Post Office */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-600 mb-1">{t.postOffice}</label>
                  <input
                    type="text"
                    value={formData.presentAddress.postOffice}
                    onChange={(e) => handlePresentAddressChange('postOffice', e.target.value)}
                    placeholder="ডাকঘরের নাম"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Same as present address checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="sameAddress"
                checked={formData.sameAsPresentAddress}
                onChange={handleSameAddressToggle}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300"
              />
              <label htmlFor="sameAddress" className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
                {t.sameAsPresent}
              </label>
            </div>

            {/* Permanent Address (if different) */}
            {!formData.sameAsPresentAddress && (
              <div className="p-4 bg-slate-50/70 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">{t.permanentAddress}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t.division}</label>
                    <select
                      value={formData.permanentAddress.division}
                      onChange={(e) => handlePermanentAddressChange('division', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                    >
                      {BANGLADESH_DIVISIONS.map((div) => (
                        <option key={div.id} value={div.nameEn}>
                          {lang === 'bn' ? div.nameBn : div.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t.district}</label>
                    <select
                      value={formData.permanentAddress.district}
                      onChange={(e) => handlePermanentAddressChange('district', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                    >
                      {currentPermDistricts.map((dist) => (
                        <option key={dist.id} value={dist.nameEn}>
                          {lang === 'bn' ? dist.nameBn : dist.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t.upazila}</label>
                    <select
                      value={formData.permanentAddress.upazila}
                      onChange={(e) => handlePermanentAddressChange('upazila', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                    >
                      {currentPermUpazilas.map((upz, idx) => (
                        <option key={idx} value={upz.nameEn}>
                          {lang === 'bn' ? upz.nameBn : upz.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t.villageOrArea}</label>
                    <input
                      type="text"
                      value={formData.permanentAddress.villageOrArea}
                      onChange={(e) => handlePermanentAddressChange('villageOrArea', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">{t.postOffice}</label>
                    <input
                      type="text"
                      value={formData.permanentAddress.postOffice}
                      onChange={(e) => handlePermanentAddressChange('postOffice', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Membership Tier & Fee */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b border-emerald-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>{t.section3Title}</span>
            </h3>

            {/* Membership Type selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">{t.membershipType}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'general', label: t.generalMember },
                  { id: 'lifetime', label: t.lifetimeMember },
                  { id: 'wellwisher', label: t.wellwisher },
                  { id: 'donor', label: t.donorMember },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, membershipType: tier.id as any })}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border text-center transition-all cursor-pointer ${
                      formData.membershipType === tier.id
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Fee Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">{t.monthlyFeeRate}</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: '100', label: t.fee100 },
                  { id: '200', label: t.fee200 },
                  { id: '500', label: t.fee500 },
                  { id: '1000', label: t.fee1000 },
                  { id: 'other', label: t.feeOther },
                ].map((rate) => (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => handleFeeChange(rate.id)}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border text-center transition-all cursor-pointer ${
                      formData.monthlyFee === rate.id
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {rate.label}
                  </button>
                ))}
              </div>

              {formData.monthlyFee === 'other' && (
                <div className="mt-2 flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    value={formData.customMonthlyFee}
                    onChange={(e) => {
                      const val = e.target.value;
                      const words = getAmountInWords(Number(val) || 0, lang);
                      setFormData({
                        ...formData,
                        customMonthlyFee: val,
                        feeInWords: words,
                      });
                    }}
                    placeholder="টাকার পরিমাণ লিখুন"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  />
                  <span className="text-xs font-semibold text-slate-600 shrink-0">/- টাকা</span>
                </div>
              )}
            </div>

            {/* Amount in words & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.feeInWords}</label>
                <input
                  type="text"
                  value={formData.feeInWords}
                  onChange={(e) => setFormData({ ...formData, feeInWords: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.paymentMethod}</label>
                <div className="flex items-center gap-4 pt-1">
                  {[
                    { id: 'cash', label: t.cash },
                    { id: 'bkash_nagad', label: t.bkashNagad },
                    { id: 'bank', label: t.bank },
                  ].map((pm) => (
                    <label key={pm.id} className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={formData.paymentMethod === pm.id}
                        onChange={() => setFormData({ ...formData, paymentMethod: pm.id as any })}
                        className="text-emerald-700"
                      />
                      <span>{pm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Declaration & Signatories */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b border-emerald-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>{t.section4Title}</span>
            </h3>

            <div className="bg-emerald-50/70 p-3 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed text-justify">
              {org.declarationBn || t.declarationText}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.proposerSignAndId}</label>
                <input
                  type="text"
                  value={formData.proposerNameAndId}
                  onChange={(e) => setFormData({ ...formData, proposerNameAndId: e.target.value })}
                  placeholder="প্রস্তাবকের নাম ও সদস্য আইডি"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.supporterSignAndId}</label>
                <input
                  type="text"
                  value={formData.supporterNameAndId}
                  onChange={(e) => setFormData({ ...formData, supporterNameAndId: e.target.value })}
                  placeholder="সমর্থকের নাম ও সদস্য আইডি"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'আবেদনকারীর স্বাক্ষর ও তারিখ' : "Applicant's Signature & Date"}
                </label>

                {/* Signature Upload & Preview Box */}
                <div className="border border-slate-300 rounded-md p-2 bg-slate-50 mb-2">
                  {formData.applicantSignatureUrl ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-10 px-2 py-0.5 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src={formData.applicantSignatureUrl} 
                          alt="Signature Preview" 
                          className="max-h-full max-w-full object-contain" 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => signatureInputRef.current?.click()}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                        >
                          {isBn ? 'পরিবর্তন' : 'Change'}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          {isBn ? 'মুছুন' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="w-full py-1.5 px-3 bg-white hover:bg-emerald-50 border border-dashed border-emerald-600 rounded text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isBn ? 'স্বাক্ষর আপলোড করুন' : 'Upload Signature Image'}</span>
                    </button>
                  )}
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </div>

                <input
                  type="text"
                  value={formData.applicantSignatureDate}
                  onChange={(e) => setFormData({ ...formData, applicantSignatureDate: e.target.value })}
                  placeholder="তারিখ (YYYY-MM-DD)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-sans"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Office Use Only */}
          <div className="space-y-3 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.section5Title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">{t.membershipStatus}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white font-medium"
                >
                  <option value="pending">{t.suspended}</option>
                  <option value="approved">{t.approved}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">{t.memberIdNo}</label>
                <input
                  type="text"
                  value={formData.memberIdNo}
                  onChange={(e) => setFormData({ ...formData, memberIdNo: e.target.value })}
                  placeholder="যেমন: ভাদ্রাজপ-০১০২"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white font-sans font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">{t.admissionFee}</label>
                <input
                  type="text"
                  value={formData.admissionFee}
                  onChange={(e) => setFormData({ ...formData, admissionFee: e.target.value })}
                  placeholder="যেমন: ৫০০"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">{t.receiptNo}</label>
                <input
                  type="text"
                  value={formData.admissionReceiptNo}
                  onChange={(e) => setFormData({ ...formData, admissionReceiptNo: e.target.value })}
                  placeholder="যেমন: র-০১০২"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs sm:text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>{t.resetForm}</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('replica')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-emerald-600 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{t.modePrintReplica}</span>
              </button>

              {hasSavedCurrentForm ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>{isBn ? `সংরক্ষিত (ফরম নং: ${toBengaliDigits(formData.formNo)})` : `Saved (Form: ${formData.formNo})`}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartNewForm}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 shadow-md transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-200" />
                    <span>{isBn ? 'নতুন আবেদন শুরু করুন' : 'Start New Application'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    isSubmitting
                      ? 'bg-emerald-950 text-emerald-200 cursor-not-allowed opacity-90'
                      : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-md'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>{isBn ? 'সিরিয়াল নির্ধারণ ও সংরক্ষণ হচ্ছে...' : 'Allocating Serial & Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-emerald-200" />
                      <span>{t.saveData}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          </div>

          {/* Printable Admission Form View (Hidden on screen, prints cleanly when quick print is triggered) */}
          <div className="hidden print:block print:w-full print:m-0 print:p-0">
            <AdmissionFormPrintView
              member={formData}
              org={org}
              lang={lang}
              isBlank={false}
            />
          </div>
        </>
      )}

      {/* Real-time Submission Success & Final Form No Modal */}
      {submittedModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {isBn ? 'আবেদনটি সফলভাবে জমা হয়েছে!' : 'Application Submitted Successfully!'}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {isBn 
                ? 'আপনার জমাদানের সময়ক্রম (First-Come-First-Serve) অনুযায়ী চূড়ান্ত অনলাইন ফরম নং নির্ধারিত হয়েছে:' 
                : 'Your final online form number allocated upon submission:'}
            </p>
            
            <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl py-3.5 px-6 mb-5 shadow-xs">
              <span className="text-xs font-semibold text-emerald-800 block mb-1">
                {isBn ? 'আপনার চূড়ান্ত অনলাইন ফরম নং' : 'Your Final Online Form No'}
              </span>
              <span className="text-4xl font-extrabold text-emerald-950 font-sans tracking-widest">
                {isBn ? toBengaliDigits(submittedModalData.formNo) : submittedModalData.formNo}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-5">
              {isBn 
                ? 'আপনি এখনই পূরণকৃত ফরমটি প্রিন্ট করতে পারেন অথবা কপি ডাউনলোড করে সংরক্ষণ করতে পারেন।' 
                : 'You may now print or view your completed application form.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSubmittedModalData(null);
                  setViewMode('replica');
                }}
                className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>{isBn ? 'প্রিন্ট / কপি দেখুন' : 'View / Print Copy'}</span>
              </button>
              
              <button
                type="button"
                onClick={handleStartNewForm}
                className="w-full sm:flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {isBn ? 'নতুন আবেদন ফর্ম' : 'New Application'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
