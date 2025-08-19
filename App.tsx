
import React, { useState, useEffect, createContext, useMemo, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { User, AuthContextType, RegistrationData, County, PaymentStatus, LegalCaseStatus, Property, Tenant, PropertyType, LegalCase } from './types';
import { APP_NAME, MOCK_LANDLORD_ID_PREFIX, DEFAULT_REQUEST_PRICE } from './constants';
import * as Storage from './services/localStorageService';

import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import CasesPage from './pages/CasesPage';
import LoadingSpinner from './components/LoadingSpinner';
import CartPage from './pages/CartPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminClientListPage from './pages/admin/AdminClientListPage';
import AdminAllCasesPage from './pages/admin/AdminAllCasesPage';
import AdminClientCasesPage from './pages/admin/AdminClientCasesPage';
import LawFirmPage from './pages/admin/LawFirmPage';
import AdminContractorListPage from './pages/admin/AdminContractorListPage';

// Contractor Pages
import ContractorDashboardPage from './pages/contractor/ContractorDashboardPage';

export const AuthContext = createContext<AuthContextType | null>(null);

type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType | null>(null);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem('app-theme');
        return (storedTheme as Theme) || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

    return (
        <ThemeContext.Provider value={themeContextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

const AdminRoutes: React.FC = () => {
  const auth = useContext(AuthContext);
  if (auth?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner text="Verifying admin access..." size="lg" />
      </div>
    );
  }
  return auth?.currentUser?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const ContractorRoutes: React.FC = () => {
  const auth = useContext(AuthContext);
  if (auth?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner text="Verifying contractor access..." size="lg" />
      </div>
    );
  }
  return auth?.currentUser?.role === 'contractor' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
            // Seed data if local storage is empty
        const seedInitialData = () => {
          const allUsers = Storage.getAllRegisteredUsers();
          if (allUsers.length === 0) {

        // Seed law firm for referral demo
        const lawFirm = { id: 'law_firm_01', name: 'Smith & Jones Law', referralCode: 'SJLAW5' };
        Storage.addLawFirm(lawFirm);
        
        // --- Create Users ---

        // 1. Admin
        const adminUser: User = {
          id: 'admin_user_01',
          username: 'admin',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin',
        };
        Storage.persistUser(adminUser);

        // 2. Contractor
        const contractorUser: User = {
          id: 'contractor_user_01',
          username: 'contractor',
          password: 'contractor123',
          name: 'John Contractor',
          email: 'contractor@example.com',
          phone: '555-0102',
          role: 'contractor',
        };
        Storage.persistUser(contractorUser);

        // 3. Landlord
        const defaultPriceOverrides: User['priceOverrides'] = {};
        const defaultUnlockedCounties = [County.ANNE_ARUNDEL, County.BALTIMORE_CITY, County.BALTIMORE_COUNTY, County.HARFORD, County.HOWARD];
        Object.values(County).forEach(countyName => {
            defaultPriceOverrides[countyName] = { price: DEFAULT_REQUEST_PRICE, unlocked: defaultUnlockedCounties.includes(countyName as County) };
        });

        const landlordUser: User = {
          id: 'landlord_user_01',
          username: 'landlord',
          password: 'landlord123',
          name: 'Jane Landlord',
          email: 'landlord@example.com',
          phone: '555-0101',
          address: '123 Main St, Anytown, USA',
          role: 'landlord',
          referralCode: lawFirm.referralCode,
          priceOverrides: defaultPriceOverrides
        };
        Storage.persistUser(landlordUser);
        
        // --- Create Properties and Tenants for Landlord ---
        const properties: Property[] = [
            { id: 'prop_1', landlordId: landlordUser.id, county: County.BALTIMORE_CITY, address: '123 Oak St', city: 'Baltimore', state: 'MD', zipCode: '21201', propertyType: PropertyType.RESIDENTIAL, description: 'Front door access code is 1234.' },
            { id: 'prop_2', landlordId: landlordUser.id, county: County.BALTIMORE_COUNTY, address: '456 Maple Ave', city: 'Towson', state: 'MD', zipCode: '21204', propertyType: PropertyType.RESIDENTIAL, description: 'Mailbox is to the left of the door.' },
            { id: 'prop_3', landlordId: landlordUser.id, county: County.ANNE_ARUNDEL, address: '789 Pine Ln', city: 'Annapolis', state: 'MD', zipCode: '21401', propertyType: PropertyType.RESIDENTIAL, description: 'Beware of dog.' },
            { id: 'prop_4', landlordId: landlordUser.id, county: County.HARFORD, address: '101 Birch Rd', city: 'Bel Air', state: 'MD', zipCode: '21014', propertyType: PropertyType.COMMERCIAL, description: 'Post on the main glass door.' },
            { id: 'prop_5', landlordId: landlordUser.id, county: County.HOWARD, address: '212 Elm St', city: 'Columbia', state: 'MD', zipCode: '21044', propertyType: PropertyType.RESIDENTIAL, description: 'Unit is on the second floor.' },
        ];
        properties.forEach(p => Storage.addProperty(p));

        const tenants: Tenant[] = [
            { id: 'ten_1', landlordId: landlordUser.id, propertyId: 'prop_1', tenantNames: ['John Doe'] },
            { id: 'ten_2', landlordId: landlordUser.id, propertyId: 'prop_2', tenantNames: ['Jane Smith'] },
            { id: 'ten_3', landlordId: landlordUser.id, propertyId: 'prop_3', tenantNames: ['Peter Jones'] },
            { id: 'ten_4', landlordId: landlordUser.id, propertyId: 'prop_4', tenantNames: ['Williams Contracting LLC'] },
            { id: 'ten_5', landlordId: landlordUser.id, propertyId: 'prop_5', tenantNames: ['David Brown', 'Susan Brown'] },
        ];
        tenants.forEach(t => Storage.addTenant(t));

        // --- Create Cases in Various States ---
        const getDate = (offsetDays: number) => {
            const date = new Date();
            date.setDate(date.getDate() + offsetDays);
            return date.toISOString().split('T')[0];
        };

        const cases: LegalCase[] = [
            // Case 1: In Cart (Notice Draft / Unpaid)
            { id: 'case_1', landlordId: landlordUser.id, propertyId: 'prop_1', tenantId: 'ten_1', caseType: 'FTPR', dateInitiated: getDate(-1), rentOwedAtFiling: 1200, status: LegalCaseStatus.NOTICE_DRAFT, paymentStatus: PaymentStatus.UNPAID, price: 80.00, generatedDocuments: {}, districtCourtCaseNumber: 'D-01-CV-24-111111', warrantOrderDate: getDate(-10), initialEvictionDate: getDate(20) },
            // Case 2: Available for Contractor (Submitted / Paid)
            { id: 'case_2', landlordId: landlordUser.id, propertyId: 'prop_2', tenantId: 'ten_2', caseType: 'FTPR', dateInitiated: getDate(-2), rentOwedAtFiling: 950, status: LegalCaseStatus.SUBMITTED, paymentStatus: PaymentStatus.PAID, price: 85.00, generatedDocuments: {}, districtCourtCaseNumber: 'D-02-CV-24-222222', warrantOrderDate: getDate(-12), initialEvictionDate: getDate(25) },
            // Case 3: Claimed by Contractor (Submitted / Paid)
            { id: 'case_3', landlordId: landlordUser.id, propertyId: 'prop_3', tenantId: 'ten_3', caseType: 'FTPR', dateInitiated: getDate(-5), rentOwedAtFiling: 2100, status: LegalCaseStatus.SUBMITTED, paymentStatus: PaymentStatus.PAID, price: 85.00, generatedDocuments: {}, contractorId: contractorUser.id, claimedAt: new Date().toISOString(), districtCourtCaseNumber: 'D-03-CV-24-333333', warrantOrderDate: getDate(-15), initialEvictionDate: getDate(18) },
            // Case 4: In Progress by Admin (In Progress / Paid)
            { id: 'case_5', landlordId: landlordUser.id, propertyId: 'prop_5', tenantId: 'ten_5', caseType: 'FTPR', dateInitiated: getDate(-10), rentOwedAtFiling: 1500, status: LegalCaseStatus.IN_PROGRESS, paymentStatus: PaymentStatus.PAID, price: 85.00, generatedDocuments: {}, districtCourtCaseNumber: 'D-05-CV-24-555555', warrantOrderDate: getDate(-20), initialEvictionDate: getDate(30), courtOutcomeNotes: "Admin reviewing documents." },
            // Case 5: Completed (Complete / Paid)
            { id: 'case_4', landlordId: landlordUser.id, propertyId: 'prop_4', tenantId: 'ten_4', caseType: 'FTPR', dateInitiated: getDate(-20), rentOwedAtFiling: 3500, status: LegalCaseStatus.COMPLETE, paymentStatus: PaymentStatus.PAID, price: 85.00, generatedDocuments: {}, contractorId: contractorUser.id, claimedAt: getDate(-18), postingCompletedAt: getDate(-15), districtCourtCaseNumber: 'D-04-CV-24-444444', warrantOrderDate: getDate(-30), initialEvictionDate: getDate(-5), thirtyDayNoticeFileName: 'eviction_notice.pdf', uploadedDocument1FileName: 'cert_of_mailing.pdf', uploadedPhotoFileName: 'posting_photo.jpg', uploadedReceiptFileName: 'mailing_receipt.pdf' },
        ];
        cases.forEach(c => Storage.addLegalCase(c));
      }
    };
    
    seedInitialData();
  }, []);

  const updateCartCount = (userId?: string) => {
    const idToUse = userId || currentUser?.id;
    if (!idToUse) {
      setCartItemCount(0);
      return;
    }
            try {
          const userCases = Storage.getLegalCases(idToUse);
          const count = userCases.filter(c => c.paymentStatus === PaymentStatus.UNPAID && c.status === LegalCaseStatus.NOTICE_DRAFT).length;
          setCartItemCount(count);
        } catch (error) {
          // Silently handle cart count update errors
        }
  };

  useEffect(() => {
    const checkCurrentUser = () => {
              try {
          const user = Storage.getPersistedUser();
          if (user) {
            setCurrentUser(user);
            updateCartCount(user.id);
          }
        } catch (error) {
          Storage.clearPersistedUser();
        } finally {
        setIsLoading(false);
      }
    };
    checkCurrentUser();
  }, []);

  const login = (username: string, password: string) => {
    setIsLoading(true);
    try {
      const allUsers = Storage.getAllRegisteredUsers();
      const foundUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (foundUser) {
        Storage.persistUser(foundUser);
        setCurrentUser(foundUser);
        updateCartCount(foundUser.id);
      } else {
        alert("Login failed: Invalid username or password.");
      }
    } catch (error) {
      alert(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = (data: RegistrationData) => {
    setIsLoading(true);
    try {
      const allUsers = Storage.getAllRegisteredUsers();
      if (allUsers.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
        alert("Registration failed: Username already exists.");
        setIsLoading(false);
        return;
      }

      const defaultPriceOverrides: User['priceOverrides'] = {};
      const defaultUnlockedCounties = [County.ANNE_ARUNDEL, County.BALTIMORE_CITY, County.BALTIMORE_COUNTY, County.HARFORD];
      Object.values(County).forEach(countyName => {
          defaultPriceOverrides[countyName] = { price: DEFAULT_REQUEST_PRICE, unlocked: defaultUnlockedCounties.includes(countyName as County) };
      });

      const newUser: User = {
        id: MOCK_LANDLORD_ID_PREFIX + Storage.generateId(),
        role: 'landlord',
        priceOverrides: defaultPriceOverrides,
        ...data,
      };

      Storage.persistUser(newUser);
      setCurrentUser(newUser);
      setCartItemCount(0);
    } catch (error) {
      alert(`Registration failed: ${error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setCurrentUser(null);
    Storage.clearPersistedUser();
    setCartItemCount(0);
  };
  
  const updateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
        const updatedUser = { ...currentUser, ...updatedData };
        Storage.persistUser(updatedUser);
        setCurrentUser(updatedUser);
        alert("Account information updated successfully!");
    } catch (error) {
        alert(`Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
        setIsLoading(false);
    }
  };

  const authContextValue = useMemo(() => ({
    currentUser,
    login,
    register,
    logout,
    isLoading,
    getCartItemCount: () => cartItemCount, 
    updateCartCount,
    updateProfile,
  }), [currentUser, isLoading, cartItemCount]); 

  if (isLoading) {
      return (
        <ThemeProvider>
          <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <LoadingSpinner text="Loading Application..." size="lg"/>
          </div>
        </ThemeProvider>
      );
  }

  const commonFooter = (
    <footer className={`text-center p-4 text-xs ${currentUser?.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-800 text-white'}`}>
      &copy; {new Date().getFullYear()} {APP_NAME}. For demonstration purposes only. Not legal advice.
    </footer>
  );

  return (
    <ThemeProvider>
      <AuthContext.Provider value={authContextValue}>
        <HashRouter>
          {currentUser ? (
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className={`flex-grow ${currentUser?.role === 'admin' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200'}`}>
                <Routes>
                  {/* Landlord Routes */}
                  <Route path="/dashboard" element={currentUser.role === 'landlord' ? <DashboardPage /> : <Navigate to="/admin/dashboard" replace />} />
                  <Route path="/tenants" element={currentUser.role === 'landlord' ? <PropertiesPage /> : <Navigate to="/admin/dashboard" replace />} />
                  <Route path="/cases" element={currentUser.role === 'landlord' ? <CasesPage /> : <Navigate to="/admin/dashboard" replace />} />
                  <Route path="/cart" element={currentUser.role === 'landlord' ? <CartPage /> : <Navigate to="/admin/dashboard" replace />} />
                  <Route path="/payment-success" element={currentUser.role === 'landlord' ? <PaymentSuccessPage /> : <Navigate to="/admin/dashboard" replace />} />
                  <Route path="/payment-cancel" element={currentUser.role === 'landlord' ? <PaymentCancelPage /> : <Navigate to="/admin/dashboard" replace />} />
                  
                  {/* Contractor Routes */}
                  <Route path="/contractor" element={<ContractorRoutes />}>
                    <Route path="dashboard" element={<ContractorDashboardPage />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminRoutes />}>
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="clients" element={<AdminClientListPage />} />
                    <Route path="contractors" element={<AdminContractorListPage />} />
                    <Route path="all-cases" element={<AdminAllCasesPage />} />
                    <Route path="client/:landlordId/cases" element={<AdminClientCasesPage />} />
                    <Route path="law-firms" element={<LawFirmPage />} />
                  </Route>
                  
                  <Route path="/" element={<Navigate to={
                      currentUser.role === 'admin' ? "/admin/dashboard" :
                      currentUser.role === 'contractor' ? "/contractor/dashboard" :
                      "/dashboard"
                  } replace />} />
                  <Route path="*" element={<Navigate to={
                      currentUser.role === 'admin' ? "/admin/dashboard" :
                      currentUser.role === 'contractor' ? "/contractor/dashboard" :
                      "/dashboard"
                  } replace />} />
                </Routes>
              </main>
              {commonFooter}
            </div>
          ) : (
             <main className="bg-gray-50 dark:bg-gray-900">
                <Routes>
                  <Route path="/login" element={<AuthForm />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
             </main>
          )}
        </HashRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

export default App;
