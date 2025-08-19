import React, { useEffect, useState, useContext, useMemo } from "react";
import { User, LegalCase } from "../../types";
import * as Storage from "../../services/localStorageService";
import { AuthContext } from "../../App";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";

interface MonthlyAnalytics {
  [monthYear: string]: {
    [contractorId: string]: {
      contractorName: string;
      completionCount: number;
    };
  };
}

interface AllTimeAnalytics {
  [contractorId: string]: {
    totalCompletions: number;
  };
}

const AdminContractorListPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [contractors, setContractors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
  });
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<MonthlyAnalytics>({});
  const [allTimeStats, setAllTimeStats] = useState<AllTimeAnalytics>({});

  const loadData = () => {
    const allCases = Storage.getAllLegalCasesForAdmin();
    const allContractors = Storage.getAllContractorUsers();

    setContractors(allContractors);

    const contractorMap = new Map(allContractors.map((c) => [c.id, c]));
    const monthlyData: MonthlyAnalytics = {};
    const allTimeData: AllTimeAnalytics = {};

    allContractors.forEach((c) => {
      allTimeData[c.id] = { totalCompletions: 0 };
    });

    allCases.forEach((c) => {
      if (c.contractorId && c.postingCompletedAt) {
        const contractor = contractorMap.get(c.contractorId);
        if (contractor) {
          // All-Time stats
          allTimeData[contractor.id].totalCompletions += 1;

          // Monthly stats
          const monthYear = new Date(c.postingCompletedAt).toLocaleString(
            "default",
            { month: "long", year: "numeric" }
          );

          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {};
          }
          if (!monthlyData[monthYear][contractor.id]) {
            monthlyData[monthYear][contractor.id] = {
              contractorName: contractor.name,
              completionCount: 0,
            };
          }
          monthlyData[monthYear][contractor.id].completionCount += 1;
        }
      }
    });

    setAnalyticsData(monthlyData);
    setAllTimeStats(allTimeData);
  };

  useEffect(() => {
    if (auth?.currentUser?.role === "admin") {
      loadData();
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [auth?.currentUser]);

  const sortedMonths = useMemo(() => {
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return Object.keys(analyticsData).sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
    });
  }, [analyticsData]);

  const handleDownloadCSV = (
    month: string,
    dataForMonth: MonthlyAnalytics[string]
  ) => {
    const csvHeader = ["Contractor", "Completed Postings"];

    const csvRows = Object.values(dataForMonth).map((contractor) => [
      `"${contractor.contractorName.replace(/"/g, '""')}"`,
      contractor.completionCount,
    ]);

    const csvContent = [
      csvHeader.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const safeMonth = month.replace(/\s+/g, "-");
    link.setAttribute("download", `Contractor-Report-${safeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openAddModal = () => {
    setEditingContractor(null);
    setFormData({ name: "", username: "", password: "", email: "", phone: "" });
    setFormError("");
    setErrors({});
    setIsSubmitting(false);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (contractor: User) => {
    setEditingContractor(contractor);
    setFormData({
      name: contractor.name,
      username: contractor.username,
      password: "",
      email: contractor.email || "",
      phone: contractor.phone || "",
    });
    setFormError("");
    setErrors({});
    setIsSubmitting(false);
    setIsAddEditModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
    } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      newErrors.username =
        "Username can only contain letters, numbers, hyphens, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (only for new contractors)
    if (!editingContractor && !formData.password.trim()) {
      newErrors.password = "Password is required for new contractors";
    } else if (
      formData.password.trim() &&
      formData.password.trim().length < 6
    ) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (formError) setFormError("");
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const { name, username, password, email, phone } = formData;

      const allUsers = Storage.getAllRegisteredUsers();
      if (
        allUsers.some(
          (u) =>
            u.username.toLowerCase() === username.trim().toLowerCase() &&
            u.id !== editingContractor?.id
        )
      ) {
        setFormError("This username is already taken.");
        return;
      }

      if (editingContractor) {
        // Editing existing contractor
        if (!password.trim() && !editingContractor.password) {
          setFormError(
            "Password is required for a user that doesn't have one set."
          );
          return;
        }
        const updatedContractor: User = {
          ...editingContractor,
          name: name.trim(),
          username: username.trim(),
          password: password.trim()
            ? password.trim()
            : editingContractor.password,
          email: email.trim(),
          phone: phone.trim() || undefined,
        };
        Storage.persistUser(updatedContractor);
      } else {
        // Adding new contractor
        if (!password.trim()) {
          setFormError("Password is required for new contractors.");
          return;
        }
        const newContractor: User = {
          id: `contractor_${Storage.generateId()}`,
          role: "contractor",
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        };
        Storage.persistUser(newContractor);
      }

      loadData();
      setIsAddEditModalOpen(false);
      setFormData({
        name: "",
        username: "",
        password: "",
        email: "",
        phone: "",
      });
      setErrors({});
      setEditingContractor(null);
    } catch (error) {
      setFormError("An error occurred while saving the contractor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (contractor: User) => {
    if (
      window.confirm(
        `Are you sure you want to delete contractor "${contractor.name}"? This action cannot be undone.`
      )
    ) {
      Storage.deleteUser(contractor.id);
      loadData();
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading contractors..." size="lg" />;
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
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Contractors & Analytics
      </h1>

      {/* Management Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Manage Contractor Accounts
          </h2>
          <button
            onClick={openAddModal}
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
            Add New Contractor
          </button>
        </div>

        {contractors.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-100">
              No contractors found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add a contractor to get started.
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
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Username
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Completed Jobs (All-Time)
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
                {contractors.map((contractor) => (
                  <tr
                    key={contractor.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">
                      {contractor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="text-gray-500 dark:text-gray-300">
                        {contractor.email || "No Email"}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {contractor.phone || "No Phone"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {contractor.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center font-bold">
                      {allTimeStats[contractor.id]?.totalCompletions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(contractor)}
                        className="p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200"
                        title="Manage Contractor Account"
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="sr-only">Manage Account</span>
                      </button>
                      <button
                        onClick={() => handleDelete(contractor)}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title="Delete Contractor"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 4 7h16"
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
      </div>

      {/* Monthly Analytics Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Monthly Performance Analytics
        </h2>
        {sortedMonths.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-100">
              No Job Completion Data Found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No contractors have completed posting jobs yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedMonths.map((month) => (
              <div
                key={month}
                className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    {month}
                  </h3>
                  <button
                    onClick={() =>
                      handleDownloadCSV(month, analyticsData[month])
                    }
                    className="inline-flex items-center py-1.5 px-3 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    aria-label={`Download spreadsheet for ${month}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download Report
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Contractor
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Completed Jobs
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(analyticsData[month])
                        .sort(
                          ([, a], [, b]) =>
                            b.completionCount - a.completionCount
                        )
                        .map(([contractorId, contractorData]) => (
                          <tr
                            key={contractorId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">
                              {contractorData.contractorName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                              {contractorData.completionCount}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddEditModalOpen && (
        <Modal
          isOpen={isAddEditModalOpen}
          onClose={() => setIsAddEditModalOpen(false)}
          title={
            editingContractor
              ? "Manage Contractor Account"
              : "Add New Contractor"
          }
          size="2xl"
        >
          <div className="space-y-6">
            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                    errors.name
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter contractor name"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                    errors.username
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Choose a username"
                  required
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                    errors.email
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter email address"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone{" "}
                  <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password{" "}
                  {!editingContractor && (
                    <span className="text-red-500">*</span>
                  )}
                  {editingContractor && (
                    <span className="text-gray-500 text-xs">
                      (Leave blank to keep unchanged)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className={`mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors ${
                    errors.password
                      ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder={
                    editingContractor
                      ? "Leave blank to keep unchanged"
                      : "Enter password"
                  }
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>
                      {editingContractor ? "Updating..." : "Creating..."}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>
                      {editingContractor
                        ? "Update Contractor"
                        : "Create Contractor"}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminContractorListPage;
