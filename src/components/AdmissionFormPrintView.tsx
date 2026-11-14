import React from 'react';
import { MemberApplication, OrganizationProfile, Language } from '../types';
import { toBengaliDigits } from '../utils/numberToWords';

interface AdmissionFormPrintViewProps {
  member: MemberApplication;
  org: OrganizationProfile;
  lang: Language;
  isBlank?: boolean;
}

export const AdmissionFormPrintView: React.FC<AdmissionFormPrintViewProps> = ({
  member,
  org,
  lang,
  isBlank = false,
}) => {
  const isBn = lang === 'bn';

  // Format helper
  const val = (text: string | undefined | null) => (isBlank ? '' : text || '');

  const defaultDeclarationBn = "আমি এই মর্মে অঙ্গীকার করছি যে, ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ-এর নিয়ম-কানুন, গঠনতন্ত্র ও লক্ষ্য-উদ্দেশ্য যথাযথভাবে মেনে চলব । গ্রামের শিক্ষা, সমাজকল্যাণ, ইসলামিক মূল্যবোধ ও সামাজিক উন্নয়নে সক্রিয় অংশগ্রহণ করব এবং আমার নির্বাচিত মাসিক চাঁদা নিয়মিত পরিষদ তহবিলে প্রদান করব । আমার প্রদত্ত সকল তথ্য সত্য ও নির্ভুল ।";
  const defaultDeclarationEn = "I hereby pledge to abide by the rules, constitution, and objectives of the Bhayeta Adarsha Gram Janakallyan Parishad, actively participate in village welfare, education, Islamic and social development, and regularly contribute my chosen monthly subscription to the parishad fund. All information provided by me is true and accurate.";

  return (
    <div className="admission-print-document bg-white text-slate-900 mx-auto w-full max-w-[820px] p-6 sm:p-8 border border-slate-300 shadow-sm relative print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none select-text font-serif leading-normal">
      
      {/* Background Seal Watermark */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none z-0"
        aria-hidden="true"
      >
        <div className="w-[380px] h-[380px] rounded-full border-[8px] border-emerald-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-44 h-44 rounded-full border-4 border-emerald-800 flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-emerald-950 font-sans">ভায়েটা</span>
          </div>
          <p className="text-sm font-bold text-emerald-900 tracking-wider">ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ</p>
          <p className="text-xs text-slate-700">স্থাপিত : ২০২৬</p>
        </div>
      </div>

      {/* Top Left Decorative Arabesque Motif */}
      <div className="absolute top-0 left-0 w-24 h-24 print:w-16 print:h-16 pointer-events-none select-none z-10 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-800 fill-current opacity-90">
          <path d="M0,0 L100,0 C70,25 25,70 0,100 Z" fill="#006837" opacity="0.15" />
          <path d="M0,0 L70,0 C50,20 20,50 0,70 Z" fill="#006837" opacity="0.4" />
          <circle cx="20" cy="20" r="14" fill="none" stroke="#006837" strokeWidth="2" />
          <path d="M5,5 Q25,35 45,5 Q35,25 5,45 Z" fill="#006837" />
        </svg>
      </div>

      {/* ================= Header Section ================= */}
      <div className="relative z-10 text-center pb-2.5 print:pb-2 border-b-2 border-emerald-800">
        <div className="text-sm sm:text-base print:text-[12px] font-semibold text-slate-700 tracking-wide mb-1 print:mb-0.5">
          {isBn ? "বিস্মিহী তা'আলা" : "Bismillahi Ta'ala"}
        </div>

        {/* Logo & Org Name Lockup */}
        <div className="flex items-center justify-center gap-4 print:gap-3.5 mt-1 print:mt-1">
          {/* Official Round Crest Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 print:w-15 print:h-15 rounded-full border-2 border-emerald-700 p-0.5 shrink-0 bg-white shadow-xs">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-emerald-50 border border-emerald-600 flex flex-col items-center justify-center text-center p-1">
                <span className="text-[10px] print:text-[8px] font-bold text-emerald-900 leading-none">ভায়েটা</span>
                <span className="text-[7px] print:text-[6px] text-emerald-700 font-sans">জনকল্যাণ পরিষদ</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl print:text-[25px] print:leading-tight font-extrabold text-[#006837] tracking-tight font-serif">
              {org.nameBn}
            </h1>
            <h2 className="text-sm sm:text-base md:text-lg print:text-[11.5px] print:leading-tight font-bold text-[#1a365d] tracking-wide font-sans uppercase mt-0.5 print:mt-0.5">
              {org.nameEn}
            </h2>
            <p className="text-xs sm:text-sm print:text-[10.5px] font-semibold text-slate-700 mt-0.5 print:mt-0.5">
              {org.establishedBn}
            </p>
          </div>
        </div>

        {/* Form Meta Row: Form No & Date */}
        <div className="flex items-center justify-between text-xs sm:text-sm print:text-[11.5px] font-semibold text-slate-800 mt-2.5 print:mt-2 px-2">
          <div className="flex items-baseline gap-1">
            <span>{isBn ? 'অনলাইন ফরম নং :' : 'Online Form No :'}</span>
            <span className="font-bold border-b border-dotted border-slate-700 px-2 min-w-[75px] inline-block text-center font-sans">
              {isBlank ? '' : (isBn ? toBengaliDigits(member.formNo) : member.formNo)}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span>{isBn ? 'তারিখ :' : 'Date :'}</span>
            <span className="border-b border-dotted border-slate-700 px-2 min-w-[120px] print:min-w-[105px] inline-block text-center font-sans">
              {isBlank ? '' : (isBn ? toBengaliDigits(member.date) : member.date)}
            </span>
          </div>
        </div>
      </div>

      {/* ================= Title Badge & Photo Container ================= */}
      <div className="relative z-10 flex items-center justify-center my-3 print:my-2.5 min-h-[96px] print:min-h-[88px]">
        {/* Symmetrically Centered Title Badge */}
        <div className="bg-[#006837] text-white px-7 py-1.5 print:px-6 print:py-1 rounded-full shadow-xs text-sm sm:text-base print:text-xs font-bold tracking-wide text-center">
          {isBn ? 'সদস্য ভর্তি আবেদন ফরম' : 'Member Admission Application Form'}
        </div>

        {/* Passport Photo Box (Standard 35mm x 45mm ratio) */}
        <div className="absolute right-0 top-0 w-24 h-28 print:w-[78px] print:h-[92px] border-2 border-dashed border-cyan-700 bg-slate-50 flex items-center justify-center p-1 text-center overflow-hidden shadow-2xs">
          {!isBlank && member.photoUrl ? (
            <img 
              src={member.photoUrl} 
              alt="Applicant" 
              className="w-full h-full object-cover rounded-xs" 
            />
          ) : (
            <span className="text-[11px] print:text-[9.5px] font-sans text-cyan-800 leading-tight">
              {isBn ? 'আবেদনকারীর ছবি' : "Applicant's Photo"}
            </span>
          )}
        </div>
      </div>

      {/* ================= SECTION 1: Personal Info ================= */}
      <div className="relative z-10 mt-2.5 print:mt-1.5">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm print:text-[11.5px] text-[#006837] mb-2 print:mb-1.5">
          <span className="w-2.5 h-2.5 print:w-2 print:h-2 bg-[#006837] inline-block"></span>
          <span>{isBn ? 'আবেদনকারীর ব্যক্তিগত তথ্যাবলী :' : "Applicant's Personal Information :"}</span>
        </div>

        <div className="space-y-2 print:space-y-1.5 text-xs sm:text-sm print:text-[11px]">
          {/* Row 1: Full name bn */}
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">১. পূর্ণ নাম (বাংলায়) :</span>
            <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-medium">
              {val(member.fullNameBn)}
            </div>
          </div>

          {/* Row 2: Full name en */}
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">২. Name (In English Block Letter) :</span>
            <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-sans uppercase font-bold tracking-wide text-slate-800">
              {val(member.fullNameEn)}
            </div>
          </div>

          {/* Row 3: Father */}
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">৩. পিতার নাম :</span>
            <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px]">
              {val(member.fatherName)}
            </div>
          </div>

          {/* Row 4: Mother */}
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">৪. মাতার নাম :</span>
            <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px]">
              {val(member.motherName)}
            </div>
          </div>

          {/* Row 5: Occupation & Education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-semibold shrink-0">৫. পেশা/কর্মক্ষেত্র :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px]">
                {val(member.occupation)}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold shrink-0">৬. শিক্ষাগত যোগ্যতা :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px]">
                {val(member.education)}
              </div>
            </div>
          </div>

          {/* Row 6: DOB/Age & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-semibold shrink-0">৭. জন্ম তারিখ ও বয়স :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px]">
                {val(member.dobAndAge)}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold shrink-0">৮. রক্তের গ্রুপ :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-sans font-bold text-red-700">
                {val(member.bloodGroup)}
              </div>
            </div>
          </div>

          {/* Row 7: NID / Birth Reg */}
          <div className="flex items-baseline gap-1">
            <span className="font-semibold shrink-0">৯. জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন নং :</span>
            <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-sans tracking-wider">
              {val(member.nidOrBirthCert)}
            </div>
          </div>

          {/* Row 8: Mobile numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-semibold shrink-0">১০. মোবাইল নম্বর (প্রধান) :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-sans font-medium">
                {val(member.primaryMobile)}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-semibold shrink-0">১১. হোয়াটসঅ্যাপ/বিকল্প নং :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-sans font-medium">
                {val(member.whatsappOrAltMobile)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: Address ================= */}
      <div className="relative z-10 mt-3 pt-2 print:mt-2.5 print:pt-1.5 border-t border-slate-300">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm print:text-[11.5px] text-[#006837] mb-2 print:mb-1.5">
          <span className="w-2.5 h-2.5 print:w-2 print:h-2 bg-[#006837] inline-block"></span>
          <span>{isBn ? 'ঠিকানা :' : 'Address :'}</span>
        </div>

        <div className="space-y-2 print:space-y-1.5 text-xs sm:text-sm print:text-[11px]">
          {/* Present address - Perfectly Aligned Multi-Column */}
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="font-semibold shrink-0 min-w-[170px] print:min-w-[150px]">বর্তমান ঠিকানা গ্রাম/মহল্লা :</span>
            <span className="border-b border-dotted border-slate-700 px-1 flex-1 min-w-[110px] font-medium min-h-[21px] print:min-h-[19px]">
              {val(member.presentAddress?.villageOrArea)}
            </span>
            <span className="font-semibold shrink-0 ml-1.5">ডাকঘর :</span>
            <span className="border-b border-dotted border-slate-700 px-1 w-24 print:w-20 font-medium min-h-[21px] print:min-h-[19px] text-center">
              {val(member.presentAddress?.postOffice)}
            </span>
            <span className="font-semibold shrink-0 ml-1.5">উপজেলা :</span>
            <span className="border-b border-dotted border-slate-700 px-1 w-28 print:w-24 font-medium min-h-[21px] print:min-h-[19px] text-center">
              {val(member.presentAddress?.upazila)}
            </span>
            <span className="font-semibold shrink-0 ml-1.5">জেলা :</span>
            <span className="border-b border-dotted border-slate-700 px-1 w-24 print:w-20 font-medium min-h-[21px] print:min-h-[19px] text-center">
              {val(member.presentAddress?.district)}
            </span>
          </div>

          {/* Permanent address - Perfectly Aligned with Present address */}
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="font-semibold shrink-0 min-w-[170px] print:min-w-[150px]">স্থায়ী ঠিকানা গ্রাম/মহল্লা :</span>
            <span className="border-b border-dotted border-slate-700 px-1 flex-1 min-w-[110px] font-medium min-h-[21px] print:min-h-[19px]">
              {val(member.permanentAddress?.villageOrArea)}
            </span>
            <span className="font-semibold shrink-0 ml-1.5">ডাকঘর :</span>
            <span className="border-b border-dotted border-slate-700 px-1 w-24 print:w-20 font-medium min-h-[21px] print:min-h-[19px] text-center">
              {val(member.permanentAddress?.postOffice)}
            </span>
            <span className="font-semibold shrink-0 ml-1.5">উপজেলা :</span>
            <span className="border-b border-dotted border-slate-700 px-1 w-28 print:w-24 font-medium min-h-[21px] print:min-h-[19px] text-center">
              {val(member.permanentAddress?.upazila)}
            </span>
            <span className="font-semibold shrink-0 ml-1.5">জেলা :</span>
            <span className="border-b border-dotted border-slate-700 px-1 w-24 print:w-20 font-medium min-h-[21px] print:min-h-[19px] text-center">
              {val(member.permanentAddress?.district)}
            </span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 3: Membership Details ================= */}
      <div className="relative z-10 mt-3 pt-2 print:mt-2.5 print:pt-1.5 border-t border-slate-300">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm print:text-[11.5px] text-[#006837] mb-2 print:mb-1.5">
          <span className="w-2.5 h-2.5 print:w-2 print:h-2 bg-[#006837] inline-block"></span>
          <span>{isBn ? 'সদস্যপদ ও আর্থিক অনুদান সংক্রান্ত বিবরণ :' : 'Membership & Financial Contribution :'}</span>
        </div>

        <div className="space-y-2 print:space-y-1.5 text-xs sm:text-sm print:text-[11px]">
          {/* Membership type check boxes */}
          <div className="flex flex-wrap items-center gap-3.5 print:gap-3">
            <span className="font-semibold shrink-0">সদস্যপদের ধরন :</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.membershipType === 'general' ? '✓' : ''}
              </span>
              <span>সাধারণ সদস্য</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.membershipType === 'lifetime' ? '✓' : ''}
              </span>
              <span>আজীবন সদস্য</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.membershipType === 'wellwisher' ? '✓' : ''}
              </span>
              <span>শুভাকাঙ্ক্ষী/উপদেষ্টা</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.membershipType === 'donor' ? '✓' : ''}
              </span>
              <span>দাতা সদস্য</span>
            </div>
          </div>

          {/* Monthly fee boxes */}
          <div className="flex flex-wrap items-center gap-3.5 print:gap-3">
            <span className="font-semibold shrink-0">মাসিক চাঁদার হার :</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.monthlyFee === '100' ? '✓' : ''}
              </span>
              <span>১০০/- (ন্যূনতম)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.monthlyFee === '200' ? '✓' : ''}
              </span>
              <span>২০০/-</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.monthlyFee === '500' ? '✓' : ''}
              </span>
              <span>৫০০/-</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && member.monthlyFee === '1000' ? '✓' : ''}
              </span>
              <span>১০০০/-</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                {!isBlank && (member.monthlyFee === 'other' || !['100', '200', '500', '1000'].includes(member.monthlyFee)) ? '✓' : ''}
              </span>
              <span>অন্যান্য (অধিক পরিমাণ):</span>
              <span className="border-b border-dotted border-slate-700 px-1 min-w-[55px] inline-block text-center font-bold">
                {!isBlank && (member.monthlyFee === 'other' || !['100', '200', '500', '1000'].includes(member.monthlyFee))
                  ? toBengaliDigits(member.customMonthlyFee || (member.monthlyFee !== 'other' ? member.monthlyFee : ''))
                  : ''}
              </span>
              <span>/- টাকা।</span>
            </div>
          </div>

          {/* Amount in words and payment method */}
          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1 print:pt-0.5">
            <div className="flex items-baseline gap-1 flex-1">
              <span className="font-semibold shrink-0">টাকার পরিমাণ (কথায়) :</span>
              <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] print:min-h-[20px] font-medium">
                {val(member.feeInWords)}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-semibold">পরিশোধ মাধ্যম :</span>
              <label className="flex items-center gap-1">
                <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                  {!isBlank && member.paymentMethod === 'cash' ? '✓' : ''}
                </span>
                <span>নগদ</span>
              </label>
              <label className="flex items-center gap-1">
                <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                  {!isBlank && member.paymentMethod === 'bkash_nagad' ? '✓' : ''}
                </span>
                <span>বিকাশ/নগদ</span>
              </label>
              <label className="flex items-center gap-1">
                <span className="w-4 h-4 print:w-3.5 print:h-3.5 border-2 border-slate-700 inline-flex items-center justify-center font-bold text-xs print:text-[10px]">
                  {!isBlank && member.paymentMethod === 'bank' ? '✓' : ''}
                </span>
                <span>ব্যাংক</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 4: Declaration ================= */}
      <div className="relative z-10 mt-3 pt-2 print:mt-2.5 print:pt-1.5 border-t border-slate-300">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm print:text-[11.5px] text-[#006837] mb-2 print:mb-1">
          <span className="w-2.5 h-2.5 print:w-2 print:h-2 bg-[#006837] inline-block"></span>
          <span>{isBn ? 'অঙ্গীকারনামা :' : 'Declaration :'}</span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/80 p-2.5 print:p-2 rounded-xs text-xs sm:text-sm print:text-[11px] leading-relaxed print:leading-normal text-slate-800 text-justify">
          {isBn 
            ? (org.declarationBn || defaultDeclarationBn)
            : (org.declarationEn || defaultDeclarationEn)}
        </div>

        {/* 3 Signatures */}
        <div className="grid grid-cols-3 gap-4 print:gap-3 pt-3.5 print:pt-2.5 text-center text-xs sm:text-sm print:text-[11px]">
          <div>
            <div className="h-8 print:h-7 mb-0.5"></div>
            <div className="border-t border-slate-700 font-semibold pt-1 min-h-[24px] print:min-h-[19px]">
              {val(member.proposerNameAndId)}
            </div>
            <div className="text-slate-700 font-medium">{isBn ? 'প্রস্তাবকের স্বাক্ষর ও আইডি' : 'Proposer Sign & ID'}</div>
          </div>

          <div>
            <div className="h-8 print:h-7 mb-0.5"></div>
            <div className="border-t border-slate-700 font-semibold pt-1 min-h-[24px] print:min-h-[19px]">
              {val(member.supporterNameAndId)}
            </div>
            <div className="text-slate-700 font-medium">{isBn ? 'সমর্থকের স্বাক্ষর ও আইডি' : 'Supporter Sign & ID'}</div>
          </div>

          <div>
            <div className="h-8 print:h-7 flex items-end justify-center mb-0.5">
              {!isBlank && member.applicantSignatureUrl ? (
                <img 
                  src={member.applicantSignatureUrl} 
                  alt="Applicant Sign" 
                  className="max-h-8 print:max-h-7 max-w-[120px] object-contain" 
                />
              ) : null}
            </div>
            <div className="border-t border-slate-700 font-semibold pt-1 min-h-[24px] print:min-h-[19px]">
              {val(member.applicantSignatureDate ? (isBn ? toBengaliDigits(member.applicantSignatureDate) : member.applicantSignatureDate) : '')}
            </div>
            <div className="text-slate-700 font-medium">{isBn ? 'আবেদনকারীর স্বাক্ষর ও তারিখ' : 'Applicant Sign & Date'}</div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 5: Office Use Only ================= */}
      <div className="relative z-10 mt-3 print:mt-2.5 border-2 border-dashed border-teal-700 bg-teal-50/20 p-2.5 print:p-2 text-xs sm:text-sm print:text-[11px]">
        <div className="font-bold text-teal-900 mb-1 print:mb-0.5">
          {isBn ? 'পরিষদ অফিসের ব্যবহারের জন্য :' : 'For Parishad Office Use Only :'}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-y-1">
          <div className="space-y-1.5 print:space-y-1">
            <div className="flex items-center gap-3 print:gap-2">
              <span className="font-semibold">সদস্যপদ : </span>
              <span className="font-medium underline decoration-dotted">
                {isBlank ? 'অনুমোদিত / স্থগিত' : (member.status === 'approved' ? 'অনুমোদিত' : 'স্থগিত')}
              </span>
              <span className="font-semibold ml-2 print:ml-1.5">সদস্য আইডি নং : </span>
              <span className="border-b border-dotted border-slate-700 px-2 min-w-[90px] print:min-w-[80px] inline-block font-bold">
                {val(member.memberIdNo)}
              </span>
            </div>

            <div className="flex items-center gap-2 print:gap-1.5">
              <span className="font-semibold">ভর্তি ফি (যদি থাকে) : </span>
              <span className="border-b border-dotted border-slate-700 px-1 min-w-[50px] inline-block text-center font-medium">
                {val(member.admissionFee)}
              </span>
              <span>/- (রশিদ নং : </span>
              <span className="border-b border-dotted border-slate-700 px-1 min-w-[50px] inline-block text-center font-medium">
                {val(member.admissionReceiptNo)}
              </span>
              <span>)</span>
              <span className="font-semibold ml-2 print:ml-1.5">অনুমোদনের তারিখ : </span>
              <span className="border-b border-dotted border-slate-700 px-2 min-w-[80px] print:min-w-[75px] inline-block text-center font-sans">
                {val(member.approvalDate)}
              </span>
            </div>
          </div>

          <div className="text-center pt-2 print:pt-1 pr-2">
            <div className="border-t border-slate-700 min-w-[150px] print:min-w-[130px] pt-1 font-semibold text-slate-800">
              {isBn ? 'সাধারণ সম্পাদক/সভাপতির স্বাক্ষর' : 'General Secretary/President Sign'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= Footer ================= */}
      <div className="relative z-10 mt-3 print:mt-2.5 pt-1.5 print:pt-1 text-center text-xs print:text-[10px] text-slate-800 leading-snug">
        <div className="font-medium">
          {org.addressBn}
        </div>
        <div className="font-medium font-sans mt-0.5 print:mt-0.5">
          মোবাইল: {Array.isArray(org?.phones) ? org.phones.join(', ') : ''} | e-mail: {org?.email || ''}
        </div>
      </div>

    </div>
  );
};
