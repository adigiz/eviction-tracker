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
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";
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
  const [editableCaseDetailsInModal, setEditableCaseDetailsInModal] = useState<
    Partial<LegalCase>
  >({});
  const [copySuccess, setCopySuccess] = useState("");

  const [isAmendPaymentModalOpen, setIsAmendPaymentModalOpen] = useState(false);
  const [caseToAmend, setCaseToAmend] = useState<LegalCase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentNotes, setPaymentNotes] = useState("");
  const [amendError, setAmendError] = useState("");

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
    setEditableCaseDetailsInModal({ ...caseItem });
    setCopySuccess("");
    setIsDetailsModalOpen(true);
  };

  const handleModalInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditableCaseDetailsInModal((prev) => ({ ...prev, [name]: value }));
  };
  const handleModalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableCaseDetailsInModal((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : value,
    }));
  };

  const handleAdminUpdateCaseFromModal = () => {
    if (selectedCaseForDetails && editableCaseDetailsInModal) {
      let updatedCase = {
        ...selectedCaseForDetails,
        ...editableCaseDetailsInModal,
      } as LegalCase;
      if (typeof updatedCase.price === "string") {
        updatedCase.price =
          parseFloat(updatedCase.price) || selectedCaseForDetails.price;
      }
      handleAdminUpdateCase(updatedCase);
      setIsDetailsModalOpen(false);
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
    setPaymentAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
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
      setEditableCaseDetailsInModal(updatedCase);
    }
  };

  const handleAmendPayment = () => {
    if (!caseToAmend || paymentAmount === "" || Number(paymentAmount) <= 0) {
      setAmendError("Payment amount must be a positive number.");
      return;
    }
    const amountPaid = Number(paymentAmount);
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
      date: paymentDate,
      amount: amountPaid,
      notes: paymentNotes.trim() || undefined,
    };
    const updatedCase: LegalCase = {
      ...caseToAmend,
      currentRentOwed: currentOwed - amountPaid,
      paymentsMade: [...(caseToAmend.paymentsMade || []), newPaymentRec],
    };
    handleAdminUpdateCase(updatedCase);
    setIsAmendPaymentModalOpen(false);
    setCaseToAmend(null);
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

      {isDetailsModalOpen && selectedCaseForDetails && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Admin Edit: Case ${
            editableCaseDetailsInModal.districtCourtCaseNumber ||
            selectedCaseForDetails.id.substring(0, 8)
          }`}
          size="3xl"
        >
          <div className="space-y-4 p-4 text-gray-700 dark:text-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Client: {client?.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Case Status</label>
                <select
                  name="status"
                  value={editableCaseDetailsInModal.status}
                  onChange={handleModalInputChange}
                  className="input-sm"
                >
                  {Object.values(LegalCaseStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={editableCaseDetailsInModal.paymentStatus}
                  onChange={handleModalInputChange}
                  className="input-sm"
                >
                  {Object.values(PaymentStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Trial Date</label>
                <input
                  type="date"
                  name="trialDate"
                  value={editableCaseDetailsInModal.trialDate || ""}
                  onChange={handleModalDateChange}
                  className="input-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Notice Mailed Date
                </label>
                <input
                  type="date"
                  name="noticeMailedDate"
                  value={editableCaseDetailsInModal.noticeMailedDate || ""}
                  onChange={handleModalDateChange}
                  className="input-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Court Case Number (General)
                </label>
                <input
                  type="text"
                  name="courtCaseNumber"
                  value={editableCaseDetailsInModal.courtCaseNumber || ""}
                  onChange={handleModalInputChange}
                  className="input-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  District Court Case Number
                </label>
                <input
                  type="text"
                  name="districtCourtCaseNumber"
                  value={
                    editableCaseDetailsInModal.districtCourtCaseNumber || ""
                  }
                  onChange={handleModalInputChange}
                  className="input-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={editableCaseDetailsInModal.price ?? ""}
                  onChange={handleModalInputChange}
                  step="0.01"
                  className="input-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Current Rent Owed ($)
                </label>
                <input
                  type="number"
                  name="currentRentOwed"
                  value={editableCaseDetailsInModal.currentRentOwed ?? ""}
                  onChange={handleModalInputChange}
                  step="0.01"
                  className="input-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">
                Court Outcome Notes
              </label>
              <textarea
                name="courtOutcomeNotes"
                value={editableCaseDetailsInModal.courtOutcomeNotes || ""}
                onChange={handleModalInputChange}
                rows={3}
                className="input-sm"
              />
            </div>

            {selectedCaseForDetails.generatedDocuments.evictionNotice && (
              <div className="mt-2 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-900/50">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    AI-Generated Eviction Notice (Original)
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        selectedCaseForDetails.generatedDocuments
                          .evictionNotice!,
                        "Eviction Notice"
                      )
                    }
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto text-gray-600 dark:text-gray-300">
                  {selectedCaseForDetails.generatedDocuments.evictionNotice}
                </pre>
              </div>
            )}
            {selectedCaseForDetails.paymentStatus === PaymentStatus.PAID && (
              <button
                onClick={() =>
                  handleDownloadFinalNoticePDF(selectedCaseForDetails)
                }
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Download "Final Notice of Eviction Date" PDF
              </button>
            )}
            {copySuccess && (
              <p className="text-sm text-green-400 mt-1">{copySuccess}</p>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-300 dark:border-gray-700">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminUpdateCaseFromModal}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isAmendPaymentModalOpen && caseToAmend && (
        <Modal
          isOpen={isAmendPaymentModalOpen}
          onClose={() => setIsAmendPaymentModalOpen(false)}
          title={`Admin: Record Payment for Case ${
            caseToAmend.districtCourtCaseNumber ||
            caseToAmend.id.substring(0, 8)
          }`}
          size="md"
        >
          <div className="space-y-4 p-4 text-gray-700 dark:text-gray-200">
            {amendError && (
              <p className="text-sm text-red-300 bg-red-500/20 p-2 rounded-md">
                {amendError}
              </p>
            )}
            <p className="text-sm">
              Client: <strong>{client?.name}</strong>
            </p>
            <p className="text-sm">
              Current Amount Due:{" "}
              <strong>
                $
                {(
                  caseToAmend.currentRentOwed ?? caseToAmend.rentOwedAtFiling
                ).toFixed(2)}
              </strong>
            </p>
            <div>
              <label
                htmlFor="paymentAmount"
                className="block text-sm font-medium"
              >
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                min="0.01"
                step="0.01"
                required
                className="input-sm"
              />
            </div>
            <div>
              <label
                htmlFor="paymentDate"
                className="block text-sm font-medium"
              >
                Date Paid <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="paymentDate"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="input-sm"
              />
            </div>
            <div>
              <label
                htmlFor="paymentNotes"
                className="block text-sm font-medium"
              >
                Notes
              </label>
              <textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
                className="input-sm"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAmendPaymentModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAmendPayment}
                className="btn-amend"
              >
                Record Payment
              </button>
            </div>
          </div>
        </Modal>
      )}

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
