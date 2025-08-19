import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../App";
import * as Storage from "../../services/localStorageService";
import { LegalCase, User, LawFirm, PaymentStatus } from "../../types";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { DISCOUNT_AMOUNT } from "../../constants";

interface MonthlyAnalytics {
  [monthYear: string]: {
    [firmId: string]: {
      firmName: string;
      filingCount: number;
      totalReferralFee: number;
    };
  };
}

interface AllTimeAnalytics {
  [firmId: string]: {
    totalReferrals: number;
  };
}

const LawFirmPage: React.FC = () => {
  const auth = useContext(AuthContext);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<MonthlyAnalytics>({});
  const [allTimeStats, setAllTimeStats] = useState<AllTimeAnalytics>({});

  // Management State
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<LawFirm | null>(null);
  const [firmName, setFirmName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [formError, setFormError] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    const allCases = Storage.getAllLegalCasesForAdmin();
    const allLandlords = Storage.getAllLandlordUsers();
    const allFirms = Storage.getLawFirms();

    setLawFirms(allFirms);

    // Calculate analytics for paid cases
    const userMap = new Map(allLandlords.map((u) => [u.id, u]));
    const firmMapByCode = new Map(
      allFirms.map((f) => [f.referralCode.toLowerCase(), f])
    );
    const monthlyData: MonthlyAnalytics = {};
    const allTimeData: AllTimeAnalytics = {};

    allFirms.forEach((f) => {
      allTimeData[f.id] = { totalReferrals: 0 };
    });

    allCases.forEach((c) => {
      const user = userMap.get(c.landlordId);
      // Only count referrals for cases that have been paid for
      if (user && user.referralCode && c.paymentStatus === PaymentStatus.PAID) {
        const firm = firmMapByCode.get(user.referralCode.toLowerCase());
        if (firm) {
          // All-Time stats
          allTimeData[firm.id].totalReferrals += 1;

          // Monthly stats
          const monthYear = new Date(
            c.dateInitiated + "T12:00:00"
          ).toLocaleString("default", { month: "long", year: "numeric" });

          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {};
          }
          if (!monthlyData[monthYear][firm.id]) {
            monthlyData[monthYear][firm.id] = {
              firmName: firm.name,
              filingCount: 0,
              totalReferralFee: 0,
            };
          }
          monthlyData[monthYear][firm.id].filingCount += 1;
          monthlyData[monthYear][firm.id].totalReferralFee += DISCOUNT_AMOUNT;
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
        return parseInt(yearB) - parseInt(yearA); // Sort by year descending
      }
      return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA); // Sort by month descending
    });
  }, [analyticsData]);

  const handleDownloadCSV = (
    month: string,
    firmDataForMonth: MonthlyAnalytics[string]
  ) => {
    const csvHeader = ["Law Firm", "Paid Referrals", "Referral Fee Owed"];

    const csvRows = Object.values(firmDataForMonth).map((firm) => [
      `"${firm.firmName.replace(/"/g, '""')}"`, // Handle quotes in firm names
      firm.filingCount,
      firm.totalReferralFee.toFixed(2),
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
    link.setAttribute("download", `Referral-Report-${safeMonth}.csv`);
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Law Firm Management Functions ---
  const openModalForNew = () => {
    setEditingFirm(null);
    setFirmName("");
    setReferralCode("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openModalForEdit = (firm: LawFirm) => {
    setEditingFirm(firm);
    setFirmName(firm.name);
    setReferralCode(firm.referralCode);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = (firmId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this law firm? This action cannot be undone."
      )
    ) {
      Storage.deleteLawFirm(firmId);
      loadData(); // Reload all data
    }
  };

  const isCodeUnique = (code: string, firmIdToExclude?: string): boolean => {
    const lowerCaseCode = code.trim().toLowerCase();
    return !lawFirms.some(
      (firm) =>
        firm.referralCode.toLowerCase() === lowerCaseCode &&
        firm.id !== firmIdToExclude
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!firmName.trim() || !referralCode.trim()) {
      setFormError("Both firm name and referral code are required.");
      return;
    }

    if (!isCodeUnique(referralCode, editingFirm?.id)) {
      setFormError(
        "This referral code is already in use by another firm. Please choose a unique code."
      );
      return;
    }

    if (editingFirm) {
      const updatedFirm: LawFirm = {
        ...editingFirm,
        name: firmName.trim(),
        referralCode: referralCode.trim().toUpperCase(),
      };
      Storage.updateLawFirm(updatedFirm);
    } else {
      const newFirm: LawFirm = {
        id: Storage.generateId(),
        name: firmName.trim(),
        referralCode: referralCode.trim().toUpperCase(),
      };
      Storage.addLawFirm(newFirm);
    }

    loadData(); // Reload all data
    setIsModalOpen(false);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading law firm data..." size="lg" />;
  }

  if (auth?.currentUser?.role !== "admin") {
    return (
      <p className="p-8 text-center text-red-500">
        Access Denied. Admin privileges required.
      </p>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      {/* Analytics Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          Law Firm Referral Analytics
        </h1>
        {sortedMonths.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-100">
              No Referral Data Found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No paid cases have been filed yet using a law firm referral code.
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
                  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    {month}
                  </h2>
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
                    Download Spreadsheet
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Law Firm
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Paid Referrals
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Referral Fee Owed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(analyticsData[month])
                        .sort(([, a], [, b]) => b.filingCount - a.filingCount)
                        .map(([firmId, firmData]) => (
                          <tr
                            key={firmId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">
                              {firmData.firmName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                              {firmData.filingCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 text-right font-semibold">
                              ${firmData.totalReferralFee.toFixed(2)}
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

      {/* Management Section */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Manage Law Firms & Referrals
          </h1>
          <button
            onClick={openModalForNew}
            className="btn-primary flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Add Law Firm
          </button>
        </div>

        {lawFirms.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-100">
              No law firms found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first law firm and referral code.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Law Firm Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    All-Time Referrals
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {lawFirms.map((firm) => (
                  <tr
                    key={firm.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">
                      {firm.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {firm.referralCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center font-medium">
                      {allTimeStats[firm.id]?.totalReferrals || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModalForEdit(firm)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
                        title="Edit Law Firm"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(firm.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title="Delete Law Firm"
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
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingFirm ? "Edit Law Firm" : "Add New Law Firm"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                {formError}
              </p>
            )}

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="firmName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Law Firm Name
                </label>
                <input
                  type="text"
                  id="firmName"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter law firm name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="referralCode"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Referral Code
                </label>
                <input
                  type="text"
                  id="referralCode"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono"
                  placeholder="e.g., FIRM5OFF"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Must be unique. Will be saved in uppercase.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {editingFirm ? "Save Changes" : "Add Firm"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
                .btn-primary { 
                  @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors;
                }
                .btn-secondary { 
                  @apply py-2 px-4 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors;
                }
                .input-form { @apply mt-1 block w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500; }
             `}</style>
    </div>
  );
};

export default LawFirmPage;
