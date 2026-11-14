export type Language = 'bn' | 'en';

export interface OrganizationProfile {
  nameBn: string;
  nameEn: string;
  establishedBn: string;
  establishedEn: string;
  addressBn: string;
  addressEn: string;
  phones: string[];
  email: string;
  logoUrl: string;
  declarationBn?: string;
  declarationEn?: string;
}

export interface MemberApplication {
  id: string;
  formNo: string;
  date: string;
  photoUrl: string;
  
  // Section 1: Personal info
  fullNameBn: string;
  fullNameEn: string;
  fatherName: string;
  motherName: string;
  occupation: string;
  education: string;
  dobAndAge: string;
  bloodGroup: string;
  nidOrBirthCert: string;
  primaryMobile: string;
  whatsappOrAltMobile: string;

  // Section 2: Address
  presentAddress: {
    division: string;
    district: string;
    upazila: string;
    postOffice: string;
    villageOrArea: string;
  };
  permanentAddress: {
    division: string;
    district: string;
    upazila: string;
    postOffice: string;
    villageOrArea: string;
  };
  sameAsPresentAddress?: boolean;

  // Section 3: Membership & Contribution
  membershipType: 'general' | 'lifetime' | 'wellwisher' | 'donor';
  monthlyFee: string; // '100' | '200' | '500' | '1000' | 'other'
  customMonthlyFee?: string;
  feeInWords: string;
  paymentMethod: 'cash' | 'bkash_nagad' | 'bank';

  // Section 4: Declaration & References
  proposerNameAndId: string;
  supporterNameAndId: string;
  applicantSignatureDate: string;
  applicantSignatureUrl?: string;

  // Section 5: Office Use Only
  status: 'pending' | 'approved' | 'rejected';
  memberIdNo: string;
  admissionFee: string;
  admissionReceiptNo: string;
  approvalDate: string;
  approvalNotes?: string;

  createdAt: number;
}

export interface CollectionReceipt {
  id: string;
  serialNo: string;
  date: string;
  payerName: string;
  address: string;
  amount: number;
  amountInWordsBn: string;
  amountInWordsEn: string;
  purpose?: string;
  receivedBy: string;
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'bank';
  createdAt: number;
}

export interface PadDocument {
  id: string;
  memoNo: string;
  date: string;
  subject: string;
  content: string;
  signatoryTitle: string;
  signatoryName: string;
  updatedAt: number;
}

export interface AdminSecurityProfile {
  pin: string;
  recoveryEmail: string;
  recoveryPhone: string;
  masterRecoveryKey: string;
  failedAttempts: number;
  lockedUntil: number | null;
  lastChangedAt?: string;
}

export interface SecurityOtpSession {
  code: string;
  target: 'email' | 'mobile';
  destination: string;
  expiresAt: number;
  verified: boolean;
}

export interface DivisionData {
  id: string;
  nameBn: string;
  nameEn: string;
  districts: DistrictData[];
}

export interface DistrictData {
  id: string;
  nameBn: string;
  nameEn: string;
  upazilas: {
    nameBn: string;
    nameEn: string;
  }[];
}
