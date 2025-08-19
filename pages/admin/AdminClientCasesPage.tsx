import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  LegalCase,
  Property,
  Tenant,
  LegalCaseStatus,
  User,
  PaymentRecord,
  PaymentStatus,
} from "../../types";
import { AuthContext } from "../../App";
import * as Storage from "../../services/localStorageService";
import LoadingSpinner from "../../components/LoadingSpinner";
import CaseDetailsModal from "../../components/forms/CaseDetailsModal";
import PaymentAmendmentModal from "../../components/forms/PaymentAmendmentModal";
import {
  CaseDetailsFormData,
  PaymentAmendmentFormData,
} from "../../lib/validations";
import { generateFinalNoticeOfEvictionDatePDF } from "../../services/pdfService";

const statusColors: Record<LegalCaseStatus, string> = {
  [LegalCaseStatus.NOTICE_DRAFT]: "bg-yellow-100 text-yellow-800",
  [LegalCaseStatus.SUBMITTED]: "bg-blue-100 text-blue-800",
  [LegalCaseStatus.IN_PROGRESS]: "bg-indigo-100 text-indigo-800",
  [LegalCaseStatus.COMPLETE]: "bg-green-100 text-green-800",
};

const paymentStatusColorsAdminClient: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: "bg-red-100 text-red-800",
  [PaymentStatus.PENDING_PAYMENT]: "bg-yellow-100 text-yellow-800",
  [PaymentStatus.PAID]: "bg-green-100 text-green-800",
  [PaymentStatus.FAILED]: "bg-red-200 text-red-900",
  [PaymentStatus.REFUNDED]: "bg-gray-100 text-gray-800",
};

const AdminClientCasesPage: React.FC = () => {
  const { landlordId } = useParams<{ landlordId: string }>();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [client, setClient] = useState<User | null>(null);
  const [clientCases, setClientCases] = useState<LegalCase[]>([]);
  const [clientProperties, setClientProperties] = useState<Property[]>([]);
  const [clientTenants, setClientTenants] = useState<Tenant[]>([]);
  const [allContractors, setAllContractors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCaseForDetails, setSelectedCaseForDetails] =
    useState<LegalCase | null>(null);
  const [copySuccess, setCopySuccess] = useState("");

  const [isAmendPaymentModalOpen, setIsAmendPaymentModalOpen] = useState(false);
  const [caseToAmend, setCaseToAmend] = useState<LegalCase | null>(null);
  const [amendError, setAmendError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (auth?.currentUser?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    if (!landlordId) {
      navigate("/admin/clients");
      return;
    }

    const allUsers = Storage.getAllRegisteredUsers();
    const targetClient = allUsers.find(
      (u) => u.id === landlordId && u.role === "landlord"
    );

    if (!targetClient) {
      setIsLoading(false);
      return;
    }

    setClient(targetClient);
    setClientCases(
      Storage.getLegalCases(landlordId).sort(
        (a, b) =>
          new Date(b.dateInitiated).getTime() -
          new Date(a.dateInitiated).getTime()
      )
    );
    setClientProperties(Storage.getProperties(landlordId));
    setClientTenants(Storage.getTenants(landlordId));
    setAllContractors(Storage.getAllContractorUsers());
    setIsLoading(false);
  }, [auth?.currentUser, landlordId, navigate]);

  const getCaseDetails = (caseItem: LegalCase) => {
    const property = clientProperties.find((p) => p.id === caseItem.propertyId);
    const tenant = clientTenants.find((t) => t.id === caseItem.tenantId);
    return { property, tenant };
  };

  const getContractorName = (contractorId?: string) =>
    allContractors.find((c) => c.id === contractorId)?.name || "N/A";
  const displayTenantNames = (names: string[] | undefined) =>
    names?.join(" & ") || "N/A";
  const formatDateForDisplay = (dateString?: string) =>
    dateString
      ? new Date(dateString + "T00:00:00").toLocaleDateString()
      : "N/A";

  const copyToClipboard = (textToCopy: string, type: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => setCopySuccess(`${type} copied!`))
      .catch((err) => setCopySuccess(`Failed to copy ${type}.`));
    setCopySuccess("");
  };

  const openCaseDetailsModal = (caseItem: LegalCase) => {
    setSelectedCaseForDetails(caseItem);
    setCopySuccess("");
    setIsDetailsModalOpen(true);
  };

  const handleCaseDetailsUpdate = async (data: CaseDetailsFormData) => {
    try {
      setIsSaving(true);
      if (selectedCaseForDetails) {
        const updatedCase: LegalCase = {
          ...selectedCaseForDetails,
          status: data.status,
          paymentStatus: data.paymentStatus,
          trialDate: data.trialDate || undefined,
          districtCourtCaseNumber: data.districtCourtCaseNumber || undefined,
          contractorId: data.contractorId || undefined,
          courtOutcomeNotes: data.courtOutcomeNotes || undefined,
        };
        Storage.updateLegalCase(updatedCase);
        setClientCases((prev) =>
          prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
        );
      }
    } catch (error) {
      console.error("Failed to update case details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const openAmendPaymentModal = (caseItem: LegalCase) => {
    if (caseItem.paymentStatus !== PaymentStatus.PAID) {
      alert(
        "Client must complete payment for this request before tenant payments can be recorded by Admin."
      );
      return;
    }
    if (
      caseItem.status !== LegalCaseStatus.SUBMITTED &&
      caseItem.status !== LegalCaseStatus.IN_PROGRESS
    ) {
      alert(
        "Payments can only be recorded for cases that are Submitted or In Progress."
      );
      return;
    }
    setCaseToAmend(caseItem);
    setAmendError("");
    setIsAmendPaymentModalOpen(true);
  };

  const handleAdminUpdateCase = (updatedCase: LegalCase) => {
    Storage.updateLegalCase(updatedCase);
    setClientCases((prev) =>
      prev
        .map((c) => (c.id === updatedCase.id ? updatedCase : c))
        .sort(
          (a, b) =>
            new Date(b.dateInitiated).getTime() -
            new Date(a.dateInitiated).getTime()
        )
    );
    if (
      selectedCaseForDetails &&
      selectedCaseForDetails.id === updatedCase.id
    ) {
      setSelectedCaseForDetails(updatedCase);
    }
  };

  const handlePaymentAmendment = async (data: PaymentAmendmentFormData) => {
    try {
      setIsSaving(true);
      if (!caseToAmend) return;

      const amountPaid = data.paymentAmount;
      const currentOwed =
        caseToAmend.currentRentOwed ?? caseToAmend.rentOwedAtFiling;

      if (amountPaid > currentOwed) {
        setAmendError(
          `Payment amount ($${amountPaid.toFixed(
            2
          )}) cannot exceed current amount owed ($${currentOwed.toFixed(2)}).`
        );
        return;
      }

      const newPaymentRec: PaymentRecord = {
        date: data.paymentDate,
        amount: amountPaid,
        notes: data.paymentNotes || "",
      };

      const updatedCase: LegalCase = {
        ...caseToAmend,
        currentRentOwed: currentOwed - amountPaid,
        paymentRecords: [...(caseToAmend.paymentRecords || []), newPaymentRec],
      };

      Storage.updateLegalCase(updatedCase);
      setClientCases((prev) =>
        prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
      );
      setIsAmendPaymentModalOpen(false);
    } catch (error) {
      console.error("Failed to amend payment:", error);
      setAmendError("Failed to amend payment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminStatusUpdate = (
    caseItem: LegalCase,
    newStatus: LegalCaseStatus
  ) => {
    if (
      window.confirm(
        `ADMIN ACTION: Update status of Case ${
          caseItem.districtCourtCaseNumber || caseItem.id.substring(0, 8)
        } to "${newStatus}" for client ${client?.name}?`
      )
    ) {
      const updatedCase: LegalCase = { ...caseItem, status: newStatus };
      handleAdminUpdateCase(updatedCase);
    }
  };

  const handleDownloadFinalNoticePDF = (caseItem: LegalCase) => {
    if (caseItem.paymentStatus !== PaymentStatus.PAID) {
      alert("This notice can only be generated for paid cases.");
      return;
    }
    if (!auth?.currentUser || !client) {
      // client should be non-null here
      alert("Admin user or client data not found.");
      return;
    }
    const property = clientProperties.find((p) => p.id === caseItem.propertyId);
    const tenant = clientTenants.find((t) => t.id === caseItem.tenantId);

    if (property && tenant) {
      generateFinalNoticeOfEvictionDatePDF(
        caseItem,
        property,
        tenant,
        client,
        auth.currentUser
      );
    } else {
      alert(
        "Could not find all necessary data (property or tenant) to generate the PDF."
      );
    }
  };

  if (isLoading)
    return <LoadingSpinner text={`Loading cases for client...`} size="lg" />;
  if (!client)
    return (
      <p className="p-8 text-center text-red-500">
        Client not found or access denied.
      </p>
    );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Link
          to="/admin/clients"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          &larr; Back to Clients List
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">
          Cases for Client: {client.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Username: {client.username} (Admin View)
        </p>
      </div>

      {clientCases.length === 0 ? (
        <p className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          This client has no eviction letter requests.
        </p>
      ) : (
        <div className="space-y-6">
          {clientCases.map((caseItem) => {
            const { property, tenant } = getCaseDetails(caseItem);
            const currentOwedDisplay =
              caseItem.currentRentOwed !== undefined
                ? caseItem.currentRentOwed
                : caseItem.rentOwedAtFiling;
            const canAmend =
              caseItem.paymentStatus === PaymentStatus.PAID &&
              (caseItem.status === LegalCaseStatus.SUBMITTED ||
                caseItem.status === LegalCaseStatus.IN_PROGRESS);
            return (
              <div
                key={caseItem.id}
                className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold text-primary-400 mb-1">
                        Case Number:{" "}
                        <span className="font-mono">
                          {caseItem.districtCourtCaseNumber ||
                            caseItem.id.substring(0, 8)}
                        </span>
                      </h2>
                    </div>
                    <div className="flex flex-col items-start sm:items-end space-y-1 mt-2 sm:mt-0">
                      <span
                        className={`text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full ${
                          statusColors[caseItem.status] ||
                          "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Case Status: {caseItem.status}
                      </span>
                      <span
                        className={`text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full ${
                          paymentStatusColorsAdminClient[
                            caseItem.paymentStatus
                          ] ||
                          "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Payment: {caseItem.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="my-2 flex flex-wrap gap-2 items-center">
                    <label
                      htmlFor={`status-select-${caseItem.id}`}
                      className="text-xs sr-only"
                    >
                      Update Status
                    </label>
                    <select
                      id={`status-select-${caseItem.id}`}
                      value={caseItem.status}
                      onChange={(e) =>
                        handleAdminStatusUpdate(
                          caseItem,
                          e.target.value as LegalCaseStatus
                        )
                      }
                      className="text-xs p-1 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                      title="Admin: Quickly update status"
                    >
                      {Object.values(LegalCaseStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => openAmendPaymentModal(caseItem)}
                      className="text-xs btn-amend-badge"
                      disabled={!canAmend}
                      title={
                        !canAmend
                          ? "Case must be Paid and Submitted/In Progress to record payments"
                          : "Record Tenant Payment"
                      }
                    >
                      Record Payment
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tenant: {displayTenantNames(tenant?.tenantNames)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Property: {property?.address}
                    {property?.unit ? `, ${property.unit}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contractor:{" "}
                    {caseItem.contractorId ? (
                      getContractorName(caseItem.contractorId)
                    ) : (
                      <span className="text-gray-500 dark:text-gray-500 italic">
                        Unassigned
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Amount Due (submitted): $
                    {caseItem.rentOwedAtFiling.toFixed(2)}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Current Amount Due: ${currentOwedDisplay.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Price: ${caseItem.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Initiated: {formatDateForDisplay(caseItem.dateInitiated)}
                  </p>
                  {caseItem.thirtyDayNoticeFileName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      30-Day Notice: {caseItem.thirtyDayNoticeFileName}
                    </p>
                  )}
                  {caseItem.trialDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Trial Date: {formatDateForDisplay(caseItem.trialDate)}
                    </p>
                  )}
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 p-4 flex justify-end space-x-2">
                  {caseItem.paymentStatus === PaymentStatus.PAID && (
                    <button
                      onClick={() => handleDownloadFinalNoticePDF(caseItem)}
                      className="text-xs btn-outline !text-green-600 dark:!text-green-400 border-green-500 hover:bg-green-500/10"
                    >
                      Download Eviction Date Notice
                    </button>
                  )}
                  <button
                    onClick={() => openCaseDetailsModal(caseItem)}
                    className="text-xs btn-outline !text-gray-600 dark:!text-gray-300"
                  >
                    View/Edit Details (Admin)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CaseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        caseItem={selectedCaseForDetails!}
        onSubmit={handleCaseDetailsUpdate}
        formError=""
        isSaving={isSaving}
      />

      <PaymentAmendmentModal
        isOpen={isAmendPaymentModalOpen}
        onClose={() => setIsAmendPaymentModalOpen(false)}
        caseItem={caseToAmend!}
        onSubmit={handlePaymentAmendment}
        formError={amendError}
        isSaving={isSaving}
      />

      <style>{`
        .btn-outline { @apply py-1 px-3 border border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors; }
        .btn-primary { @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors; }
        .btn-secondary { @apply py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors; }
        .btn-amend { @apply py-2 px-4 bg-yellow-500 text-yellow-900 rounded-md hover:bg-yellow-600 transition-colors; }
        .btn-amend-badge { @apply py-1 px-2 text-xs bg-yellow-500 text-yellow-900 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:bg-yellow-800 disabled:text-yellow-400; }
                        .input-sm { @apply mt-1 block w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors; }
      `}</style>
    </div>
  );
};

export default AdminClientCasesPage;
