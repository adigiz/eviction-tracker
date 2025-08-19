import { County } from "./types";

export const APP_NAME = "EvictionTracker";


export const ADMIN_USERNAME = "admin"; // For local dev/testing
export const CONTRACTOR_USERNAME = "contractor1"; // For local dev/testing
export const OFFICE_EMAIL_ADDRESS = "admin@rentcourt.com";

export const MARYLAND_STATE_CODE = "MD";

export const MARYLAND_COUNTIES_OPTIONS = Object.values(County).map(county => ({
    value: county,
    label: county,
}));

export const SUBSIDY_TYPES = [
  'Housing Choice Voucher Program (Section 8)',
  'Housing Assistance Program (HAP)',
  'Project-Based Rental Assistance',
  'Section 202/162 Project Assistance Contract (PAC)',
  'Section 202 Project Rental Assistance Program (PRAC)',
  'Section 811 PRAC',
  'Section 811 Project Rental Assistance (PRA)',
  'Senior Preservation Rental Assistance Contracts (SPRAC)',
];

export const DEFAULT_REQUEST_PRICE = 85.00; // Default price, can be overridden by backend
export const DISCOUNT_AMOUNT = 5.00; // Discount for users with a valid referral code

// Local Storage Keys
export const LS_PROPERTIES_KEY = 'et_properties';
export const LS_TENANTS_KEY = 'et_tenants';
export const LS_CASES_KEY = 'et_cases';
export const LS_AUTH_KEY = 'et_auth';
export const LS_ALL_USERS_KEY = 'et_all_users';
export const LS_LAW_FIRMS_KEY = 'et_law_firms';
export const STRIPE_CHECKOUT_SESSION_KEY_PREFIX = 'mock_stripe_cs_';

// Mocks
export const MOCK_LANDLORD_ID_PREFIX = 'mock_landlord_';
