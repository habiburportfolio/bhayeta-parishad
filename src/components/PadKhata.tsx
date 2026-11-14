import React, { useState } from 'react';
import { 
  Printer, 
  FileDown, 
  Save, 
  Eye, 
  Edit3, 
  Sparkles, 
  RotateCcw, 
  CheckCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { Language, OrganizationProfile, PadDocument } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { PadPrintView } from './PadPrintView';
import { exportPadDocumentToDoc, triggerPrint } from '../utils/exportTools';

interface PadKhataProps {
  org: OrganizationProfile;
  lang: Language;
  savedDocs: PadDocument[];
  onSaveDoc: (doc: PadDocument) => void;
  onDeleteDoc?: (id: string) => void;
}

export const PadKhata: React.FC<PadKhataProps> = ({
  org,
  lang,
  savedDocs,
  onSaveDoc,
  onDeleteDoc,
}) => {
  const t = TRANSLATIONS[lang];
  const isBn = lang === 'bn';

  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('preview');
  const [printBlank, setPrintBlank] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Pad State
  const [memoNo, setMemoNo] = useState('ভাদ্রাজপ/২০২৬/০১');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState('ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদের জরুরি সাধারণ সভা সংক্রান্ত নোটিশ।');
  const [content, setContent] = useState(
`এতদ্বারা ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদের সকল সম্মানিত উপদেষ্টা, আজীবন সদস্য ও সাধারণ সদস্যবৃন্দের অবগতির জন্য জানানো যাচ্ছে যে, পরিষদের উন্নয়নমূলক কার্যক্রম, আসন্ন রমজান উপলক্ষে ত্রাণ বিতরণ ও তহবিল বৃদ্ধি সংক্রান্ত বিষয়ে এক জরুরি সাধারণ সভার আয়োজন করা হয়েছে।

উক্ত সভায় আপনার উপস্থিতি একান্ত কাম্য।

সভার সময়সূচিঃ
তারিখঃ ১০ই নভেম্বর, ২০২৬ খ্রিস্টাব্দ
সময়ঃ বাদ আসর (বিকাল ৪:৩০ ঘটিকা)
স্থানঃ পরিষদ অস্থায়ী কার্যালয়, ভায়েটা, টাঙ্গাইল সদর।

আলোচ্য বিষয়সমূহঃ
১. পূর্ববর্তী সভার কার্যবিবরণী অনুমোদন।
২. নতুন সদস্য ভর্তি কার্যক্রম পর্যালোচনা।
৩. সামাজিক ও শিক্ষা কল্যাণমূলক তহবিল গঠন।
৪. বিবিধ।`
  );

  // Template loaders
  const loadTemplate = (type: string) => {
    if (type === 'meeting') {
      setSubject('জরুরি সাধারণ সভা ও কার্যনির্বাহী কমিটির নোটিশ');
      setContent(
`সম্মানিত সদস্যবৃন্দ,
আসসালামু আলাইকুম।
ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদের সার্বিক কল্যাণ ও সামাজিক কার্যক্রম গতিশীল করার লক্ষ্যে আগামী শুক্রবার বাদ জুমা এক জরুরি আলোচনা সভা অনুষ্ঠিত হবে। 

উক্ত সভায় সংশ্লিষ্ট সকলকে যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ জানানো যাচ্ছে।`
      );
    } else if (type === 'certificate') {
      setSubject('সদস্য প্রত্যয়ন পত্র');
      setContent(
`প্রত্যয়ন করা যাচ্ছে যে, জনাব ...................................................., পিতাঃ ...................................................., গ্রামঃ ভায়েটা, ডাকঘরঃ গালা, উপজেলাঃ টাঙ্গাইল সদর, জেলাঃ টাঙ্গাইল অত্র "ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ"-এর একজন সক্রিয় ও নিয়মিত সদস্য (সদস্য আইডি নং: ........................)।

তিনি অত্র গ্রামের শিক্ষা, সামাজিক উন্নয়ন এবং জনকল্যাণমূলক কাজে নিয়মিত অংশগ্রহণ করে থাকেন। তাঁর নৈতিক চরিত্র প্রশংসনীয়।

আমি তাঁর ভবিষ্যৎ জীবনের সার্বিক কল্যাণ ও সাফল্য কামনা করি।`
      );
    } else if (type === 'resolution') {
      setSubject('কার্যনির্বাহী কমিটির সভার রেজুলেশন / কার্যবিবরণী');
      setContent(
`আজ ০৫/১১/২০২৬ খ্রিস্টাব্দ রোজ বুধবার অত্র পরিষদের সভাপতি মহোদয়ের সভাপতিত্বে এক সাধারণ সভা অনুষ্ঠিত হয়। সভায় নিম্নলিখিত সিদ্ধান্তসমূহ সর্বসম্মতিক্রমে গৃহীত হয়ঃ

সিদ্ধান্ত নং ১ঃ অত্র গ্রামের অসচ্ছল শিক্ষার্থীদের শিক্ষা উপকরণ বিতরণের তহবিল অনুমোদন করা হলো।
সিদ্ধান্ত নং ২ঃ নতুন সদস্য ভর্তি ফি ও নিয়মিত মাসিক চাঁদা ডিজিটাল রেজিস্ট্রেশন প্রক্রিয়ায় সংগ্রহের সিদ্ধান্ত গৃহীত হলো।
সিদ্ধান্ত নং ৩ঃ গ্রামের প্রাথমিক বিদ্যালয় প্রাঙ্গণে বৃক্ষরোপণ কর্মসূচি পালন করা হবে।`
      );
    }
  };

  const handleSave = () => {
    const docId = activeDocId || `pad_${Date.now()}`;
    const doc: PadDocument = {
      id: docId,
      memoNo,
      date,
      subject,
      content,
      signatoryTitle: 'সাধারণ সম্পাদক / সভাপতি',
      signatoryName: isBn ? org.nameBn : org.nameEn,
      updatedAt: Date.now(),
    };
    setActiveDocId(docId);
    onSaveDoc(doc);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handlePrint = (blank: boolean) => {
    setPrintBlank(blank);
    setViewMode('preview');
    setTimeout(() => {
      triggerPrint();
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Controls Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* View Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => { setViewMode('preview'); setPrintBlank(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-700" />
            <span>{t.modePrintReplica}</span>
          </button>
          
          <button
            onClick={() => { setViewMode('editor'); setPrintBlank(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4 text-emerald-700" />
            <span>{isBn ? 'প্যাড টাইপিং এডিটর' : 'Letterhead Editor'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Blank Pad */}
          <button
            onClick={() => handlePrint(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="শুধু অফিশিয়াল প্যাড প্রিন্ট করার জন্য (হাতে লেখার কাগজ)"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'খালি প্যাড প্রিন্ট' : 'Print Blank Pad'}</span>
          </button>

          {/* Print Filled Pad */}
          <button
            onClick={() => handlePrint(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>{isBn ? 'প্যাড প্রিন্ট করুন' : 'Print Pad'}</span>
          </button>

          {/* Export to Word/Docs */}
          <button
            onClick={() => exportPadDocumentToDoc(subject, date, memoNo, content, org)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Google Docs বা Word এ খোলার জন্য"
          >
            <FileDown className="w-4 h-4 text-emerald-700" />
            <span>{t.exportDocs}</span>
          </button>

          {/* Save to History */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-300" />
            <span>{t.saveData}</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {savedToast && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span>{t.savedSuccess}</span>
        </div>
      )}

      {/* View Switch Container */}
      {viewMode === 'preview' ? (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs sm:text-sm text-emerald-900 font-medium">
            <span>
              {printBlank
                ? 'বর্তমানে খালি প্যাড প্রিভিউ দেখাচ্ছে (খালি অফিশিয়াল প্যাড প্রিন্ট করার জন্য)'
                : 'বর্তমানে টাইপকৃত নোটিশ/চিঠিসহ প্যাড প্রিভিউ দেখাচ্ছে'}
            </span>
            <button
              onClick={() => setPrintBlank(!printBlank)}
              className="underline font-bold cursor-pointer"
            >
              {printBlank ? 'টাইপকৃত চিঠি দেখুন' : 'খালি প্যাড দেখুন'}
            </button>
          </div>

          <div className="print-only-container overflow-x-auto pb-6">
            <PadPrintView
              memoNo={memoNo}
              date={date}
              subject={subject}
              content={content}
              org={org}
              lang={lang}
              isBlank={printBlank}
            />
          </div>
        </div>
      ) : (
        /* Pad Editor Mode */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t.padTitle}</h2>
              <p className="text-xs text-slate-500">{t.padSubtitle}</p>
            </div>

            {/* Quick Template Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.padTemplates}:</span>
              </span>
              <button
                type="button"
                onClick={() => loadTemplate('meeting')}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                {t.templateMeetingNotice}
              </button>
              <button
                type="button"
                onClick={() => loadTemplate('resolution')}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                {t.templateResolution}
              </button>
              <button
                type="button"
                onClick={() => loadTemplate('certificate')}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                {t.templateCertificate}
              </button>
            </div>
          </div>

          {/* Memo No & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.memoNo}</label>
              <input
                type="text"
                value={memoNo}
                onChange={(e) => setMemoNo(e.target.value)}
                placeholder="যেমন: ভাদ্রাজপ/২০২৬/০১"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.memoDate}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.letterSubject}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="চিঠি বা নোটিশের মূল বিষয়"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? 'চিঠিপত্র বা নোটিশের বিবরণ' : 'Letterhead Content'}
              </label>
              <textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.letterBodyPlaceholder}
                className="w-full px-4 py-3 border border-slate-300 rounded-md text-sm sm:text-base leading-relaxed font-serif focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => { setSubject(''); setContent(''); setActiveDocId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.clearPad}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('preview')}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-emerald-600 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
              >
                প্রিভিউ দেখুন
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
              >
                {t.saveData}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Documents History */}
      {savedDocs.length > 0 && (
        <div className="no-print bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {t.padDocsTab} ({savedDocs.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedDocs.map((doc) => (
              <div 
                key={doc.id}
                className={`p-3 border rounded-lg transition-all flex flex-col justify-between ${
                  activeDocId === doc.id
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20'
                }`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    setActiveDocId(doc.id);
                    setMemoNo(doc.memoNo);
                    setDate(doc.date);
                    setSubject(doc.subject);
                    setContent(doc.content);
                    setViewMode('preview');
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold font-sans">{doc.memoNo}</span>
                    <span>{doc.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{doc.subject || 'অনুলিপি'}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{doc.content}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setMemoNo(doc.memoNo);
                      setDate(doc.date);
                      setSubject(doc.subject);
                      setContent(doc.content);
                      setViewMode('editor');
                    }}
                    className="text-[11px] text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    সম্পাদনা করুন
                  </button>
                  {onDeleteDoc && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('আপনি কি এই সংরক্ষিত চিঠিটি মুছে ফেলতে চান?')) {
                          onDeleteDoc(doc.id);
                          if (activeDocId === doc.id) {
                            setActiveDocId(null);
                          }
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-sm cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
