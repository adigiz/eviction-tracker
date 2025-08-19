import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  User,
  LegalCase,
  Property,
  County,
  RegistrationData,
} from "../../types";
import * as Storage from "../../services/localStorageService";
import { AuthContext } from "../../App";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
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
    <div className="space-y-4 text-gray-700 dark:text-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        Pricing for {client.name}
      </h3>
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
        {Object.values(County).map((county) => (
          <div
            key={county}
            className="grid grid-cols-12 gap-2 items-center p-2 rounded-md even:bg-gray-100 dark:even:bg-gray-700"
          >
            <label className="col-span-5 text-sm font-medium text-gray-600 dark:text-gray-300">
              {county}
            </label>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={priceOverrides?.[county]?.price ?? 85}
                  onChange={(e) => handlePriceChange(county, e.target.value)}
                  className="pl-7 pr-2 py-1.5 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-primary-400 focus:border-primary-400"
                />
              </div>
            </div>
            <div className="col-span-4 flex items-center justify-center">
              <input
                type="checkbox"
                id={`unlock-${county}`}
                checked={priceOverrides?.[county]?.unlocked ?? false}
                onChange={(e) => handleUnlockChange(county, e.target.checked)}
                className="h-4 w-4 text-primary-500 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500"
              />
              <label
                htmlFor={`unlock-${county}`}
                className="ml-2 text-sm text-gray-600 dark:text-gray-400"
              >
                Enabled
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md"
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

const AddClientForm: React.FC<{
  onSave: (newClientData: RegistrationData) => void;
  onCancel: () => void;
  isSaving: boolean;
}> = ({ onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<RegistrationData>({
    username: "",
    password: "",
    name: "",
    businessName: "",
    address: "",
    email: "",
    phone: "",
    referralCode: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    setFormError("");
    if (formData.password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (
      !formData.username.trim() ||
      !formData.password.trim() ||
      !formData.name.trim()
    ) {
      setFormError("Username, Password, and Name are required.");
      return;
    }
    // Check for unique username
    if (
      Storage.getAllRegisteredUsers().some(
        (u) => u.username.toLowerCase() === formData.username.toLowerCase()
      )
    ) {
      setFormError("This username is already taken.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
      {formError && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
          {formError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Confirm password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter email address"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mailing Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter mailing address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Referral Code
          </label>
          <input
            type="text"
            name="referralCode"
            value={formData.referralCode}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter referral code"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {isSaving ? "Creating..." : "Create Client"}
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
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loginFormError, setLoginFormError] = useState("");

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);

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
    setNewUsername(client.username);
    setNewPassword("");
    setLoginFormError("");
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
      setLoginFormError("Username cannot be empty.");
      return;
    }

    if (trimmedUsername !== selectedClientForLogin.username) {
      const allUsers = Storage.getAllRegisteredUsers();
      if (
        allUsers.some(
          (u) =>
            u.username.toLowerCase() === trimmedUsername.toLowerCase() &&
            u.id !== selectedClientForLogin.id
        )
      ) {
        setLoginFormError("This username is already taken by another user.");
        return;
      }
    }

    const updatedClient: User = {
      ...selectedClientForLogin,
      username: trimmedUsername,
      password: trimmedPassword
        ? trimmedPassword
        : selectedClientForLogin.password,
    };

    Storage.persistUser(updatedClient);
    fetchClientData();
    closeLoginModal();
  };

  const handleAddClient = (newClientData: RegistrationData) => {
    setIsSavingClient(true);
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

    const newUser: User = {
      ...newClientData,
      id: MOCK_LANDLORD_ID_PREFIX + Storage.generateId(),
      role: "landlord",
      priceOverrides: defaultPriceOverrides,
    };

    Storage.persistUser(newUser);
    setIsSavingClient(false);
    setIsAddClientModalOpen(false);
    fetchClientData();
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Manage Clients (Landlords)
        </h1>
        <button
          onClick={() => setIsAddClientModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-md flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-100">
            No clients found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No landlord users have registered yet.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Client Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Referral Code
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Cases
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {client.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {client.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {client.referralCode || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {clientData[client.id]?.caseCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 md:space-x-4">
                    <Link
                      to={`/admin/client/${client.id}/cases`}
                      className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 inline-flex items-center"
                      title="View Client Cases"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="sr-only">View Cases</span>
                    </Link>
                    <button
                      onClick={() => openPricingModal(client)}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                      title="Manage Client Pricing"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      <span className="sr-only">Manage Pricing</span>
                    </button>
                    <button
                      onClick={() => openLoginModal(client)}
                      className="p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200"
                      title="Manage Client Login"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7 7m0 0a6 6 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                        />
                      </svg>
                      <span className="sr-only">Manage Login</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      title="Delete Client"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="sr-only">Delete</span>
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
          <div className="space-y-6">
            {loginFormError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                {loginFormError}
              </p>
            )}

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="newUsername"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="newUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter new username"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Leave blank to keep unchanged"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={closeLoginModal}
                className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLogin}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Save Credentials
              </button>
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
