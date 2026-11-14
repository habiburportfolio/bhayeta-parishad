import React, { useState } from 'react';
import { 
  Printer, 
  Save, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  FileText, 
  CheckCircle 
} from 'lucide-react';
import { CollectionReceipt, Language, OrganizationProfile } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { ReceiptPrintView } from './ReceiptPrintView';
import { numberToBengaliWords, numberToEnglishWords, toBengaliDigits, toEnglishDigits } from '../utils/numberToWords';
import { exportReceiptsToExcel, triggerPrint } from '../utils/exportTools';

interface ReceiptBookProps {
  receipts: CollectionReceipt[];
  org: OrganizationProfile;
  lang: Language;
  onSaveReceipt: (receipt: CollectionReceipt) => void;
  onDeleteReceipt: (id: string) => void;
}

export const ReceiptBook: React.FC<ReceiptBookProps> = ({
  receipts,
  org,
  lang,
  onSaveReceipt,
  onDeleteReceipt,
}) => {
  const t = TRANSLATIONS[lang];
  const isBn = lang === 'bn';

  const [viewMode, setViewMode] = useState<'form' | 'preview'>('preview');
  const [printBlank, setPrintBlank] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const getNextSerial = (list: CollectionReceipt[]): string => {
    if (!list || list.length === 0) return '01';
    const nums = list.map((r) => parseInt(toEnglishDigits(r.serialNo), 10)).filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : list.length;
    return String(max + 1).padStart(2, '0');
  };

  // New receipt state
  const nextSl = getNextSerial(receipts);
  const [currentReceipt, setCurrentReceipt] = useState<CollectionReceipt>({
    id: `rcpt_${Date.now()}`,
    serialNo: nextSl,
    date: new Date().toISOString().slice(0, 10),
    payerName: 'মোহাম্মদ হাবিবুর রহমান',
    address: 'গ্রাম: ভায়েটা, গালা, টাঙ্গাইল সদর',
    amount: 500,
    amountInWordsBn: 'পাঁচশত টাকা মাত্র',
    amountInWordsEn: 'Five Hundred Taka Only',
    purpose: 'আজীবন সদস্য ভর্তি ও মাসিক চাঁদা',
    receivedBy: 'কোষাধ্যক্ষ / সভাপতি',
    paymentMethod: 'cash',
    createdAt: Date.now(),
  });

  // Handle amount change and auto convert to words in both languages
  const handleAmountChange = (amtNum: number) => {
    const valid = isNaN(amtNum) ? 0 : amtNum;
    setCurrentReceipt({
      ...currentReceipt,
      amount: valid,
      amountInWordsBn: numberToBengaliWords(valid),
      amountInWordsEn: numberToEnglishWords(valid),
    });
  };

  const handleSaveAndPrint = () => {
    onSaveReceipt(currentReceipt);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleQuickPrint = (blank: boolean) => {
    setPrintBlank(blank);
    setViewMode('preview');
    setTimeout(() => {
      triggerPrint();
    }, 150);
  };

  const handleCreateNew = () => {
    const newSl = getNextSerial(receipts);
    setCurrentReceipt({
      id: `rcpt_${Date.now()}`,
      serialNo: newSl,
      date: new Date().toISOString().slice(0, 10),
      payerName: '',
      address: 'গ্রাম: ভায়েটা, গালা, টাঙ্গাইল সদর',
      amount: 100,
      amountInWordsBn: 'একশত টাকা মাত্র',
      amountInWordsEn: 'One Hundred Taka Only',
      purpose: 'মাসিক সাধারণ চাঁদা',
      receivedBy: '',
      paymentMethod: 'cash',
      createdAt: Date.now(),
    });
    setViewMode('form');
  };

  const totalCollected = receipts.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & View Toggle */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Toggle Mode */}
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
            onClick={() => { setViewMode('form'); setPrintBlank(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'form'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>{isBn ? 'রশিদ এন্ট্রি এডিটর' : 'Receipt Entry Form'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>{t.newReceipt}</span>
          </button>

          <button
            onClick={() => handleQuickPrint(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>{isBn ? 'খালি রশিদ প্রিন্ট' : 'Print Blank Receipt'}</span>
          </button>

          <button
            onClick={() => handleQuickPrint(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>{isBn ? 'রশিদ প্রিন্ট করুন' : 'Print Receipt'}</span>
          </button>

          <button
            onClick={handleSaveAndPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-300" />
            <span>{t.saveData}</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {savedToast && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span>{t.savedSuccess}</span>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'preview' ? (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs sm:text-sm text-emerald-900 font-medium">
            <span>
              {printBlank
                ? 'বর্তমানে খালি রশিদ বহি প্রিভিউ দেখাচ্ছে (হাতে পূরণযোগ্য)'
                : 'বর্তমানে পূরণকৃত রশিদ প্রিভিউ দেখাচ্ছে (আদায়কারী ও গ্রাহক কপি)'}
            </span>
            <button
              onClick={() => setPrintBlank(!printBlank)}
              className="underline font-bold cursor-pointer"
            >
              {printBlank ? 'পূরণকৃত রূপ দেখুন' : 'খালি রূপ দেখুন'}
            </button>
          </div>

          <div className="print-only-container overflow-x-auto pb-4">
            <ReceiptPrintView
              receipt={currentReceipt}
              org={org}
              lang={lang}
              isBlank={printBlank}
            />
          </div>
        </div>
      ) : (
        /* Form Editor Mode */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t.receiptBookTitle}</h2>
              <p className="text-xs text-slate-500">রশিদের তথ্য পূরণ করুন</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">
              ক্রমিক নং: {isBn ? toBengaliDigits(currentReceipt.serialNo) : currentReceipt.serialNo}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.slNo}</label>
              <input
                type="text"
                value={currentReceipt.serialNo}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, serialNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.receiptDate}</label>
              <input
                type="date"
                value={currentReceipt.date}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.payerName} *</label>
              <input
                type="text"
                value={currentReceipt.payerName}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, payerName: e.target.value })}
                placeholder="সদস্য বা চাঁদা প্রদানকারীর নাম"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.payerAddress}</label>
              <input
                type="text"
                value={currentReceipt.address}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, address: e.target.value })}
                placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.amountInDigits} (টাকা) *</label>
              <input
                type="number"
                value={currentReceipt.amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-bold text-emerald-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.collectorSign}</label>
              <input
                type="text"
                value={currentReceipt.receivedBy}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, receivedBy: e.target.value })}
                placeholder="আদায়কারীর নাম / পদবি"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.amountInWords} (বাংলা)</label>
              <input
                type="text"
                value={currentReceipt.amountInWordsBn}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, amountInWordsBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.amountInWords} (English)</label>
              <input
                type="text"
                value={currentReceipt.amountInWordsEn}
                onChange={(e) => setCurrentReceipt({ ...currentReceipt, amountInWordsEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50 font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setViewMode('preview')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              প্রিভিউ দেখুন
            </button>
            <button
              onClick={handleSaveAndPrint}
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
            >
              {t.saveData}
            </button>
          </div>
        </div>
      )}

      {/* Receipts Ledger Table */}
      <div className="no-print bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.receiptLedger}</h3>
            <p className="text-xs text-slate-500">
              {t.totalCollected}: <span className="font-bold text-emerald-800">{isBn ? toBengaliDigits(totalCollected) : totalCollected} টাকা</span>
            </p>
          </div>

          <button
            onClick={() => exportReceiptsToExcel(receipts, lang)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{t.exportExcel}</span>
          </button>
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
                <th className="px-3 py-2.5 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    কোনো রশীদ সংরক্ষিত নেই।
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 font-bold font-sans">
                      {isBn ? toBengaliDigits(r.serialNo) : r.serialNo}
                    </td>
                    <td className="px-3 py-2.5 font-sans">{r.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{r.payerName}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate">{r.address}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-900">
                      {isBn ? `${toBengaliDigits(r.amount)}/-` : `${r.amount}/-`}
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setCurrentReceipt(r);
                          setViewMode('preview');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                        title="প্রিভিউ ও প্রিন্ট"
                      >
                        প্রিন্ট
                      </button>
                      <button
                        onClick={() => onDeleteReceipt(r.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
