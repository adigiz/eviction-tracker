import { User, RegistrationData, County } from '../types';
import { MOCK_LANDLORD_ID_PREFIX, DEFAULT_REQUEST_PRICE } from '../constants';
import * as Storage from './localStorageService';

export interface AuthService {
  login: (username: string, password: string) => Promise<User>;
  register: (data: RegistrationData) => Promise<User>;
  logout: () => void;
  getCurrentUser: () => User | null;
  updateProfile: (userId: string, updatedData: Partial<User>) => Promise<User>;
  checkUserExists: (username: string) => boolean;
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
    
    const newUser: User = {
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
    const currentUser = Storage.getPersistedUser();
    if (!currentUser || currentUser.id !== userId) {
      throw new Error('User not found');
    }

    const updatedUser = { ...currentUser, ...updatedData };
    Storage.persistUser(updatedUser);
    return updatedUser;
  }

  checkUserExists(username: string): boolean {
    const allUsers = Storage.getAllRegisteredUsers();
    return allUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
  }

  private createDefaultPriceOverrides(): User['priceOverrides'] {
    const defaultPriceOverrides: User['priceOverrides'] = {};
    const defaultUnlockedCounties = [
      County.ANNE_ARUNDEL,
      County.BALTIMORE_CITY,
      County.BALTIMORE_COUNTY,
      County.HARFORD,
    ];
    
    Object.values(County).forEach((countyName) => {
      defaultPriceOverrides[countyName] = {
        price: DEFAULT_REQUEST_PRICE,
        unlocked: defaultUnlockedCounties.includes(countyName as County),
      };
    });
    
    return defaultPriceOverrides;
  }
}

// Export the service instance
export const authService = new LocalStorageAuthService();

// When you connect to Supabase, replace this with:
// export const authService = new SupabaseAuthService();
