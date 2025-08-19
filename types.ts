

export interface LawFirm {
  id: string;
  name: string;
  referralCode: string;
}

export interface User { 
  id: string;
  username: string;
  password?: string;
  name: string; // Landlord's personal name
  businessName?: string;
  address?: string;
  email?: string;
  phone?: string;
  role: 'landlord' | 'admin' | 'contractor';
  referralCode?: string;
  priceOverrides?: Record<string, { price: number; unlocked: boolean; }>;
  cartItemCount?: number;
}

export interface RegistrationData {
  username: string;
  password: string;
  name: string;
  businessName: string;
  address: string;
  email: string;
  phone: string;
  referralCode?: string;
}

export enum PropertyType {
  RESIDENTIAL = 'Residential',
  COMMERCIAL = 'Commercial',
  GARAGE = 'Garage', // Kept in enum for existing data, removed from form options
}

export enum County {
  ANNE_ARUNDEL = 'Anne Arundel County',
  BALTIMORE_CITY = 'Baltimore City',
  BALTIMORE_COUNTY = 'Baltimore County',
  HARFORD = 'Harford County',
  HOWARD = 'Howard County',
  CARROLL = 'Carroll County',
  FREDERICK = 'Frederick County',
  MONTGOMERY = 'Montgomery County',
  PRINCE_GEORGES = "Prince George's County",
  CECIL = 'Cecil County',
  QUEEN_ANNES = "Queen Anne's County",
  KENT = 'Kent County',
  CAROLINE = 'Caroline County',
  TALBOT = 'Talbot County',
  DORCHESTER = 'Dorchester County',
  WICOMICO = 'Wicomico County',
  SOMERSET = 'Somerset County',
  WORCESTER = 'Worcester County',
  CHARLES = 'Charles County',
  ST_MARYS = "St. Mary's County",
  CALVERT = 'Calvert County',
  GARRETT = 'Garrett County',
  ALLEGANY = 'Allegany County',
  WASHINGTON = 'Washington County',
}

export interface Property {
  id: string;
  landlordId: string;
  county: County; 
  address: string;
  unit?: string; 
  city: string;
  state: string; 
  zipCode: string;
  propertyType: PropertyType;
  description: string; // Changed from optional to required
  builtBefore1978?: boolean;
  leadCertificateNumber?: string;
  isAACountyMultipleDwelling?: boolean; 
  rentalLicenseNumber?: string;
  rentalLicenseExpirationDate?: string; 
}

export interface Tenant {
  id: string;
  landlordId: string;
  propertyId: string;
  tenantNames: string[]; 
  email?: string;
  phone?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  rentAmount?: number; // Changed to optional
  hasLateFeeInLease?: boolean; // Changed to optional
  isSubsidized?: boolean; // Changed to optional
  subsidyType?: string; 
}

export enum LegalCaseStatus {
  NOTICE_DRAFT = 'Notice Draft', 
  SUBMITTED = 'Submitted', // Request is paid and initial notice may be generated
  IN_PROGRESS = 'In Progress', // Actively being worked on by admin/system
  COMPLETE = 'Complete', // All actions for this request are finished
}

export enum PaymentStatus {
  UNPAID = 'Unpaid',
  PENDING_PAYMENT = 'Pending Payment',
  PAID = 'Paid',
  FAILED = 'Payment Failed',
  REFUNDED = 'Refunded', // For future use
}

export interface PaymentRecord {
  date: string;
  amount: number;
  notes?: string;
}
export interface LegalCase {
  id: string;
  landlordId: string; 
  propertyId: string;
  tenantId: string;
  caseType: 'FTPR'; 
  dateInitiated: string;
  rentOwedAtFiling: number;
  currentRentOwed?: number; 
  rentDueDate?: string; 
  status: LegalCaseStatus;
  lateFeesCharged?: number; 
  thirtyDayNoticeFileName?: string; 
  
  noticeMailedDate?: string; // Admin editable
  courtCaseNumber?: string;  // Admin editable (general court case #)
  trialDate?: string;        // Admin editable
  
  paymentsMade?: PaymentRecord[]; 

  courtHearingDate?: string; // Admin editable (synced with trialDate typically)
  courtOutcomeNotes?: string;// Admin editable
  generatedDocuments: {
    evictionNotice?: string; 
    warrantRequest?: string; // Kept for historical data, new generation UI removed
    evictionRequest?: string; // Kept for historical data, new generation UI removed
  };

  districtCourtCaseNumber?: string; // From FTPR form
  warrantOrderDate?: string;        // From FTPR form
  initialEvictionDate?: string;     // From FTPR form

  uploadedPhotoFileName?: string;
  uploadedReceiptFileName?: string;
  uploadedDocument1FileName?: string;
  uploadedDocument2FileName?: string;

  noRightOfRedemption?: boolean;

  // Contractor fields
  contractorId?: string; // ID of the contractor who claimed this job
  claimedAt?: string; // ISO string date when the job was claimed
  postingCompletedAt?: string; // ISO string date when contractor submitted all docs

  // New payment-related fields
  paymentStatus: PaymentStatus;
  price: number; // Cost of this request
  stripeCheckoutSessionId?: string; 
  stripePaymentIntentId?: string; 
}

export interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => void;
  register: (data: RegistrationData) => void;
  logout: () => void;
  isLoading: boolean;
  getCartItemCount?: () => number;
  updateCartCount?: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}
