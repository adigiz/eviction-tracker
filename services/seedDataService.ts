import { User, Property, Tenant, LegalCase, LawFirm, County, PropertyType, LegalCaseStatus, PaymentStatus } from '../types';
import { DEFAULT_REQUEST_PRICE } from '../constants';

/**
 * Static seed data for demo purposes
 * This file contains all the initial data that would normally come from a database
 * When connecting to Supabase, this entire file can be replaced with database queries
 */

export const createSeedData = () => {
  // Helper function for generating dates
  const getDate = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split("T")[0];
  };

  // Law Firm for referral demo
  const lawFirm: LawFirm = {
    id: "law_firm_01",
    name: "Smith & Jones Law",
    referralCode: "SJLAW5",
  };

  // Demo Users
  const adminUser: User = {
    id: "admin_user_01",
    username: "admin",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  };

  const contractorUser: User = {
    id: "contractor_user_01",
    username: "contractor",
    password: "contractor123",
    name: "John Contractor",
    email: "contractor@example.com",
    phone: "555-0102",
    role: "contractor",
  };

  // Default price overrides for landlord
  const defaultPriceOverrides: User["priceOverrides"] = {};
  const defaultUnlockedCounties = [
    County.ANNE_ARUNDEL,
    County.BALTIMORE_CITY,
    County.BALTIMORE_COUNTY,
    County.HARFORD,
    County.HOWARD,
  ];
  Object.values(County).forEach((countyName) => {
    defaultPriceOverrides[countyName] = {
      price: DEFAULT_REQUEST_PRICE,
      unlocked: defaultUnlockedCounties.includes(countyName as County),
    };
  });

  const landlordUser: User = {
    id: "landlord_user_01",
    username: "landlord",
    password: "landlord123",
    name: "Jane Landlord",
    email: "landlord@example.com",
    phone: "555-0101",
    address: "123 Main St, Anytown, USA",
    role: "landlord",
    referralCode: lawFirm.referralCode,
    priceOverrides: defaultPriceOverrides,
  };

  // Demo Properties
  const properties: Property[] = [
    {
      id: "prop_1",
      landlordId: landlordUser.id,
      county: County.BALTIMORE_CITY,
      address: "123 Oak St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21201",
      propertyType: PropertyType.RESIDENTIAL,
      description: "Front door access code is 1234.",
    },
    {
      id: "prop_2",
      landlordId: landlordUser.id,
      county: County.BALTIMORE_COUNTY,
      address: "456 Maple Ave",
      city: "Towson",
      state: "MD",
      zipCode: "21204",
      propertyType: PropertyType.RESIDENTIAL,
      description: "Mailbox is to the left of the door.",
    },
    {
      id: "prop_3",
      landlordId: landlordUser.id,
      county: County.ANNE_ARUNDEL,
      address: "789 Pine Ln",
      city: "Annapolis",
      state: "MD",
      zipCode: "21401",
      propertyType: PropertyType.RESIDENTIAL,
      description: "Beware of dog.",
    },
    {
      id: "prop_4",
      landlordId: landlordUser.id,
      county: County.HARFORD,
      address: "101 Birch Rd",
      city: "Bel Air",
      state: "MD",
      zipCode: "21014",
      propertyType: PropertyType.COMMERCIAL,
      description: "Post on the main glass door.",
    },
    {
      id: "prop_5",
      landlordId: landlordUser.id,
      county: County.HOWARD,
      address: "212 Elm St",
      city: "Columbia",
      state: "MD",
      zipCode: "21044",
      propertyType: PropertyType.RESIDENTIAL,
      description: "Unit is on the second floor.",
    },
  ];

  // Demo Tenants
  const tenants: Tenant[] = [
    {
      id: "ten_1",
      landlordId: landlordUser.id,
      propertyId: "prop_1",
      tenantNames: ["John Doe"],
    },
    {
      id: "ten_2",
      landlordId: landlordUser.id,
      propertyId: "prop_2",
      tenantNames: ["Jane Smith"],
    },
    {
      id: "ten_3",
      landlordId: landlordUser.id,
      propertyId: "prop_3",
      tenantNames: ["Peter Jones"],
    },
    {
      id: "ten_4",
      landlordId: landlordUser.id,
      propertyId: "prop_4",
      tenantNames: ["Williams Contracting LLC"],
    },
    {
      id: "ten_5",
      landlordId: landlordUser.id,
      propertyId: "prop_5",
      tenantNames: ["David Brown", "Susan Brown"],
    },
  ];

  // Demo Legal Cases in various states
  const cases: LegalCase[] = [
    // Case 1: In Cart (Notice Draft / Unpaid)
    {
      id: "case_1",
      landlordId: landlordUser.id,
      propertyId: "prop_1",
      tenantId: "ten_1",
      caseType: "FTPR",
      dateInitiated: getDate(-1),
      rentOwedAtFiling: 1200,
      status: LegalCaseStatus.NOTICE_DRAFT,
      paymentStatus: PaymentStatus.UNPAID,
      price: 80.0,
      generatedDocuments: {},
      districtCourtCaseNumber: "D-01-CV-24-111111",
      warrantOrderDate: getDate(-10),
      initialEvictionDate: getDate(20),
    },
    // Case 2: Available for Contractor (Submitted / Paid)
    {
      id: "case_2",
      landlordId: landlordUser.id,
      propertyId: "prop_2",
      tenantId: "ten_2",
      caseType: "FTPR",
      dateInitiated: getDate(-2),
      rentOwedAtFiling: 950,
      status: LegalCaseStatus.SUBMITTED,
      paymentStatus: PaymentStatus.PAID,
      price: 85.0,
      generatedDocuments: {},
      districtCourtCaseNumber: "D-02-CV-24-222222",
      warrantOrderDate: getDate(-12),
      initialEvictionDate: getDate(25),
    },
    // Case 3: Claimed by Contractor (Submitted / Paid)
    {
      id: "case_3",
      landlordId: landlordUser.id,
      propertyId: "prop_3",
      tenantId: "ten_3",
      caseType: "FTPR",
      dateInitiated: getDate(-5),
      rentOwedAtFiling: 2100,
      status: LegalCaseStatus.SUBMITTED,
      paymentStatus: PaymentStatus.PAID,
      price: 85.0,
      generatedDocuments: {},
      contractorId: contractorUser.id,
      claimedAt: new Date().toISOString(),
      districtCourtCaseNumber: "D-03-CV-24-333333",
      warrantOrderDate: getDate(-15),
      initialEvictionDate: getDate(18),
    },
    // Case 4: In Progress by Admin (In Progress / Paid)
    {
      id: "case_5",
      landlordId: landlordUser.id,
      propertyId: "prop_5",
      tenantId: "ten_5",
      caseType: "FTPR",
      dateInitiated: getDate(-10),
      rentOwedAtFiling: 1500,
      status: LegalCaseStatus.IN_PROGRESS,
      paymentStatus: PaymentStatus.PAID,
      price: 85.0,
      generatedDocuments: {},
      districtCourtCaseNumber: "D-05-CV-24-555555",
      warrantOrderDate: getDate(-20),
      initialEvictionDate: getDate(30),
      courtOutcomeNotes: "Admin reviewing documents.",
    },
    // Case 5: Completed (Complete / Paid)
    {
      id: "case_4",
      landlordId: landlordUser.id,
      propertyId: "prop_4",
      tenantId: "ten_4",
      caseType: "FTPR",
      dateInitiated: getDate(-20),
      rentOwedAtFiling: 3500,
      status: LegalCaseStatus.COMPLETE,
      paymentStatus: PaymentStatus.PAID,
      price: 85.0,
      generatedDocuments: {},
      contractorId: contractorUser.id,
      claimedAt: getDate(-18),
      postingCompletedAt: getDate(-15),
      districtCourtCaseNumber: "D-04-CV-24-444444",
      warrantOrderDate: getDate(-30),
      initialEvictionDate: getDate(-5),
      thirtyDayNoticeFileName: "eviction_notice.pdf",
      uploadedDocument1FileName: "cert_of_mailing.pdf",
      uploadedPhotoFileName: "posting_photo.jpg",
      uploadedReceiptFileName: "mailing_receipt.pdf",
    },
  ];

  return {
    lawFirm,
    users: [adminUser, contractorUser, landlordUser],
    properties,
    tenants,
    cases,
  };
};

/**
 * Seeds the database/storage with initial demo data
 * In a real app, this would be replaced with database queries
 */
export const seedInitialData = (Storage: any) => {
  const allUsers = Storage.getAllRegisteredUsers();
  if (allUsers.length === 0) {
    const seedData = createSeedData();

    // Seed law firm
    Storage.addLawFirm(seedData.lawFirm);

    // Seed users
    seedData.users.forEach((user) => Storage.persistUser(user));

    // Seed properties
    seedData.properties.forEach((property) => Storage.addProperty(property));

    // Seed tenants
    seedData.tenants.forEach((tenant) => Storage.addTenant(tenant));

    // Seed cases
    seedData.cases.forEach((case_) => Storage.addLegalCase(case_));

    return true; // Data was seeded
  }
  return false; // Data already exists
};
