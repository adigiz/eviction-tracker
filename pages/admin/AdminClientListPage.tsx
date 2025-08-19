
import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { User, LegalCase, Property, County, RegistrationData } from '../../types';
import * as Storage from '../../services/localStorageService';
import { AuthContext } from '../../App';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { MOCK_LANDLORD_ID_PREFIX, DEFAULT_REQUEST_PRICE } from '../../constants';

const ClientPricingForm: React.FC<{
  client: User;
  onSave: (updatedClient: User) => void;
  onCancel: () => void;
}> = ({ client, onSave, onCancel }) => {
    const [priceOverrides, setPriceOverrides] = useState<User['priceOverrides']>(client.priceOverrides || {});
    
    useEffect(() => {
        const initialOverrides = client.priceOverrides ? { ...client.priceOverrides } : {};
        let needsUpdate = false;
        Object.values(County).forEach(countyName => {
            if (!initialOverrides[countyName]) {
                initialOverrides[countyName] = { price: 85.00, unlocked: false };
                needsUpdate = true;
            }
        });
        if (needsUpdate) {
            setPriceOverrides(initialOverrides);
        }
    }, [client.priceOverrides]);

    const handlePriceChange = (county: County, value: string) => {
        const price = parseFloat(value);
        setPriceOverrides(prev => ({
            ...prev,
            [county]: { ...prev![county], price: isNaN(price) ? 0 : price }
        }));
    };

    const handleUnlockChange = (county: County, isChecked: boolean) => {
        setPriceOverrides(prev => ({
            ...prev,
            [county]: { ...prev![county], unlocked: isChecked }
        }));
    };

    const handleSave = () => {
        const updatedClient = { ...client, priceOverrides };
        onSave(updatedClient);
    };

    return (
        <div className="space-y-4 text-gray-200">
            <h3 className="text-lg font-semibold text-gray-100">Pricing for {client.name}</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                {Object.values(County).map(county => (
                    <div key={county} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md even:bg-gray-700">
                        <label className="col-span-5 text-sm font-medium text-gray-300">{county}</label>
                        <div className="col-span-3">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">$</span>
                                <input
                                    type="number"
                                    value={priceOverrides?.[county]?.price ?? 85}
                                    onChange={e => handlePriceChange(county, e.target.value)}
                                    className="pl-7 pr-2 py-1.5 w-full border border-gray-600 rounded-md shadow-sm sm:text-sm bg-gray-900 text-white focus:ring-primary-400 focus:border-primary-400"
                                />
                            </div>
                        </div>
                        <div className="col-span-4 flex items-center justify-center">
                            <input
                                type="checkbox"
                                id={`unlock-${county}`}
                                checked={priceOverrides?.[county]?.unlocked ?? false}
                                onChange={e => handleUnlockChange(county, e.target.checked)}
                                className="h-4 w-4 text-primary-500 bg-gray-600 border-gray-500 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={`unlock-${county}`} className="ml-2 text-sm text-gray-400">Enabled</label>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-500 border border-gray-500 rounded-md">Cancel</button>
                <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Save Prices</button>
            </div>
        </div>
    );
};


const AddClientForm: React.FC<{
  onSave: (newClientData: RegistrationData) => void;
  onCancel: () => void;
  isSaving: boolean;
}> = ({ onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState<RegistrationData>({
        username: '', password: '', name: '', businessName: '',
        address: '', email: '', phone: '', referralCode: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        setFormError('');
        if (formData.password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }
        if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
            setFormError("Username, Password, and Name are required.");
            return;
        }
        // Check for unique username
        if (Storage.getAllRegisteredUsers().some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
            setFormError("This username is already taken.");
            return;
        }
        onSave(formData);
    };
    
    const inputClass = "block w-full px-3 py-1.5 border border-gray-600 bg-gray-900 text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm";
    
    return (
        <div className="space-y-4 text-gray-200 max-h-[70vh] overflow-y-auto p-1">
            {formError && <p className="text-sm text-red-300 bg-red-500/20 p-2 rounded-md">{formError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Username <span className="text-red-400">*</span></label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputClass} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Name <span className="text-red-400">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Password <span className="text-red-400">*</span></label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Confirm Password <span className="text-red-400">*</span></label>
                    <input type="password" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Business Name</label>
                    <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Mailing Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Referral Code</label>
                    <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange} className={inputClass} />
                </div>
            </div>
             <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-500 border border-gray-500 rounded-md">Cancel</button>
                <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50">
                    {isSaving ? "Saving..." : "Create Client"}
                </button>
            </div>
        </div>
    );
};


const AdminClientListPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [clients, setClients] = useState<User[]>([]);
  const [clientData, setClientData] = useState<Record<string, { caseCount: number; propertyCount: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedClientForPricing, setSelectedClientForPricing] = useState<User | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loginFormError, setLoginFormError] = useState('');

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);


  const fetchClientData = () => {
      const landlordUsers = Storage.getAllLandlordUsers();
      setClients(landlordUsers);

      const data: Record<string, { caseCount: number; propertyCount: number }> = {};
      const allCases = Storage.getAllLegalCasesForAdmin();
      const allProperties = Storage.getAllPropertiesForAdmin();

      landlordUsers.forEach(client => {
        data[client.id] = {
          caseCount: allCases.filter(c => c.landlordId === client.id).length,
          propertyCount: allProperties.filter(p => p.landlordId === client.id).length,
        };
      });
      setClientData(data);
  };

  useEffect(() => {
    if (auth?.currentUser?.role === 'admin') {
      fetchClientData();
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [auth?.currentUser]);

  const openPricingModal = (client: User) => {
    setSelectedClientForPricing(client);
    setIsPricingModalOpen(true);
  };

  const handleSavePricing = (updatedClient: User) => {
    Storage.persistUser(updatedClient);
    fetchClientData();
    setIsPricingModalOpen(false);
    setSelectedClientForPricing(null);
  };

  const openLoginModal = (client: User) => {
    setSelectedClientForLogin(client);
    setNewUsername(client.username);
    setNewPassword('');
    setLoginFormError('');
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setSelectedClientForLogin(null);
  };

  const handleSaveLogin = () => {
    if (!selectedClientForLogin) return;

    const trimmedUsername = newUsername.trim();
    const trimmedPassword = newPassword.trim();

    if (!trimmedUsername) {
        setLoginFormError('Username cannot be empty.');
        return;
    }
    
    if (trimmedUsername !== selectedClientForLogin.username) {
        const allUsers = Storage.getAllRegisteredUsers();
        if (allUsers.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== selectedClientForLogin.id)) {
            setLoginFormError('This username is already taken by another user.');
            return;
        }
    }

    const updatedClient: User = {
        ...selectedClientForLogin,
        username: trimmedUsername,
        password: trimmedPassword ? trimmedPassword : selectedClientForLogin.password,
    };

    Storage.persistUser(updatedClient);
    fetchClientData();
    closeLoginModal();
  };

  const handleAddClient = (newClientData: RegistrationData) => {
    setIsSavingClient(true);
    // Create default pricing for the new client
    const defaultPriceOverrides: User['priceOverrides'] = {};
    const defaultUnlockedCounties = [County.ANNE_ARUNDEL, County.BALTIMORE_CITY, County.BALTIMORE_COUNTY, County.HARFORD];
    Object.values(County).forEach(countyName => {
        defaultPriceOverrides[countyName] = { price: DEFAULT_REQUEST_PRICE, unlocked: defaultUnlockedCounties.includes(countyName) };
    });

    const newUser: User = {
        ...newClientData,
        id: MOCK_LANDLORD_ID_PREFIX + Storage.generateId(),
        role: 'landlord',
        priceOverrides: defaultPriceOverrides,
    };

    Storage.persistUser(newUser);
    setIsSavingClient(false);
    setIsAddClientModalOpen(false);
    fetchClientData();
  };
  
  const handleDeleteClient = (client: User) => {
      if (window.confirm(`Are you sure you want to delete the client "${client.name}" (${client.username})? This action cannot be undone. Associated cases and properties will be orphaned.`)) {
          Storage.deleteUser(client.id);
          fetchClientData();
      }
  };


  if (isLoading) {
    return <LoadingSpinner text="Loading clients..." size="lg" />;
  }

  if (auth?.currentUser?.role !== 'admin') {
    return <p className="p-8 text-center text-red-500">Access Denied. Admin privileges required.</p>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Manage Clients (Landlords)</h1>
        <button onClick={() => setIsAddClientModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-10 bg-gray-800 rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-100">No clients found</h3>
          <p className="mt-1 text-sm text-gray-400">No landlord users have registered yet.</p>
        </div>
      ) : (
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Client Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Referral Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cases</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-100">{client.name}</div>
                    <div className="text-xs text-gray-400">{client.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{client.referralCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{clientData[client.id]?.caseCount || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 md:space-x-4">
                    <Link to={`/admin/client/${client.id}/cases`} className="text-primary-400 hover:text-primary-300 hover:underline">
                      View Cases
                    </Link>
                    <button onClick={() => openPricingModal(client)} className="text-indigo-400 hover:text-indigo-300 hover:underline">
                        Manage Pricing
                    </button>
                     <button onClick={() => openLoginModal(client)} className="text-yellow-400 hover:text-yellow-300 hover:underline">
                        Manage Login
                    </button>
                     <button onClick={() => handleDeleteClient(client)} className="text-red-400 hover:text-red-300 hover:underline">
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isPricingModalOpen && selectedClientForPricing && (
          <Modal
            isOpen={isPricingModalOpen}
            onClose={() => setIsPricingModalOpen(false)}
            title="Manage Client Pricing"
            size="2xl"
          >
              <ClientPricingForm
                client={selectedClientForPricing}
                onSave={handleSavePricing}
                onCancel={() => setIsPricingModalOpen(false)}
              />
          </Modal>
      )}

      {isLoginModalOpen && selectedClientForLogin && (
          <Modal
            isOpen={isLoginModalOpen}
            onClose={closeLoginModal}
            title={`Manage Login for ${selectedClientForLogin.name}`}
            size="lg"
          >
              <div className="space-y-4 text-gray-200">
                {loginFormError && <p className="text-sm text-red-300 bg-red-500 bg-opacity-20 p-2 rounded-md">{loginFormError}</p>}
                <div>
                    <label htmlFor="newUsername" className="block text-sm font-medium text-gray-300">Username</label>
                    <input 
                        type="text" 
                        id="newUsername" 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
                    <input 
                        type="password" 
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Leave blank to keep unchanged"
                    />
                </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={closeLoginModal} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-500 border border-gray-500 rounded-md">Cancel</button>
                    <button type="button" onClick={handleSaveLogin} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Save Credentials</button>
                </div>
              </div>
          </Modal>
      )}

       {isAddClientModalOpen && (
          <Modal
            isOpen={isAddClientModalOpen}
            onClose={() => setIsAddClientModalOpen(false)}
            title="Create New Client Account"
            size="2xl"
          >
              <AddClientForm 
                onSave={handleAddClient}
                onCancel={() => setIsAddClientModalOpen(false)}
                isSaving={isSavingClient}
              />
          </Modal>
      )}

    </div>
  );
};

export default AdminClientListPage;
