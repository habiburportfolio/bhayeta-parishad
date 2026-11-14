import { Language } from '../types';

export const toBengaliDigits = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num ?? '').replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

export const toEnglishDigits = (str: string | number): string => {
  const bnDigits: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  return String(str ?? '').replace(/[০-৯]/g, (d) => bnDigits[d] || d);
};

export const formatDisplayNumber = (num: number | string, lang: Language): string => {
  if (lang === 'bn') {
    return toBengaliDigits(num);
  }
  return String(num ?? '');
};

// Complete 1 to 99 Bengali words table for 100% accurate accounting representation
const bnNumbers1to99: { [key: number]: string } = {
  1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ',
  11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোলো', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ',
  21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আটাশ', 29: 'উনত্রিশ', 30: 'ত্রিশ',
  31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ', 40: 'চল্লিশ',
  41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ', 50: 'পঞ্চাশ',
  51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট', 60: 'ষাট',
  61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর', 70: 'সত্তর',
  71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনআশি', 80: 'আশি',
  81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'আটাশি', 89: 'উননব্বই', 90: 'নব্বই',
  91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
};

const convertTwoDigitsBn = (n: number): string => {
  if (n <= 0) return '';
  return bnNumbers1to99[n] || '';
};

export const numberToBengaliWords = (amount: number): string => {
  if (isNaN(amount) || amount < 0) return '';
  if (amount === 0) return 'শূন্য টাকা মাত্র';

  let num = Math.floor(amount);
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  if (crore > 0) {
    words += `${convertTwoDigitsBn(crore)} কোটি `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigitsBn(lakh)} লাখ `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigitsBn(thousand)} হাজার `;
  }
  if (hundred > 0) {
    const hWord = hundred === 1 ? 'একশত' : `${bnNumbers1to99[hundred] || ''} শত`;
    words += `${hWord} `;
  }
  if (remainder > 0) {
    words += `${convertTwoDigitsBn(remainder)} `;
  }

  return `${words.trim()} টাকা মাত্র`;
};

// English numbers in words
const enUnits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const enTens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export const numberToEnglishWords = (amount: number): string => {
  if (isNaN(amount) || amount < 0) return '';
  if (amount === 0) return 'Zero Taka Only';

  const convertLessThanOneThousand = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += `${enUnits[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        result += `${enUnits[n]} `;
      } else {
        result += `${enTens[Math.floor(n / 10)]} `;
        if (n % 10 > 0) {
          result += `${enUnits[n % 10]} `;
        }
      }
    }
    return result.trim();
  };

  let num = Math.floor(amount);
  let words = '';

  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;
  const million = Math.floor(num / 1000000);
  num %= 1000000;
  const thousand = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (billion > 0) {
    words += `${convertLessThanOneThousand(billion)} Billion `;
  }
  if (million > 0) {
    words += `${convertLessThanOneThousand(million)} Million `;
  }
  if (thousand > 0) {
    words += `${convertLessThanOneThousand(thousand)} Thousand `;
  }
  if (remainder > 0) {
    words += `${convertLessThanOneThousand(remainder)} `;
  }

  return `${words.trim()} Taka Only`;
};

export const getAmountInWords = (amount: number, lang: Language): string => {
  return lang === 'bn' ? numberToBengaliWords(amount) : numberToEnglishWords(amount);
};
