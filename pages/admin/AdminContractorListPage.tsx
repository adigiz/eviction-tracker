import React, { useEffect, useState, useContext, useMemo } from "react";
import { User, LegalCase, InternalUser } from "../../types";
import * as Storage from "../../services/localStorageService";
import { AuthContext } from "../../App";
import LoadingSpinner from "../../components/LoadingSpinner";
import ContractorFormModal from "../../components/forms/ContractorFormModal";

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
  const [formError, setFormError] = useState("");

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
  }, [auth?.currentUser?.role]);

  const downloadMonthlyReport = (month: string) => {
    const monthData = analyticsData[month];
    if (!monthData) return;

    const csvContent = [
      "Contractor Name,Completion Count",
      ...Object.values(monthData).map(
        (data: { contractorName: string; completionCount: number }) =>
          `${data.contractorName},${data.completionCount}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeMonth = month.replace(/\s+/g, "-");
    link.setAttribute("download", `Contractor-Report-${safeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openAddModal = () => {
    setEditingContractor(null);
    setFormError("");
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (contractor: User) => {
    setEditingContractor(contractor);
    setFormError("");
    setIsAddEditModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      const { name, username, password, email, phone } = data;

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
        const updatedContractor: InternalUser = {
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
        const newContractor: InternalUser = {
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
    } catch (error) {
      setFormError("Failed to save contractor. Please try again.");
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

  const monthsWithData = Object.keys(analyticsData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contractor Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage contractor accounts and view performance analytics
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Contractor Management Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Contractor Accounts
                </h2>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
                >
                  Add New Contractor
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contractor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Completions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {contractors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No contractors found
                      </td>
                    </tr>
                  ) : (
                    contractors.map((contractor) => (
                      <tr
                        key={contractor.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {contractor.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{contractor.username}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {contractor.email}
                          </div>
                          {contractor.phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {contractor.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {allTimeStats[contractor.id]?.totalCompletions || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(contractor)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(contractor)}
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

          {/* Monthly Performance Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Monthly Performance Analytics
              </h2>
            </div>

            {monthsWithData.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <p>No Job Completion Data Found</p>
                <p className="text-sm mt-1">
                  Data will appear here once contractors complete jobs
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {monthsWithData.map((month) => {
                  const monthData = analyticsData[month];
                  const contractors = Object.keys(monthData);
                  const totalCompletions = Object.values(monthData).reduce(
                    (
                      sum: number,
                      data: { contractorName: string; completionCount: number }
                    ) => sum + data.completionCount,
                    0
                  );

                  return (
                    <div
                      key={month}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {month}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total: {totalCompletions} completions
                          </span>
                          <button
                            onClick={() => downloadMonthlyReport(month)}
                            className="px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                          >
                            Download CSV
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Contractor
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Completions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {contractors.map((contractorId) => {
                              const data = monthData[contractorId];
                              return (
                                <tr
                                  key={contractorId}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                    {data.contractorName}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                    {data.completionCount}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Contractor Modal */}
      <ContractorFormModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        editingContractor={editingContractor}
        onSubmit={handleSave}
        formError={formError}
      />
    </div>
  );
};

export default AdminContractorListPage;
