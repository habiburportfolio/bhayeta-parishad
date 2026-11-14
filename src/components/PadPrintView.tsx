import React from 'react';
import { OrganizationProfile, Language } from '../types';
import { toBengaliDigits } from '../utils/numberToWords';

interface PadPrintViewProps {
  memoNo: string;
  date: string;
  subject?: string;
  content: string;
  org: OrganizationProfile;
  lang: Language;
  isBlank?: boolean;
}

export const PadPrintView: React.FC<PadPrintViewProps> = ({
  memoNo,
  date,
  subject,
  content,
  org,
  lang,
  isBlank = false,
}) => {
  const isBn = lang === 'bn';

  return (
    <div className="pad-print-document bg-white text-slate-900 mx-auto w-full max-w-[800px] min-h-[1050px] p-6 sm:p-10 border border-slate-300 shadow-sm relative flex flex-col justify-between font-serif select-text print:border-none print:shadow-none print:p-0 print:m-0 print:min-h-screen">
      
      {/* Background Central Seal Watermark */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0"
        aria-hidden="true"
      >
        <div className="w-[450px] h-[450px] rounded-full border-[12px] border-emerald-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-52 h-52 rounded-full border-4 border-emerald-800 flex items-center justify-center mb-2">
            <span className="text-4xl font-bold text-emerald-950 font-sans">ভায়েটা</span>
          </div>
          <p className="text-base font-bold text-emerald-900 tracking-wider">ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ</p>
          <p className="text-xs text-slate-700">স্থাপিত : ২০২৬ খ্রিস্টাব্দ</p>
        </div>
      </div>

      {/* Top Left Arabesque Decorative Floral Artwork */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none select-none z-10 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-800 fill-current opacity-90">
          <path d="M0,0 L100,0 C70,25 25,70 0,100 Z" fill="#006837" opacity="0.15" />
          <path d="M0,0 L70,0 C50,20 20,50 0,70 Z" fill="#006837" opacity="0.4" />
          <circle cx="20" cy="20" r="14" fill="none" stroke="#006837" strokeWidth="2" />
          <path d="M5,5 Q25,35 45,5 Q35,25 5,45 Z" fill="#006837" />
        </svg>
      </div>

      {/* Main Letterhead Header */}
      <div className="relative z-10 text-center pb-3 border-b border-emerald-800/40">
        <div className="text-sm sm:text-base font-semibold text-slate-700 tracking-wide mb-1">
          {isBn ? "বিস্মিহী তা'আলা" : "Bismillahi Ta'ala"}
        </div>

        {/* Logo and Titles */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-700 p-0.5 shrink-0 bg-white shadow-xs">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-emerald-50 border border-emerald-600 flex flex-col items-center justify-center text-center p-1">
                <span className="text-[10px] font-bold text-emerald-900 leading-none">ভায়েটা</span>
                <span className="text-[7px] text-emerald-700 font-sans">জনকল্যাণ পরিষদ</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#006837] tracking-tight font-serif drop-shadow-2xs">
              {org.nameBn}
            </h1>
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#1a365d] tracking-wider font-sans uppercase mt-0.5">
              {org.nameEn}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
              {org.establishedBn}
            </p>
          </div>
        </div>

        {/* Memo No & Date Line */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 mt-4 px-2">
          <div>
            <span>স্মারক নং- </span>
            <span className="font-bold border-b border-dotted border-slate-700 px-2 min-w-[120px] inline-block text-left">
              {isBlank ? '' : (isBn ? toBengaliDigits(memoNo) : memoNo)}
            </span>
          </div>

          <div>
            <span>তারিখ ঃ </span>
            <span className="border-b border-dotted border-slate-700 px-2 min-w-[120px] inline-block text-center font-sans">
              {isBlank ? '' : (isBn ? toBengaliDigits(date) : date)}
            </span>
          </div>
        </div>
      </div>

      {/* Letter Body Area */}
      <div className="relative z-10 flex-1 py-6 px-2 text-slate-900 text-sm sm:text-base leading-relaxed">
        {!isBlank && (
          <>
            {subject && (
              <div className="font-bold text-base sm:text-lg mb-4 text-slate-950 underline decoration-slate-400 underline-offset-4">
                {isBn ? `বিষয়ঃ ${subject}` : `Subject: ${subject}`}
              </div>
            )}
            
            <div className="whitespace-pre-wrap text-justify min-h-[350px]">
              {content}
            </div>

            {/* Signature Area at bottom of text */}
            <div className="mt-16 flex justify-end">
              <div className="text-center min-w-[180px]">
                <div className="border-t border-slate-700 pt-1 font-bold text-sm text-slate-900">
                  {isBn ? 'সাধারণ সম্পাদক / সভাপতি' : 'General Secretary / President'}
                </div>
                <div className="text-xs text-slate-600">
                  {isBn ? org.nameBn : org.nameEn}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pad Footer Section */}
      <div className="relative z-10 pt-3 border-t border-emerald-800/40 text-center text-xs text-slate-800 leading-snug">
        <div className="font-medium">
          {isBn ? org.addressBn : org.addressEn}
        </div>
        <div className="font-medium font-sans mt-0.5">
          মোবাইল ঃ {org.phones.join(', ')} | e-mail: {org.email}
        </div>

        {/* Alternating Green & Blue Colored Block Ribbon */}
        <div className="w-full h-3 mt-2 flex">
          {Array.from({ length: 14 }).map((_, idx) => (
            <div 
              key={idx} 
              className={`flex-1 h-full ${idx % 2 === 0 ? 'bg-[#006837]' : 'bg-[#1a365d]'}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
