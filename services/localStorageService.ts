
import { Property, Tenant, LegalCase, User, LawFirm } from '../types'; // Changed Landlord to User
import { LS_PROPERTIES_KEY, LS_TENANTS_KEY, LS_CASES_KEY, LS_AUTH_KEY, LS_ALL_USERS_KEY, LS_LAW_FIRMS_KEY } from '../constants';

// Generic getter
const getItem = <T,>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage`, error);
    return null;
  }
};

// Generic setter
const setItem = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage`, error);
  }
};

// --- User Management (including Admins and Landlords) ---
export const getPersistedUser = (): User | null => {
  return getItem<User>(LS_AUTH_KEY);
};

export const persistUser = (user: User): void => {
  setItem<User>(LS_AUTH_KEY, user); // Store current logged-in user

  // Add/Update user in the list of all users
  const allUsers = getItem<User[]>(LS_ALL_USERS_KEY) || [];
  const userIndex = allUsers.findIndex(u => u.id === user.id);
  if (userIndex > -1) {
    allUsers[userIndex] = user;
  } else {
    allUsers.push(user);
  }
  setItem<User[]>(LS_ALL_USERS_KEY, allUsers);
};

export const clearPersistedUser = (): void => {
  localStorage.removeItem(LS_AUTH_KEY);
  // We don't clear LS_ALL_USERS_KEY on logout, as it's a persistent list of users
};

export const getAllRegisteredUsers = (): User[] => {
  return getItem<User[]>(LS_ALL_USERS_KEY) || [];
};

export const getAllLandlordUsers = (): User[] => {
  const allUsers = getItem<User[]>(LS_ALL_USERS_KEY) || [];
  return allUsers.filter(user => user.role === 'landlord');
};

export const getAllContractorUsers = (): User[] => {
  const allUsers = getItem<User[]>(LS_ALL_USERS_KEY) || [];
  return allUsers.filter(user => user.role === 'contractor');
};

export const deleteUser = (userId: string): void => {
  let allUsers = getItem<User[]>(LS_ALL_USERS_KEY) || [];
  allUsers = allUsers.filter(u => u.id !== userId);
  setItem<User[]>(LS_ALL_USERS_KEY, allUsers);
  
  const currentUser = getPersistedUser();
  if (currentUser && currentUser.id === userId) {
      clearPersistedUser();
  }
};


// Properties
export const getProperties = (landlordId: string): Property[] => {
  const allProperties = getItem<Property[]>(LS_PROPERTIES_KEY) || [];
  return allProperties.filter(p => p.landlordId === landlordId);
};
export const saveProperties = (properties: Property[]): void => {
  const allProperties = getItem<Property[]>(LS_PROPERTIES_KEY) || [];
  const updatedProperties = allProperties.filter(p => !properties.find(up => up.id === p.id));
  setItem(LS_PROPERTIES_KEY, [...updatedProperties, ...properties]);
};
export const addProperty = (property: Property): void => {
  const properties = getItem<Property[]>(LS_PROPERTIES_KEY) || [];
  setItem(LS_PROPERTIES_KEY, [...properties, property]);
};
export const updateProperty = (updatedProperty: Property): void => {
  let properties = getItem<Property[]>(LS_PROPERTIES_KEY) || [];
  properties = properties.map(p => p.id === updatedProperty.id ? updatedProperty : p);
  setItem(LS_PROPERTIES_KEY, properties);
};
export const deleteProperty = (propertyId: string): void => {
  let properties = getItem<Property[]>(LS_PROPERTIES_KEY) || [];
  properties = properties.filter(p => p.id !== propertyId);
  setItem(LS_PROPERTIES_KEY, properties);
};


// Tenants
export const getTenants = (landlordId: string): Tenant[] => {
  const allTenants = getItem<Tenant[]>(LS_TENANTS_KEY) || [];
  return allTenants.filter(t => t.landlordId === landlordId);
};
export const saveTenants = (tenants: Tenant[]): void => {
 const allTenants = getItem<Tenant[]>(LS_TENANTS_KEY) || [];
  const updatedTenants = allTenants.filter(t => !tenants.find(ut => ut.id === t.id));
  setItem(LS_TENANTS_KEY, [...updatedTenants, ...tenants]);
};
export const addTenant = (tenant: Tenant): void => {
  const tenants = getItem<Tenant[]>(LS_TENANTS_KEY) || [];
  setItem(LS_TENANTS_KEY, [...tenants, tenant]);
};
export const updateTenant = (updatedTenant: Tenant): void => {
  let tenants = getItem<Tenant[]>(LS_TENANTS_KEY) || [];
  tenants = tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t);
  setItem(LS_TENANTS_KEY, tenants);
};
export const deleteTenant = (tenantId: string): void => {
  let tenants = getItem<Tenant[]>(LS_TENANTS_KEY) || [];
  tenants = tenants.filter(t => t.id !== tenantId);
  setItem(LS_TENANTS_KEY, tenants);
};

// Legal Cases
export const getLegalCases = (landlordId: string): LegalCase[] => {
  const allCases = getItem<LegalCase[]>(LS_CASES_KEY) || [];
  return allCases.filter(c => c.landlordId === landlordId);
};
export const saveLegalCases = (cases: LegalCase[]): void => { 
  const allStoredCases = getItem<LegalCase[]>(LS_CASES_KEY) || [];
  const landlordIdsInProvidedCases = Array.from(new Set(cases.map(c => c.landlordId)));
  const casesNotBeingUpdated = allStoredCases.filter(sc => !landlordIdsInProvidedCases.includes(sc.landlordId));
  setItem(LS_CASES_KEY, [...casesNotBeingUpdated, ...cases]);
};
export const addLegalCase = (legalCase: LegalCase): void => {
  const cases = getItem<LegalCase[]>(LS_CASES_KEY) || [];
  setItem(LS_CASES_KEY, [...cases, legalCase]);
};
export const updateLegalCase = (updatedLegalCase: LegalCase): void => {
  let cases = getItem<LegalCase[]>(LS_CASES_KEY) || [];
  cases = cases.map(c => c.id === updatedLegalCase.id ? updatedLegalCase : c);
  setItem(LS_CASES_KEY, cases);
};
export const deleteLegalCase = (caseId: string): void => {
  let cases = getItem<LegalCase[]>(LS_CASES_KEY) || [];
  cases = cases.filter(c => c.id !== caseId);
  setItem(LS_CASES_KEY, cases);
};

// --- Law Firm Management ---
export const getLawFirms = (): LawFirm[] => {
  return getItem<LawFirm[]>(LS_LAW_FIRMS_KEY) || [];
};
export const saveLawFirms = (firms: LawFirm[]): void => {
  setItem(LS_LAW_FIRMS_KEY, firms);
};
export const addLawFirm = (firm: LawFirm): void => {
  const firms = getLawFirms();
  setItem(LS_LAW_FIRMS_KEY, [...firms, firm]);
};
export const updateLawFirm = (updatedFirm: LawFirm): void => {
  let firms = getLawFirms();
  firms = firms.map(f => f.id === updatedFirm.id ? updatedFirm : f);
  setItem(LS_LAW_FIRMS_KEY, firms);
};
export const deleteLawFirm = (firmId: string): void => {
  let firms = getLawFirms();
  firms = firms.filter(f => f.id !== firmId);
  setItem(LS_LAW_FIRMS_KEY, firms);
};


// --- Admin specific data retrieval ---
export const getAllLegalCasesForAdmin = (): LegalCase[] => {
  return getItem<LegalCase[]>(LS_CASES_KEY) || []; 
};

export const getAllPropertiesForAdmin = (): Property[] => {
  return getItem<Property[]>(LS_PROPERTIES_KEY) || [];
};

export const getAllTenantsForAdmin = (): Tenant[] => {
  return getItem<Tenant[]>(LS_TENANTS_KEY) || [];
};


// Utility
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
