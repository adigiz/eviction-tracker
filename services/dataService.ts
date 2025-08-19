import { User, Property, Tenant, LegalCase, LawFirm, County, PropertyType, LegalCaseStatus, PaymentStatus } from '../types';
import * as Storage from './localStorageService';

// Data Service Interface
export interface DataService {
  // User operations
  getCurrentUser(): User | null;
  updateUser(user: User): void;
  createUser(user: User): void;
  deleteUser(userId: string): void;
  getAllUsers(): User[];
  getUserById(userId: string): User | null;
  getUserByUsername(username: string): User | null;
  
  // Property operations
  getPropertiesByLandlord(landlordId: string): Property[];
  getAllProperties(): Property[];
  getPropertyById(propertyId: string): Property | null;
  createProperty(property: Property): void;
  updateProperty(property: Property): void;
  deleteProperty(propertyId: string): void;
  
  // Tenant operations
  getTenantsByLandlord(landlordId: string): Tenant[];
  getAllTenants(): Tenant[];
  getTenantById(tenantId: string): Tenant | null;
  createTenant(tenant: Tenant): void;
  updateTenant(tenant: Tenant): void;
  deleteTenant(tenantId: string): void;
  
  // Legal Case operations
  getCasesByLandlord(landlordId: string): LegalCase[];
  getAllCases(): LegalCase[];
  getCaseById(caseId: string): LegalCase | null;
  createCase(legalCase: LegalCase): void;
  updateCase(legalCase: LegalCase): void;
  deleteCase(caseId: string): void;
  
  // Law Firm operations
  getAllLawFirms(): LawFirm[];
  getLawFirmById(firmId: string): LawFirm | null;
  createLawFirm(lawFirm: LawFirm): void;
  updateLawFirm(lawFirm: LawFirm): void;
  deleteLawFirm(firmId: string): void;
  
  // Analytics operations
  getCasesByDateRange(startDate: Date, endDate: Date): LegalCase[];
  getCasesByStatus(status: LegalCaseStatus): LegalCase[];
  getCasesByPaymentStatus(status: PaymentStatus): LegalCase[];
  getCasesByCounty(county: County): LegalCase[];
  
  // Search operations
  searchCases(query: string): LegalCase[];
  searchProperties(query: string): Property[];
  searchTenants(query: string): Tenant[];
}

// Local Storage Implementation
export class LocalStorageDataService implements DataService {
  // User operations
  getCurrentUser(): User | null {
    return Storage.getCurrentUser();
  }

  updateUser(user: User): void {
    Storage.updateUser(user);
  }

  createUser(user: User): void {
    Storage.createUser(user);
  }

  deleteUser(userId: string): void {
    Storage.deleteUser(userId);
  }

  getAllUsers(): User[] {
    return Storage.getAllUsers();
  }

  getUserById(userId: string): User | null {
    return Storage.getUserById(userId);
  }

  getUserByUsername(username: string): User | null {
    return Storage.getUserByUsername(username);
  }

  // Property operations
  getPropertiesByLandlord(landlordId: string): Property[] {
    return Storage.getPropertiesByLandlord(landlordId);
  }

  getAllProperties(): Property[] {
    return Storage.getAllProperties();
  }

  getPropertyById(propertyId: string): Property | null {
    return Storage.getPropertyById(propertyId);
  }

  createProperty(property: Property): void {
    Storage.createProperty(property);
  }

  updateProperty(property: Property): void {
    Storage.updateProperty(property);
  }

  deleteProperty(propertyId: string): void {
    Storage.deleteProperty(propertyId);
  }

  // Tenant operations
  getTenantsByLandlord(landlordId: string): Tenant[] {
    return Storage.getTenantsByLandlord(landlordId);
  }

  getAllTenants(): Tenant[] {
    return Storage.getAllTenants();
  }

  getTenantById(tenantId: string): Tenant | null {
    return Storage.getTenantById(tenantId);
  }

  createTenant(tenant: Tenant): void {
    Storage.createTenant(tenant);
  }

  updateTenant(tenant: Tenant): void {
    Storage.updateTenant(tenant);
  }

  deleteTenant(tenantId: string): void {
    Storage.deleteTenant(tenantId);
  }

  // Legal Case operations
  getCasesByLandlord(landlordId: string): LegalCase[] {
    return Storage.getLegalCasesByLandlord(landlordId);
  }

  getAllCases(): LegalCase[] {
    return Storage.getAllLegalCases();
  }

  getCaseById(caseId: string): LegalCase | null {
    return Storage.getLegalCaseById(caseId);
  }

  createCase(legalCase: LegalCase): void {
    Storage.createLegalCase(legalCase);
  }

  updateCase(legalCase: LegalCase): void {
    Storage.updateLegalCase(legalCase);
  }

  deleteCase(caseId: string): void {
    Storage.deleteLegalCase(caseId);
  }

  // Law Firm operations
  getAllLawFirms(): LawFirm[] {
    return Storage.getAllLawFirms();
  }

  getLawFirmById(firmId: string): LawFirm | null {
    return Storage.getLawFirmById(firmId);
  }

  createLawFirm(lawFirm: LawFirm): void {
    Storage.createLawFirm(lawFirm);
  }

  updateLawFirm(lawFirm: LawFirm): void {
    Storage.updateLawFirm(lawFirm);
  }

  deleteLawFirm(firmId: string): void {
    Storage.deleteLawFirm(firmId);
  }

  // Analytics operations
  getCasesByDateRange(startDate: Date, endDate: Date): LegalCase[] {
    const allCases = this.getAllCases();
    return allCases.filter(legalCase => {
      const caseDate = new Date(legalCase.dateInitiated);
      return caseDate >= startDate && caseDate <= endDate;
    });
  }

  getCasesByStatus(status: LegalCaseStatus): LegalCase[] {
    const allCases = this.getAllCases();
    return allCases.filter(legalCase => legalCase.status === status);
  }

  getCasesByPaymentStatus(status: PaymentStatus): LegalCase[] {
    const allCases = this.getAllCases();
    return allCases.filter(legalCase => legalCase.paymentStatus === status);
  }

  getCasesByCounty(county: County): LegalCase[] {
    const allCases = this.getAllCases();
    const allProperties = this.getAllProperties();
    
    return allCases.filter(legalCase => {
      const property = allProperties.find(p => p.id === legalCase.propertyId);
      return property?.county === county;
    });
  }

  // Search operations
  searchCases(query: string): LegalCase[] {
    const allCases = this.getAllCases();
    const allProperties = this.getAllProperties();
    const allTenants = this.getAllTenants();
    const allUsers = this.getAllUsers();
    
    const lowerQuery = query.toLowerCase();
    
    return allCases.filter(legalCase => {
      const property = allProperties.find(p => p.id === legalCase.propertyId);
      const tenant = allTenants.find(t => t.id === legalCase.tenantId);
      const landlord = allUsers.find(u => u.id === legalCase.landlordId);
      
      return (
        legalCase.districtCourtCaseNumber?.toLowerCase().includes(lowerQuery) ||
        property?.address.toLowerCase().includes(lowerQuery) ||
        property?.city.toLowerCase().includes(lowerQuery) ||
        tenant?.tenantNames.some(name => name.toLowerCase().includes(lowerQuery)) ||
        landlord?.name.toLowerCase().includes(lowerQuery)
      );
    });
  }

  searchProperties(query: string): Property[] {
    const allProperties = this.getAllProperties();
    const lowerQuery = query.toLowerCase();
    
    return allProperties.filter(property => 
      property.address.toLowerCase().includes(lowerQuery) ||
      property.city.toLowerCase().includes(lowerQuery) ||
      property.county.toLowerCase().includes(lowerQuery)
    );
  }

  searchTenants(query: string): Tenant[] {
    const allTenants = this.getAllTenants();
    const lowerQuery = query.toLowerCase();
    
    return allTenants.filter(tenant =>
      tenant.tenantNames.some(name => name.toLowerCase().includes(lowerQuery)) ||
      tenant.email?.toLowerCase().includes(lowerQuery) ||
      tenant.phone?.toLowerCase().includes(lowerQuery)
    );
  }
}

// Factory function to get the appropriate data service
export const getDataService = (): DataService => {
  // For now, always return localStorage service
  // Later, this can be configured based on environment or user preference
  return new LocalStorageDataService();
};

// Export a default instance
export const dataService = getDataService();
