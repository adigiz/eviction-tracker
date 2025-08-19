import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  LegalCase,
  User,
  Property,
  Tenant,
  LegalCaseStatus,
  PaymentStatus,
} from "../../types";
import * as Storage from "../../services/localStorageService";
import { AuthContext } from "../../App";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminCaseDetailsModal from "../../components/forms/AdminCaseDetailsModal";
import {
  generateFinalNoticeOfEvictionDatePDF,
  generateBulkFinalNoticeOfEvictionDatePDF,
} from "../../services/pdfService";
import { errorService } from "../../services/errorService";

const statusColors: Record<LegalCaseStatus, string> = {
  [LegalCaseStatus.NOTICE_DRAFT]: "bg-yellow-100 text-yellow-800",
  [LegalCaseStatus.SUBMITTED]: "bg-blue-100 text-blue-800",
  [LegalCaseStatus.IN_PROGRESS]: "bg-indigo-100 text-indigo-800",
  [LegalCaseStatus.COMPLETE]: "bg-green-100 text-green-800",
};

const paymentStatusColorsAdmin: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: "bg-red-100 text-red-800",
  [PaymentStatus.PENDING_PAYMENT]: "bg-yellow-100 text-yellow-800",
  [PaymentStatus.PAID]: "bg-green-100 text-green-800",
  [PaymentStatus.FAILED]: "bg-red-200 text-red-900",
  [PaymentStatus.REFUNDED]: "bg-gray-100 text-gray-800",
};

const AdminAllCasesPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [allCases, setAllCases] = useState<LegalCase[]>([]);
  const [allLandlords, setAllLandlords] = useState<User[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [allContractors, setAllContractors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [selectedCaseLandlord, setSelectedCaseLandlord] = useState<User | null>(
    null
  );
  const [selectedCaseProperty, setSelectedCaseProperty] =
    useState<Property | null>(null);
  const [selectedCaseTenant, setSelectedCaseTenant] = useState<Tenant | null>(
    null
  );

  const [bulkPdfStartDate, setBulkPdfStartDate] = useState("");
  const [bulkPdfEndDate, setBulkPdfEndDate] = useState("");

  useEffect(() => {
    if (auth?.currentUser?.role === "admin") {
      setAllCases(
        Storage.getAllLegalCasesForAdmin().sort(
          (a, b) =>
            new Date(b.dateInitiated).getTime() -
            new Date(a.dateInitiated).getTime()
        )
      );
      setAllLandlords(Storage.getAllLandlordUsers());
      setAllProperties(Storage.getAllPropertiesForAdmin());
      setAllTenants(Storage.getAllTenantsForAdmin());
      setAllContractors(Storage.getAllContractorUsers());
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [auth?.currentUser]);

  const getLandlordName = (landlordId: string) =>
    allLandlords.find((l) => l.id === landlordId)?.name || "N/A";
  const getContractorName = (contractorId?: string) =>
    allContractors.find((c) => c.id === contractorId)?.name || "N/A";
  const getPropertyAddress = (propertyId: string) => {
    const prop = allProperties.find((p) => p.id === propertyId);
    return prop
      ? `${prop.address}${prop.unit ? `, ${prop.unit}` : ""}, ${prop.city}`
      : "N/A";
  };
  const getTenantNames = (tenantId: string) => {
    const tenant = allTenants.find((t) => t.id === tenantId);
    return tenant?.tenantNames?.join(" & ") || "N/A";
  };

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString + "T00:00:00").toLocaleDateString();
  };

  const handleViewDetails = (caseItem: LegalCase) => {
    setSelectedCase(caseItem);
    setSelectedCaseLandlord(
      allLandlords.find((l) => l.id === caseItem.landlordId) || null
    );
    setSelectedCaseProperty(
      allProperties.find((p) => p.id === caseItem.propertyId) || null
    );
    setSelectedCaseTenant(
      allTenants.find((t) => t.id === caseItem.tenantId) || null
    );
    setIsDetailsModalOpen(true);
  };

  const handleSaveCaseDetails = (updatedCase: LegalCase) => {
    Storage.updateLegalCase(updatedCase);
    setAllCases((prevCases) =>
      prevCases
        .map((c) => (c.id === updatedCase.id ? updatedCase : c))
        .sort(
          (a, b) =>
            new Date(b.dateInitiated).getTime() -
            new Date(a.dateInitiated).getTime()
        )
    );
    setIsDetailsModalOpen(false);
    setSelectedCase(null);
    errorService.showSuccess("Case details updated by Admin.");
  };

  const handleDownloadFinalNoticePDF = (caseItem: LegalCase) => {
    if (caseItem.paymentStatus !== PaymentStatus.PAID) {
      errorService.showWarning(
        "This notice can only be generated for paid cases."
      );
      return;
    }
    if (!auth?.currentUser) {
      errorService.showError("Admin user not found.");
      return;
    }
    const property = allProperties.find((p) => p.id === caseItem.propertyId);
    const tenant = allTenants.find((t) => t.id === caseItem.tenantId);
    const landlord = allLandlords.find((l) => l.id === caseItem.landlordId);

    if (property && tenant && landlord) {
      generateFinalNoticeOfEvictionDatePDF(
        caseItem,
        property,
        tenant,
        landlord,
        auth.currentUser
      );
    } else {
      errorService.showError(
        "Could not find all necessary data (property, tenant, or landlord) to generate the PDF."
      );
    }
  };

  const handleBulkDownloadPDFs = () => {
    if (!bulkPdfStartDate || !bulkPdfEndDate) {
      errorService.showWarning(
        "Please select both a start and end date for the bulk download."
      );
      return;
    }
    if (!auth?.currentUser) {
      errorService.showError("Admin user not found.");
      return;
    }

    const startDate = new Date(bulkPdfStartDate + "T00:00:00");
    const endDate = new Date(bulkPdfEndDate + "T23:59:59");

    const filteredCases = allCases.filter((c) => {
      const caseDate = new Date(c.dateInitiated + "T00:00:00");
      return (
        c.paymentStatus === PaymentStatus.PAID &&
        caseDate >= startDate &&
        caseDate <= endDate
      );
    });

    if (filteredCases.length === 0) {
      errorService.showWarning(
        "No paid cases found in the selected date range."
      );
      return;
    }

    // Prepare maps for efficient lookup
    const propertiesMap = new Map<string, Property>(
      allProperties.map((p) => [p.id, p])
    );
    const tenantsMap = new Map<string, Tenant>(
      allTenants.map((t) => [t.id, t])
    );
    const landlordsMap = new Map<string, User>(
      allLandlords.map((l) => [l.id, l])
    );

    generateBulkFinalNoticeOfEvictionDatePDF(
      filteredCases,
      propertiesMap,
      tenantsMap,
      landlordsMap,
      auth.currentUser
    );
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading all cases..." size="lg" />;
  }

  if (auth?.currentUser?.role !== "admin") {
    return (
      <p className="p-8 text-center text-red-500">
        Access Denied. Admin privileges required.
      </p>
    );
  }

  const documentFieldsConfig: { key: keyof LegalCase; label: string }[] = [
    { key: "thirtyDayNoticeFileName", label: "Eviction Notice" },
    { key: "uploadedPhotoFileName", label: "Photo" },
    { key: "uploadedReceiptFileName", label: "Receipt" },
    { key: "uploadedDocument1FileName", label: "Certificate of Mailing" },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        All Client Submissions
      </h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Bulk Download Final Eviction Date Notices
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Select a date range to download notices for all paid cases initiated
          within that period. Each notice will be on a new page in a single PDF.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="bulkPdfStartDate"
              className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2"
            >
              Start Date
            </label>
            <input
              type="date"
              id="bulkPdfStartDate"
              name="bulkPdfStartDate"
              value={bulkPdfStartDate}
              onChange={(e) => setBulkPdfStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="bulkPdfEndDate"
              className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2"
            >
              End Date
            </label>
            <input
              type="date"
              id="bulkPdfEndDate"
              name="bulkPdfEndDate"
              value={bulkPdfEndDate}
              onChange={(e) => setBulkPdfEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            />
          </div>
          <button
            onClick={handleBulkDownloadPDFs}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md h-fit transition-colors focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            disabled={!bulkPdfStartDate || !bulkPdfEndDate}
          >
            Download for Range
          </button>
        </div>
      </div>

      {allCases.length === 0 ? (
        <p className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-600 dark:text-gray-300">
          No submissions found across all clients.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Case No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Contractor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Initiated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allCases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 font-mono">
                    {caseItem.districtCourtCaseNumber ||
                      caseItem.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                    {getLandlordName(caseItem.landlordId)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                    {getPropertyAddress(caseItem.propertyId)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                        statusColors[caseItem.status] ||
                        "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {caseItem.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {caseItem.contractorId ? (
                      getContractorName(caseItem.contractorId)
                    ) : (
                      <span className="text-gray-500 dark:text-gray-500 italic">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(caseItem.dateInitiated).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(caseItem)}
                      className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 group relative"
                      title="View/Edit Case Details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="sr-only">View/Edit</span>
                    </button>
                    {caseItem.paymentStatus === PaymentStatus.PAID && (
                      <button
                        onClick={() => handleDownloadFinalNoticePDF(caseItem)}
                        className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 group relative"
                        title="Download Final Notice PDF"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="sr-only">Download Notice</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isDetailsModalOpen &&
        selectedCase &&
        selectedCaseLandlord &&
        selectedCaseProperty &&
        selectedCaseTenant && (
          <AdminCaseDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            caseItem={selectedCase}
            landlord={selectedCaseLandlord}
            property={selectedCaseProperty}
            tenant={selectedCaseTenant}
            allContractors={allContractors}
            onSave={handleSaveCaseDetails}
          />
        )}
    </div>
  );
};

export default AdminAllCasesPage;
