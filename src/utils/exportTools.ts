import { CollectionReceipt, Language, MemberApplication, OrganizationProfile } from '../types';

export const triggerPrint = () => {
  window.print();
};

const escapeCsv = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

const escapeHtml = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Export members to Excel (CSV with UTF-8 BOM for perfect Bengali text in Excel/Sheets)
export const exportMembersToExcel = (members: MemberApplication[], lang: Language) => {
  const headers = lang === 'bn' 
    ? ['আইডি নং', 'অনলাইন ফরম নং', 'আবেদনকারীর নাম (বাংলা)', 'Name (English)', 'পিতার নাম', 'মাতার নাম', 'মোবাইল', 'রক্তের গ্রুপ', 'পেশা', 'সদস্যপদ ধরন', 'মাসিক চাঁদা', 'বর্তমান ঠিকানা', 'স্থায়ী ঠিকানা', 'স্ট্যাটাস', 'তারিখ']
    : ['Member ID', 'Online Form No', 'Name (Bengali)', 'Name (English)', "Father's Name", "Mother's Name", 'Mobile', 'Blood Group', 'Occupation', 'Membership Type', 'Monthly Fee', 'Present Address', 'Permanent Address', 'Status', 'Date'];

  const rows = members.map((m) => {
    const presentAddr = m.presentAddress 
      ? `${m.presentAddress.villageOrArea || ''}, ${m.presentAddress.postOffice || ''}, ${m.presentAddress.upazila || ''}, ${m.presentAddress.district || ''}`.replace(/^, |, $/g, '')
      : '';
    const permAddr = m.permanentAddress 
      ? `${m.permanentAddress.villageOrArea || ''}, ${m.permanentAddress.postOffice || ''}, ${m.permanentAddress.upazila || ''}, ${m.permanentAddress.district || ''}`.replace(/^, |, $/g, '')
      : '';
    const effectiveFee = m.monthlyFee === 'other' ? (m.customMonthlyFee || 'অন্যান্য') : m.monthlyFee;

    return [
      escapeCsv(m.memberIdNo || ''),
      escapeCsv(m.formNo || ''),
      escapeCsv(m.fullNameBn || ''),
      escapeCsv(m.fullNameEn || ''),
      escapeCsv(m.fatherName || ''),
      escapeCsv(m.motherName || ''),
      escapeCsv(m.primaryMobile || ''),
      escapeCsv(m.bloodGroup || ''),
      escapeCsv(m.occupation || ''),
      escapeCsv(m.membershipType || ''),
      escapeCsv(effectiveFee || ''),
      escapeCsv(presentAddr),
      escapeCsv(permAddr),
      escapeCsv(m.status || ''),
      escapeCsv(m.date || ''),
    ];
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bhayeta_members_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export receipts to Excel
export const exportReceiptsToExcel = (receipts: CollectionReceipt[], lang: Language) => {
  const headers = lang === 'bn'
    ? ['ক্রমিক নং', 'তারিখ', 'দাতার নাম', 'ঠিকানা', 'টাকার পরিমাণ', 'কথায় (বাংলা)', 'In Words (English)', 'উদ্দেশ্য', 'আদায়কারী']
    : ['Serial No', 'Date', 'Payer Name', 'Address', 'Amount (BDT)', 'In Words (BN)', 'In Words (EN)', 'Purpose', 'Received By'];

  const rows = receipts.map((r) => [
    escapeCsv(r.serialNo),
    escapeCsv(r.date),
    escapeCsv(r.payerName),
    escapeCsv(r.address),
    escapeCsv(r.amount),
    escapeCsv(r.amountInWordsBn),
    escapeCsv(r.amountInWordsEn),
    escapeCsv(r.purpose || ''),
    escapeCsv(r.receivedBy || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bhayeta_receipts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export individual member application or list to Microsoft Word / Google Docs compatible HTML (.doc)
export const exportMemberToDoc = (member: MemberApplication, org: OrganizationProfile, lang: Language) => {
  const isBn = lang === 'bn';
  const effectiveFee = member.monthlyFee === 'other' ? (member.customMonthlyFee || 'অন্যান্য') : member.monthlyFee;
  const presentText = member.presentAddress 
    ? `গ্রাম: ${escapeHtml(member.presentAddress.villageOrArea)}, ডাকঘর: ${escapeHtml(member.presentAddress.postOffice)}, উপজেলা: ${escapeHtml(member.presentAddress.upazila)}, জেলা: ${escapeHtml(member.presentAddress.district)}`
    : '-';
  const permText = member.permanentAddress
    ? `গ্রাম: ${escapeHtml(member.permanentAddress.villageOrArea)}, ডাকঘর: ${escapeHtml(member.permanentAddress.postOffice)}, উপজেলা: ${escapeHtml(member.permanentAddress.upazila)}, জেলা: ${escapeHtml(member.permanentAddress.district)}`
    : '-';

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${isBn ? 'সদস্য ভর্তি আবেদন' : 'Member Admission Form'} - ${escapeHtml(member.fullNameBn || member.fullNameEn)}</title>
      <style>
        body { font-family: 'Hind Siliguri', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #006837; padding-bottom: 15px; margin-bottom: 20px; }
        .bismillah { font-size: 14pt; color: #444; }
        .title { font-size: 20pt; font-weight: bold; color: #006837; margin: 4px 0; }
        .subtitle { font-size: 12pt; font-weight: bold; color: #1a365d; }
        .info { font-size: 10pt; color: #555; }
        .section-title { font-size: 13pt; font-weight: bold; color: #006837; border-bottom: 1px solid #ccc; margin-top: 15px; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td { padding: 6px 8px; border: 1px solid #ddd; font-size: 11pt; }
        .label { font-weight: bold; width: 35%; background: #f8fafc; }
        .declaration { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; margin-top: 15px; border-radius: 4px; }
        .footer { margin-top: 30px; border-top: 1px dashed #aaa; padding-top: 10px; font-size: 9pt; text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="bismillah">বিস্মিহী তা'আলা</div>
        <div class="title">${escapeHtml(org.nameBn)}</div>
        <div class="subtitle">${escapeHtml(org.nameEn)}</div>
        <div class="info">${escapeHtml(org.establishedBn)} | ${escapeHtml(org.addressBn)} | মোবাইল: ${escapeHtml(org.phones.join(', '))}</div>
        <h2 style="color: #006837; margin-top: 10px;">${isBn ? 'সদস্য ভর্তি আবেদন ফরম' : 'Member Admission Application Form'}</h2>
        <p><strong>${isBn ? 'অনলাইন ফরম নং' : 'Online Form No'}:</strong> ${escapeHtml(member.formNo)} | <strong>${isBn ? 'তারিখ' : 'Date'}:</strong> ${escapeHtml(member.date)}</p>
      </div>

      <div class="section-title">${isBn ? '১. আবেদনকারীর ব্যক্তিগত তথ্যাবলী' : "1. Personal Information"}</div>
      <table>
        <tr><td class="label">${isBn ? 'পূর্ণ নাম (বাংলা)' : 'Full Name (Bengali)'}:</td><td>${escapeHtml(member.fullNameBn) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'Name (English)' : 'Name (English)'}:</td><td>${escapeHtml(member.fullNameEn) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'পিতার নাম' : "Father's Name"}:</td><td>${escapeHtml(member.fatherName) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'মাতার নাম' : "Mother's Name"}:</td><td>${escapeHtml(member.motherName) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'পেশা/কর্মক্ষেত্র' : 'Occupation'}:</td><td>${escapeHtml(member.occupation) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'শিক্ষাগত যোগ্যতা' : 'Education'}:</td><td>${escapeHtml(member.education) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'জন্ম তারিখ ও বয়স' : 'DOB & Age'}:</td><td>${escapeHtml(member.dobAndAge) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}:</td><td>${escapeHtml(member.bloodGroup) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন' : 'NID / Birth Cert'}:</td><td>${escapeHtml(member.nidOrBirthCert) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'প্রধান মোবাইল' : 'Primary Mobile'}:</td><td>${escapeHtml(member.primaryMobile) || '-'}</td></tr>
        <tr><td class="label">${isBn ? 'হোয়াটসঅ্যাপ / বিকল্প মোবাইল' : 'WhatsApp / Alt'}:</td><td>${escapeHtml(member.whatsappOrAltMobile) || '-'}</td></tr>
      </table>

      <div class="section-title">${isBn ? '২. ঠিকানা' : '2. Address Details'}</div>
      <table>
        <tr>
          <td class="label">${isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}:</td>
          <td>${presentText}</td>
        </tr>
        <tr>
          <td class="label">${isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}:</td>
          <td>${permText}</td>
        </tr>
      </table>

      <div class="section-title">${isBn ? '৩. সদস্যপদ ও চাঁদা' : '3. Membership & Contribution'}</div>
      <table>
        <tr><td class="label">${isBn ? 'সদস্যপদ ধরন' : 'Membership Tier'}:</td><td>${escapeHtml(member.membershipType)}</td></tr>
        <tr><td class="label">${isBn ? 'মাসিক চাঁদা' : 'Monthly Fee'}:</td><td>${escapeHtml(effectiveFee)} টাকা (${escapeHtml(member.feeInWords)})</td></tr>
        <tr><td class="label">${isBn ? 'পরিশোধ মাধ্যম' : 'Payment Method'}:</td><td>${escapeHtml(member.paymentMethod)}</td></tr>
        <tr><td class="label">${isBn ? 'সদস্য আইডি নং' : 'Member ID'}:</td><td>${escapeHtml(member.memberIdNo) || (isBn ? 'প্রক্রিয়াধীন' : 'Pending')}</td></tr>
      </table>

      <div class="declaration">
        <strong>${isBn ? 'অঙ্গীকারনামা' : 'Declaration'}:</strong>
        <p style="margin: 5px 0 0;">${isBn ? "আমি এই মর্মে অঙ্গীকার করছি যে, ভায়েটা আদর্শ গ্রাম জনকল্যাণ পরিষদ-এর নিয়ম-কানুন, গঠনতন্ত্র ও লক্ষ্য-উদ্দেশ্য যথাযথভাবে মেনে চলব । গ্রামের শিক্ষা, সমাজকল্যাণ, ইসলামিক মূল্যবোধ ও সামাজিক উন্নয়নে সক্রিয় অংশগ্রহণ করব এবং আমার নির্বাচিত মাসিক চাঁদা নিয়মিত পরিষদ তহবিলে প্রদান করব ।" : "I pledge to abide by the rules and objectives of the parishad and contribute regularly."}</p>
      </div>

      ${member.applicantSignatureUrl ? `
      <div style="margin-top: 20px; text-align: right;">
        <img src="${member.applicantSignatureUrl}" style="max-height: 40px; display: inline-block;" /><br/>
        <span style="font-size: 10pt; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; display: inline-block;">${isBn ? 'আবেদনকারীর স্বাক্ষর ও তারিখ' : 'Applicant Sign & Date'}: ${escapeHtml(member.applicantSignatureDate || '')}</span>
      </div>` : `
      <div style="margin-top: 30px; text-align: right;">
        <span style="font-size: 10pt; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; display: inline-block;">${isBn ? 'আবেদনকারীর স্বাক্ষর ও তারিখ' : 'Applicant Sign & Date'}: ${escapeHtml(member.applicantSignatureDate || '')}</span>
      </div>`}

      <div class="footer">
        ${escapeHtml(org.addressBn)} | E-mail: ${escapeHtml(org.email)}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Member_${member.fullNameEn || member.fullNameBn || 'Application'}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export Pad Document to Word/Docs compatible format
export const exportPadDocumentToDoc = (title: string, date: string, memoNo: string, content: string, org: OrganizationProfile) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(title) || 'Official Pad Memo'}</title>
      <style>
        body { font-family: 'Hind Siliguri', 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #111; margin: 30px; }
        .header { text-align: center; border-bottom: 2px solid #006837; padding-bottom: 15px; margin-bottom: 20px; }
        .bismillah { font-size: 13pt; color: #444; }
        .title { font-size: 22pt; font-weight: bold; color: #006837; }
        .subtitle { font-size: 12pt; font-weight: bold; color: #1a365d; }
        .meta-row { display: flex; justify-content: space-between; margin-top: 15px; font-weight: bold; }
        .content { margin-top: 25px; min-height: 400px; font-size: 12pt; white-space: pre-wrap; }
        .footer { margin-top: 50px; border-top: 1px solid #006837; padding-top: 10px; text-align: center; font-size: 10pt; color: #444; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="bismillah">বিস্মিহী তা'আলা</div>
        <div class="title">${escapeHtml(org.nameBn)}</div>
        <div class="subtitle">${escapeHtml(org.nameEn)}</div>
        <div style="font-size: 10pt; color: #555;">${escapeHtml(org.establishedBn)}</div>
      </div>
      <table style="width: 100%; margin-top: 10px;">
        <tr>
          <td style="text-align: left; font-weight: bold;">স্মারক নং: ${escapeHtml(memoNo) || '...............'}</td>
          <td style="text-align: right; font-weight: bold;">তারিখ: ${escapeHtml(date) || '...............'}</td>
        </tr>
      </table>
      ${title ? `<h3 style="text-align: center; text-decoration: underline; margin-top: 20px;">${escapeHtml(title)}</h3>` : ''}
      <div class="content">${escapeHtml(content)}</div>
      <div class="footer">
        ${escapeHtml(org.addressBn)}<br>
        মোবাইল: ${escapeHtml(org.phones.join(', '))} | ই-মেইল: ${escapeHtml(org.email)}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Pad_Document_${memoNo || date || 'Notice'}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};
