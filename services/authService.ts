import { User, RegistrationData, County, InternalUser } from '../types';
import { MOCK_LANDLORD_ID_PREFIX, DEFAULT_REQUEST_PRICE } from '../constants';
import * as Storage from './localStorageService';
import { SupabaseAuthService } from './supabaseAuthService';
import { getActiveBackend } from '../config/backend';

export interface AuthService {
  login: (username: string, password: string) => Promise<User>;
  register: (data: RegistrationData) => Promise<User>;
  logout: () => void;
  getCurrentUser: () => User | null | Promise<User | null>;
  updateProfile: (userId: string, updatedData: Partial<User>) => Promise<User>;
  checkUserExists: (username: string) => boolean | Promise<boolean>;
}

class LocalStorageAuthService implements AuthService {
  async login(username: string, password: string): Promise<User> {
    const allUsers = Storage.getAllRegisteredUsers();
    const foundUser = allUsers.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
    );
    
    if (!foundUser) {
      throw new Error('Invalid username or password');
    }
    
    Storage.persistUser(foundUser);
    return foundUser;
  }

  async register(data: RegistrationData): Promise<User> {
    const allUsers = Storage.getAllRegisteredUsers();
    if (this.checkUserExists(data.username)) {
      throw new Error('Username already exists');
    }

    const defaultPriceOverrides = this.createDefaultPriceOverrides();
    
    const newUser: InternalUser = {
      id: MOCK_LANDLORD_ID_PREFIX + Storage.generateId(),
      role: 'landlord',
      priceOverrides: defaultPriceOverrides,
      ...data,
    };

    Storage.persistUser(newUser);
    return newUser;
  }

  logout(): void {
    Storage.clearPersistedUser();
  }

  getCurrentUser(): User | null {
    return Storage.getPersistedUser();
  }

  async updateProfile(userId: string, updatedData: Partial<User>): Promise<User> {
    const allUsers = Storage.getAllRegisteredUsers();
    const userIndex = allUsers.findIndex(u => u.id === userId);
    
    if (userIndex > -1) {
      const updatedUser = { ...allUsers[userIndex], ...updatedData };
      Storage.persistUser(updatedUser);
      return updatedUser;
    }
    
    throw new Error('User not found');
  }

  checkUserExists(username: string): boolean {
    const allUsers = Storage.getAllRegisteredUsers();
    return allUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
  }

  private createDefaultPriceOverrides() {
    return {
      'Baltimore City': { price: 150, unlocked: true },
      'Baltimore County': { price: 150, unlocked: true },
      'Anne Arundel County': { price: 150, unlocked: true },
      'Howard County': { price: 150, unlocked: true },
      'Montgomery County': { price: 150, unlocked: true },
      'Prince George\'s County': { price: 150, unlocked: true },
      'Harford County': { price: 150, unlocked: true },
      'Carroll County': { price: 150, unlocked: true },
      'Frederick County': { price: 150, unlocked: true },
      'Washington County': { price: 150, unlocked: true },
      'Allegany County': { price: 150, unlocked: true },
      'Garrett County': { price: 150, unlocked: true },
      'Calvert County': { price: 150, unlocked: true },
      'Charles County': { price: 150, unlocked: true },
      'St. Mary\'s County': { price: 150, unlocked: true },
      'Cecil County': { price: 150, unlocked: true },
      'Kent County': { price: 150, unlocked: true },
      'Queen Anne\'s County': { price: 150, unlocked: true },
      'Talbot County': { price: 150, unlocked: true },
      'Caroline County': { price: 150, unlocked: true },
      'Dorchester County': { price: 150, unlocked: true },
      'Somerset County': { price: 150, unlocked: true },
      'Wicomico County': { price: 150, unlocked: true },
      'Worcester County': { price: 150, unlocked: true },
    };
  }
}

// Factory function to get the appropriate auth service
export const getAuthService = (): AuthService => {
  if (getActiveBackend() === 'supabase') {
    return new SupabaseAuthService();
  }
  return new LocalStorageAuthService();
};

// Export the current auth service instance
export const authService = getAuthService();
