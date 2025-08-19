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
    return Storage.getPersistedUser();
  }

  updateUser(user: User): void {
    Storage.persistUser(user);
  }

  createUser(user: User): void {
    // Note: This would need to be implemented in localStorageService
    // For now, we'll just persist the user
    Storage.persistUser(user);
  }

  deleteUser(userId: string): void {
    Storage.deleteUser(userId);
  }

  getAllUsers(): User[] {
    return Storage.getAllRegisteredUsers();
  }

  getUserById(userId: string): User | null {
    const allUsers = Storage.getAllRegisteredUsers();
    return allUsers.find(user => user.id === userId) || null;
  }

  getUserByUsername(username: string): User | null {
    const allUsers = Storage.getAllRegisteredUsers();
    return allUsers.find(user => user.username === username) || null;
  }

  // Property operations
  getPropertiesByLandlord(landlordId: string): Property[] {
    return Storage.getProperties(landlordId);
  }

  getAllProperties(): Property[] {
    // Get all properties from all landlords
    const allLandlords = Storage.getAllLandlordUsers();
    return allLandlords.flatMap(landlord => Storage.getProperties(landlord.id));
  }

  getPropertyById(propertyId: string): Property | null {
    const allLandlords = Storage.getAllLandlordUsers();
    for (const landlord of allLandlords) {
      const properties = Storage.getProperties(landlord.id);
      const property = properties.find(p => p.id === propertyId);
      if (property) return property;
    }
    return null;
  }

  createProperty(property: Property): void {
    Storage.addProperty(property);
  }

  updateProperty(property: Property): void {
    Storage.updateProperty(property);
  }

  deleteProperty(propertyId: string): void {
    Storage.deleteProperty(propertyId);
  }

  // Tenant operations
  getTenantsByLandlord(landlordId: string): Tenant[] {
    return Storage.getTenants(landlordId);
  }

  getAllTenants(): Tenant[] {
    // Get all tenants from all landlords
    const allLandlords = Storage.getAllLandlordUsers();
    return allLandlords.flatMap(landlord => Storage.getTenants(landlord.id));
  }

  getTenantById(tenantId: string): Tenant | null {
    const allLandlords = Storage.getAllLandlordUsers();
    for (const landlord of allLandlords) {
      const tenants = Storage.getTenants(landlord.id);
      const tenant = tenants.find(t => t.id === tenantId);
      if (tenant) return tenant;
    }
    return null;
  }

  createTenant(tenant: Tenant): void {
    Storage.addTenant(tenant);
  }

  updateTenant(tenant: Tenant): void {
    Storage.updateTenant(tenant);
  }

  deleteTenant(tenantId: string): void {
    Storage.deleteTenant(tenantId);
  }

  // Legal Case operations
  getCasesByLandlord(landlordId: string): LegalCase[] {
    return Storage.getLegalCases(landlordId);
  }

  getAllCases(): LegalCase[] {
    return Storage.getAllLegalCasesForAdmin();
  }

  getCaseById(caseId: string): LegalCase | null {
    const allLandlords = Storage.getAllLandlordUsers();
    for (const landlord of allLandlords) {
      const cases = Storage.getLegalCases(landlord.id);
      const legalCase = cases.find(c => c.id === caseId);
      if (legalCase) return legalCase;
    }
    return null;
  }

  createCase(legalCase: LegalCase): void {
    Storage.addLegalCase(legalCase);
  }

  updateCase(legalCase: LegalCase): void {
    Storage.updateLegalCase(legalCase);
  }

  deleteCase(caseId: string): void {
    Storage.deleteLegalCase(caseId);
  }

  // Law Firm operations
  getAllLawFirms(): LawFirm[] {
    return Storage.getLawFirms();
  }

  getLawFirmById(firmId: string): LawFirm | null {
    const allFirms = Storage.getLawFirms();
    return allFirms.find(firm => firm.id === firmId) || null;
  }

  createLawFirm(lawFirm: LawFirm): void {
    Storage.addLawFirm(lawFirm);
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
