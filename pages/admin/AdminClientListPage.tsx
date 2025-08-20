import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  LegalCase,
  Property,
  County,
  RegistrationData,
  InternalUser,
} from "../../types";
import * as Storage from "../../services/localStorageService";
import { AuthContext } from "../../App";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import ClientFormModal from "../../components/forms/ClientFormModal";
import ClientLoginModal from "../../components/forms/ClientLoginModal";
import { ClientFormData } from "../../lib/validations";
import {
  MOCK_LANDLORD_ID_PREFIX,
  DEFAULT_REQUEST_PRICE,
} from "../../constants";

const ClientPricingForm: React.FC<{
  client: User;
  onSave: (updatedClient: User) => void;
  onCancel: () => void;
}> = ({ client, onSave, onCancel }) => {
  const [priceOverrides, setPriceOverrides] = useState<User["priceOverrides"]>(
    client.priceOverrides || {}
  );

  useEffect(() => {
    const initialOverrides = client.priceOverrides
      ? { ...client.priceOverrides }
      : {};
    let needsUpdate = false;
    Object.values(County).forEach((countyName) => {
      if (!initialOverrides[countyName]) {
        initialOverrides[countyName] = { price: 85.0, unlocked: false };
        needsUpdate = true;
      }
    });
    if (needsUpdate) {
      setPriceOverrides(initialOverrides);
    }
  }, [client.priceOverrides]);

  const handlePriceChange = (county: County, value: string) => {
    const price = parseFloat(value);
    setPriceOverrides((prev) => ({
      ...prev,
      [county]: { ...prev![county], price: isNaN(price) ? 0 : price },
    }));
  };

  const handleUnlockChange = (county: County, isChecked: boolean) => {
    setPriceOverrides((prev) => ({
      ...prev,
      [county]: { ...prev![county], unlocked: isChecked },
    }));
  };

  const handleSave = () => {
    const updatedClient = { ...client, priceOverrides };
    onSave(updatedClient);
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(County).map((county) => (
          <div
            key={county}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {county.replace(/_/g, " ")}
              </h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={priceOverrides[county]?.unlocked || false}
                  onChange={(e) => handleUnlockChange(county, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Unlocked
                </span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceOverrides[county]?.price || 85.0}
                onChange={(e) => handlePriceChange(county, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={!priceOverrides[county]?.unlocked}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
        >
          Save Prices
        </button>
      </div>
    </div>
  );
};

const AdminClientListPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [clients, setClients] = useState<User[]>([]);
  const [clientData, setClientData] = useState<
    Record<string, { caseCount: number; propertyCount: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedClientForPricing, setSelectedClientForPricing] =
    useState<User | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedClientForLogin, setSelectedClientForLogin] =
    useState<User | null>(null);
  const [loginFormError, setLoginFormError] = useState("");

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [addClientError, setAddClientError] = useState("");

  const fetchClientData = () => {
    const landlordUsers = Storage.getAllLandlordUsers();
    setClients(landlordUsers);

    const data: Record<string, { caseCount: number; propertyCount: number }> =
      {};
    const allCases = Storage.getAllLegalCasesForAdmin();
    const allProperties = Storage.getAllPropertiesForAdmin();

    landlordUsers.forEach((client) => {
      data[client.id] = {
        caseCount: allCases.filter((c) => c.landlordId === client.id).length,
        propertyCount: allProperties.filter((p) => p.landlordId === client.id)
          .length,
      };
    });
    setClientData(data);
  };

  useEffect(() => {
    if (auth?.currentUser?.role === "admin") {
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
    setLoginFormError("");
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setSelectedClientForLogin(null);
  };

  const handleSaveLogin = (username: string, password: string) => {
    if (!selectedClientForLogin) return;

    if (!username.trim()) {
      setLoginFormError("Username cannot be empty.");
      return;
    }

    if (username !== selectedClientForLogin.username) {
      const allUsers = Storage.getAllRegisteredUsers();
      if (
        allUsers.some(
          (u) =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.id !== selectedClientForLogin.id
        )
      ) {
        setLoginFormError("This username is already taken by another user.");
        return;
      }
    }

    const updatedClient: User = {
      ...selectedClientForLogin,
      username: username.trim(),
      password: password || selectedClientForLogin.password,
    };

    Storage.persistUser(updatedClient);
    fetchClientData();
    closeLoginModal();
  };

  const handleAddClient = async (newClientData: ClientFormData) => {
    try {
      setAddClientError("");

      // Check for unique username
      const existingUsers = Storage.getAllRegisteredUsers();
      if (
        existingUsers.some(
          (u) =>
            u.username.toLowerCase() === newClientData.username.toLowerCase()
        )
      ) {
        setAddClientError("This username is already taken.");
        return;
      }

      // Create default pricing for the new client
      const defaultPriceOverrides: User["priceOverrides"] = {};
      const defaultUnlockedCounties = [
        County.ANNE_ARUNDEL,
        County.BALTIMORE_CITY,
        County.BALTIMORE_COUNTY,
        County.HARFORD,
      ];
      Object.values(County).forEach((countyName) => {
        defaultPriceOverrides[countyName] = {
          price: DEFAULT_REQUEST_PRICE,
          unlocked: defaultUnlockedCounties.includes(countyName),
        };
      });

      const newUser: InternalUser = {
        id: MOCK_LANDLORD_ID_PREFIX + Storage.generateId(),
        role: "landlord",
        username: newClientData.username,
        password: newClientData.password,
        name: newClientData.name,
        businessName: newClientData.businessName,
        address: newClientData.address,
        email: newClientData.email,
        phone: newClientData.phone,
        referralCode: newClientData.referralCode,
        priceOverrides: defaultPriceOverrides,
      };

      Storage.persistUser(newUser);
      setIsAddClientModalOpen(false);
      fetchClientData();
    } catch (error) {
      setAddClientError("Failed to create client. Please try again.");
    }
  };

  const handleDeleteClient = (client: User) => {
    if (
      window.confirm(
        `Are you sure you want to delete the client "${client.name}" (${client.username})? This action cannot be undone. Associated cases and properties will be orphaned.`
      )
    ) {
      Storage.deleteUser(client.id);
      fetchClientData();
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading clients..." size="lg" />;
  }

  if (auth?.currentUser?.role !== "admin") {
    return (
      <p className="p-8 text-center text-red-500">
        Access Denied. Admin privileges required.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Client Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage landlord accounts and pricing
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Client Management Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Client Accounts
                </h2>
                <button
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
                >
                  Add New Client
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cases
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Properties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {clients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{client.username}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {client.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {clientData[client.id]?.caseCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {clientData[client.id]?.propertyCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/admin/client/${client.id}/cases`}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                              View Cases
                            </Link>
                            <button
                              onClick={() => openPricingModal(client)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                              Manage Pricing
                            </button>
                            <button
                              onClick={() => openLoginModal(client)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                              Manage Login
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isPricingModalOpen && selectedClientForPricing && (
        <Modal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          title={`Manage Pricing - ${selectedClientForPricing.name}`}
          size="4xl"
        >
          <ClientPricingForm
            client={selectedClientForPricing}
            onSave={handleSavePricing}
            onCancel={() => setIsPricingModalOpen(false)}
          />
        </Modal>
      )}

      <ClientFormModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSubmit={handleAddClient}
        formError={addClientError}
        isSaving={isSavingClient}
      />

      <ClientLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        client={selectedClientForLogin}
        onSave={handleSaveLogin}
        isSaving={false}
      />
    </div>
  );
};

export default AdminClientListPage;
