import React from 'react';
import { CollectionReceipt, OrganizationProfile, Language } from '../types';
import { toBengaliDigits } from '../utils/numberToWords';

interface ReceiptPrintViewProps {
  receipt: CollectionReceipt;
  org: OrganizationProfile;
  lang: Language;
  isBlank?: boolean;
}

export const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({
  receipt,
  org,
  lang,
  isBlank = false,
}) => {
  const isBn = lang === 'bn';

  const formatSl = (sl: string) => (isBlank ? '' : (isBn ? toBengaliDigits(sl) : sl));
  const formatAmt = (amt: number) => (isBlank ? '' : (isBn ? `${toBengaliDigits(amt)}/-` : `${amt}/-`));
  const val = (txt: string | undefined | null) => (isBlank ? '' : txt || '');

  // Sub-component for an individual slip (Left Stub or Right Customer slip)
  const ReceiptSlip = ({ isStub = false }: { isStub?: boolean }) => (
    <div className={`relative bg-white border border-slate-400 p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-2xs font-serif ${
      isStub ? 'w-full md:w-[38%] print:w-[38%]' : 'w-full md:w-[62%] print:w-[62%]'
    }`}>
      
      {/* Background Watermark */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0"
        aria-hidden="true"
      >
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-slate-700 flex flex-col items-center justify-center text-center p-2">
          <span className="text-xl font-bold font-sans">ভায়েটা</span>
          <span className="text-[9px]">আদর্শ গ্রাম জনকল্যাণ পরিষদ</span>
        </div>
      </div>

      {/* Header Lockup */}
      <div className="relative z-10 text-center pb-2 border-b border-slate-300">
        <div className="text-[11px] font-semibold text-slate-700">
          বিস্মিহী তা'আলা
        </div>

        <div className="flex items-center justify-center gap-2 mt-0.5">
          {/* Logo */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-600 p-0.5 bg-white shrink-0">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-800">
                ভা
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 leading-tight">
              {org.nameBn}
            </h2>
            <h3 className="text-[9px] sm:text-[11px] font-bold text-slate-800 tracking-wider font-sans uppercase">
              {org.nameEn}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-slate-600">
              {org.establishedBn}
            </p>
          </div>
        </div>

        {/* Address and Phones */}
        <p className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">
          {org.addressBn}
        </p>
        <p className="text-[9px] sm:text-[10px] text-slate-700 font-sans font-medium">
          {org.phones.join(', ')}
        </p>

        {/* Center Pill: রশীদ বহি & Copy Type */}
        <div className="mt-1 flex flex-col items-center justify-center gap-1">
          <span className="bg-slate-900 text-white px-5 py-0.5 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-2xs">
            রশিদ বহি
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${isStub ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
            {isStub ? (isBn ? 'অফিস কপি (কাউন্টারফয়েল)' : 'Office Copy (Stub)') : (isBn ? 'গ্রাহক / সদস্য কপি' : 'Customer / Member Copy')}
          </span>
        </div>

        {/* Serial No and Date */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 mt-2 px-1">
          <div>
            <span>ক্রমিক নং- </span>
            <span className="font-bold border-b border-dotted border-slate-700 px-2 min-w-[50px] inline-block text-center">
              {formatSl(receipt.serialNo)}
            </span>
          </div>

          <div>
            <span>তারিখ : </span>
            <span className="border-b border-dotted border-slate-700 px-1 min-w-[90px] inline-block text-center font-sans">
              {isBlank ? '' : (isBn ? toBengaliDigits(receipt.date) : receipt.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Receipt Body Fields */}
      <div className="relative z-10 py-3 space-y-2 text-xs sm:text-sm">
        {/* Name */}
        <div className="flex items-baseline gap-1">
          <span className="font-semibold shrink-0">নাম</span>
          <span className="shrink-0 font-bold">:</span>
          <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] font-bold">
            {val(receipt.payerName)}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-baseline gap-1">
          <span className="font-semibold shrink-0">ঠিকানা</span>
          <span className="shrink-0 font-bold">:</span>
          <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px]">
            {val(receipt.address)}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-baseline gap-1">
          <span className="font-semibold shrink-0">টাকার পরিমাণ</span>
          <span className="shrink-0 font-bold">:</span>
          <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] font-sans font-bold text-slate-900">
            {formatAmt(receipt.amount)}
          </div>
        </div>

        {/* In Words */}
        <div className="flex items-baseline gap-1">
          <span className="font-semibold shrink-0">কথায়</span>
          <span className="shrink-0 font-bold">:</span>
          <div className="flex-1 border-b border-dotted border-slate-700 px-2 min-h-[22px] font-medium text-slate-800">
            {val(isBn ? receipt.amountInWordsBn : receipt.amountInWordsEn)}
          </div>
        </div>
      </div>

      {/* Security Pattern (Guilloche Style SVG Strip) */}
      <div className="relative z-10 my-1 py-1">
        <svg viewBox="0 0 400 12" className="w-full h-3 text-slate-400 fill-current opacity-70">
          <pattern id={`guilloche-${isStub ? 'stub' : 'main'}`} x="0" y="0" width="20" height="12" patternUnits="userSpaceOnUse">
            <path d="M0,6 Q5,0 10,6 T20,6" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <path d="M0,6 Q5,12 10,6 T20,6" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
          <rect width="400" height="12" fill={`url(#guilloche-${isStub ? 'stub' : 'main'})`} />
        </svg>
      </div>

      {/* Signatures Row */}
      <div className="relative z-10 flex items-end justify-between pt-5 px-2 text-xs text-slate-800">
        <div className="text-center">
          <div className="border-t border-slate-700 pt-1 font-semibold min-w-[100px]">
            সভাপতি/ সেক্রেটারী
          </div>
        </div>

        <div className="text-center">
          <div className="border-t border-slate-700 pt-1 font-semibold min-w-[100px]">
            আদায়কারীর স্বাক্ষর
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="receipt-print-wrapper bg-white mx-auto w-full max-w-[960px] p-4 sm:p-6 border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
      
      {/* Side-by-side Layout with Stub on Left and Main Customer Slip on Right */}
      <div className="flex flex-col md:flex-row print:!flex-row gap-4 print:gap-2 items-stretch justify-between relative">
        {/* Stub Slip (Office Copy) */}
        <ReceiptSlip isStub={true} />

        {/* Perforated Cutting Line Divider */}
        <div className="hidden md:flex print:!flex flex-col items-center justify-between text-slate-400 text-xs py-2 select-none">
          <span>✁</span>
          <div className="w-[1px] h-full border-r border-dashed border-slate-400 my-1"></div>
          <span>✁</span>
        </div>

        {/* Main Customer Slip */}
        <ReceiptSlip isStub={false} />
      </div>

      {/* Screen notice */}
      <div className="no-print mt-3 text-center text-xs text-slate-400">
        * প্রিন্ট দিলে এক পৃষ্ঠায় উভয় স্লিপ (অফিস কপি ও গ্রাহক কপি) একসাথে প্রিন্ট হবে।
      </div>
    </div>
  );
};
