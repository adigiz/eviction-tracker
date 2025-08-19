import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import {
  LegalCase,
  Property,
  Tenant,
  LegalCaseStatus,
  PaymentStatus,
  PropertyType,
  PaymentRecord,
} from "../types";
import { AuthContext } from "../App";
import * as Storage from "../services/localStorageService";
import Modal from "../components/Modal";
import FailureToPayRentForm from "../components/forms/FailureToPayRentForm";
import LoadingSpinner from "../components/LoadingSpinner";
import { generateEvictionNoticeContent } from "../services/geminiService"; // Removed warrant/eviction generation

const statusColors: Record<LegalCaseStatus, string> = {
  [LegalCaseStatus.NOTICE_DRAFT]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200",
  [LegalCaseStatus.SUBMITTED]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
  [LegalCaseStatus.IN_PROGRESS]:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
  [LegalCaseStatus.COMPLETE]:
    "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200",
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]:
    "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
  [PaymentStatus.PENDING_PAYMENT]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200",
  [PaymentStatus.PAID]:
    "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200",
  [PaymentStatus.FAILED]:
    "bg-red-200 text-red-900 dark:bg-red-800/60 dark:text-red-200",
  [PaymentStatus.REFUNDED]:
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const CasesPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate(); // For redirecting to cart
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [isFTPRModalOpen, setIsFTPRModalOpen] = useState(false);

  const [isCaseDetailsModalOpen, setIsCaseDetailsModalOpen] = useState(false);
  const [currentCaseForDetails, setCurrentCaseForDetails] =
    useState<LegalCase | null>(null);
  const [copySuccess, setCopySuccess] = useState("");

  // Removed state and functions related to Amend Payment modal

  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [generalModalTitle, setGeneralModalTitle] = useState("");
  const [generalModalMessage, setGeneralModalMessage] = useState("");
  const [generalModalActions, setGeneralModalActions] =
    useState<React.ReactNode | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    if (auth?.currentUser) {
      const landlordId = auth.currentUser.id;
      setCases(
        Storage.getLegalCases(landlordId).sort(
          (a, b) =>
            new Date(b.dateInitiated).getTime() -
            new Date(a.dateInitiated).getTime()
        )
      );
      setProperties(Storage.getProperties(landlordId));
      setTenants(Storage.getTenants(landlordId));
    }
    setIsDataLoading(false);
  }, [auth?.currentUser]);

  useEffect(() => {
    if (isDataLoading) {
      return; // Wait for data to be loaded
    }
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("action") === "new_ftpr") {
      handleNewFTPRClick();
      // Remove the query parameter to prevent the modal from re-opening on re-renders
      navigate("/cases", { replace: true });
    }
  }, [isDataLoading, location.search, navigate]);

  const handleNewFTPRClick = () => {
    if (properties.length === 0 || tenants.length === 0) {
      setGeneralModalTitle("Unable to Start Request");
      setGeneralModalMessage(
        "Please add at least one property and one tenant before submitting a new eviction letter request."
      );
      setGeneralModalActions(
        <button
          onClick={() => {
            setIsGeneralModalOpen(false);
            navigate("/tenants?action=add");
          }}
          className="btn-primary"
        >
          Add Tenant/Property
        </button>
      );
      setIsGeneralModalOpen(true);
      return;
    }
    setIsFTPRModalOpen(true);
  };

  const handleFTPRSubmitSuccess = (newCase: LegalCase) => {
    Storage.addLegalCase(newCase);
    setCases((prev) =>
      [newCase, ...prev].sort(
        (a, b) =>
          new Date(b.dateInitiated).getTime() -
          new Date(a.dateInitiated).getTime()
      )
    );
    setIsFTPRModalOpen(false);

    setGeneralModalTitle("Request Added to Cart");
    setGeneralModalMessage(
      `Your request (Ref: ${newCase.id.substring(
        0,
        8
      )}) for $${newCase.price.toFixed(
        2
      )} has been added to your cart. Please proceed to payment to begin processing.`
    );
    setGeneralModalActions(
      <>
        <button
          onClick={() => {
            setIsGeneralModalOpen(false);
            navigate("/cart");
          }}
          className="btn-primary mr-2"
        >
          Go to Cart
        </button>
        <button
          onClick={() => setIsGeneralModalOpen(false)}
          className="btn-secondary"
        >
          Close
        </button>
      </>
    );
    setIsGeneralModalOpen(true);
    auth?.updateCartCount?.();
  };

  const openCaseDetailsModal = (caseItem: LegalCase) => {
    setCurrentCaseForDetails(caseItem);
    setCopySuccess(""); // Clear any previous copy messages
    setIsCaseDetailsModalOpen(true);
  };

  const handleDeleteDraft = (caseItem: LegalCase) => {
    if (
      caseItem.status === LegalCaseStatus.NOTICE_DRAFT &&
      caseItem.paymentStatus === PaymentStatus.UNPAID
    ) {
      if (
        window.confirm(
          `Are you sure you want to delete this draft (Ref: ${caseItem.id.substring(
            0,
            8
          )})? This action cannot be undone.`
        )
      ) {
        Storage.deleteLegalCase(caseItem.id);
        setCases((prev) =>
          prev
            .filter((c) => c.id !== caseItem.id)
            .sort(
              (a, b) =>
                new Date(b.dateInitiated).getTime() -
                new Date(a.dateInitiated).getTime()
            )
        );
        auth?.updateCartCount?.();
      }
    } else {
      alert("Only unpaid notice drafts can be deleted this way.");
    }
  };

  const handleGenerateInitialNoticeIfNeeded = async (
    caseItem: LegalCase
  ): Promise<LegalCase> => {
    if (
      caseItem.paymentStatus === PaymentStatus.PAID &&
      caseItem.status === LegalCaseStatus.SUBMITTED &&
      !caseItem.generatedDocuments.evictionNotice &&
      auth?.currentUser
    ) {
      // Find property and tenant for this specific case
      const property = properties.find((p) => p.id === caseItem.propertyId);
      const tenant = tenants.find((t) => t.id === caseItem.tenantId);
      if (property && tenant) {
        try {
          setIsLoadingAction(true);
          const noticeContent = await generateEvictionNoticeContent(
            auth.currentUser.name,
            property,
            tenant,
            caseItem.rentOwedAtFiling
          );
          const updatedCase = {
            ...caseItem,
            generatedDocuments: {
              ...caseItem.generatedDocuments,
              evictionNotice: noticeContent,
            },
          };
          Storage.updateLegalCase(updatedCase);
          setCases((prev) =>
            prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
          );
          setGeneralModalTitle("Notice Generated");
          setGeneralModalMessage(
            "The AI-generated Eviction Notice has been created and saved with the case."
          );
          setGeneralModalActions(
            <button
              onClick={() => setIsGeneralModalOpen(false)}
              className="btn-primary"
            >
              OK
            </button>
          );
          setIsGeneralModalOpen(true);
          // If the details modal is open for this case, update its content
          if (
            currentCaseForDetails &&
            currentCaseForDetails.id === updatedCase.id
          ) {
            setCurrentCaseForDetails(updatedCase);
          }
          return updatedCase;
        } catch (error) {
          alert(
            "Failed to generate initial Eviction notice. Please try again or contact support."
          );
        } finally {
          setIsLoadingAction(false);
        }
      }
    }
    return caseItem;
  };

  // Helper to get specific property and tenant for a case
  const getCaseDetails = (caseItem: LegalCase) => {
    const property = properties.find((p) => p.id === caseItem.propertyId);
    const tenant = tenants.find((t) => t.id === caseItem.tenantId);
    return { property, tenant };
  };

  const displayTenantNames = (names: string[] | undefined) =>
    names?.join(" & ") || "N/A";
  const formatDateForDisplay = (dateString?: string) =>
    dateString
      ? new Date(dateString + "T00:00:00").toLocaleDateString()
      : "N/A"; // Added T00:00:00 to ensure consistent date parsing

  const copyToClipboard = (textToCopy: string, type: string) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => setCopySuccess(`${type} copied to clipboard!`))
      .catch((err) => setCopySuccess(`Failed to copy ${type}.`));
    setCopySuccess("");
  };

  const handleSimulatedDownload = (filename?: string) => {
    if (filename) {
      alert(`Download started for ${filename}. (This is a simulation)`);
    } else {
      alert("No file to download. (This is a simulation)");
    }
  };

  if (!auth?.currentUser && isDataLoading)
    return <p className="p-4">Loading...</p>;

  // This function is no longer actively gating any specific buttons on this page after 'Record Payment' was removed.
  // It's kept for potential future use if actions are re-added.
  const isCaseActionable = (caseItem: LegalCase) => {
    // Example: could be used to enable/disable future actions based on status.
    // For now, it's true for non-draft and non-complete cases.
    return (
      caseItem.status !== LegalCaseStatus.NOTICE_DRAFT &&
      caseItem.status !== LegalCaseStatus.COMPLETE
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Eviction Letters
        </h1>
        <button
          onClick={handleNewFTPRClick}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center"
          aria-label="Submit New Request"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
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
          Submit New Request
        </button>
      </div>

      {isDataLoading ? (
        <LoadingSpinner text="Loading your requests..." />
      ) : cases.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No requests found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by submitting your first eviction letter request.
          </p>
          <button onClick={handleNewFTPRClick} className="mt-6 btn-primary">
            Submit New Request
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {cases.map((caseItem) => {
            const { property, tenant } = getCaseDetails(caseItem);
            const currentOwedDisplay =
              caseItem.currentRentOwed !== undefined
                ? caseItem.currentRentOwed
                : caseItem.rentOwedAtFiling;
            return (
              <div
                key={caseItem.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl dark:shadow-gray-900/50 dark:hover:shadow-gray-700/50 transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-400 mb-1">
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
                          "bg-gray-200 text-gray-800"
                        }`}
                      >
                        Case: {caseItem.status}
                      </span>
                      <span
                        className={`text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full ${
                          paymentStatusColors[caseItem.paymentStatus] ||
                          "bg-gray-200 text-gray-800"
                        }`}
                      >
                        Payment: {caseItem.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tenant: {displayTenantNames(tenant?.tenantNames)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Property: {property?.address}
                    {property?.unit ? `, ${property.unit}` : ""}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Amount Due (at submission): $
                    {caseItem.rentOwedAtFiling.toFixed(2)}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                    Current Amount Due: ${currentOwedDisplay.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Price: ${caseItem.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Initiated: {formatDateForDisplay(caseItem.dateInitiated)}
                  </p>

                  {caseItem.paymentStatus === PaymentStatus.PAID &&
                    caseItem.status === LegalCaseStatus.SUBMITTED &&
                    !caseItem.generatedDocuments.evictionNotice && (
                      <button
                        onClick={() =>
                          handleGenerateInitialNoticeIfNeeded(caseItem)
                        }
                        disabled={isLoadingAction}
                        className="mt-3 btn-secondary text-sm flex items-center"
                      >
                        {isLoadingAction ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path
                              fillRule="evenodd"
                              d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        Generate Initial Eviction Notice
                      </button>
                    )}
                  {caseItem.thirtyDayNoticeFileName &&
                    caseItem.status !== LegalCaseStatus.COMPLETE && ( // Show only if not complete, as completed cases will have it in new section
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Uploaded Eviction Notice (Admin):{" "}
                        {caseItem.thirtyDayNoticeFileName}
                      </p>
                    )}
                  {caseItem.paymentsMade &&
                    caseItem.paymentsMade.length > 0 && (
                      <div className="mt-2 text-xs">
                        <strong className="block mb-0.5">
                          Tenant Payments Recorded:
                        </strong>
                        {caseItem.paymentsMade.map((p, idx) => (
                          <span
                            key={idx}
                            className="block text-gray-600 dark:text-gray-400"
                          >
                            ${p.amount.toFixed(2)} on{" "}
                            {formatDateForDisplay(p.date)}{" "}
                            {p.notes ? `(${p.notes})` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 flex flex-wrap justify-end items-center gap-2">
                  {caseItem.paymentStatus === PaymentStatus.UNPAID &&
                    caseItem.status === LegalCaseStatus.NOTICE_DRAFT && (
                      <>
                        <button
                          onClick={() => navigate("/cart")}
                          className="btn-primary text-sm"
                        >
                          Go to Cart to Pay
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(caseItem)}
                          className="btn-delete text-sm"
                        >
                          Delete Draft
                        </button>
                      </>
                    )}
                  <button
                    onClick={() => openCaseDetailsModal(caseItem)}
                    className="btn-outline text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFTPRModalOpen && (
        <Modal
          isOpen={isFTPRModalOpen}
          onClose={() => setIsFTPRModalOpen(false)}
          title="New Eviction Letter Request"
          size="2xl"
        >
          <FailureToPayRentForm
            onSubmitSuccess={handleFTPRSubmitSuccess}
            onCancel={() => setIsFTPRModalOpen(false)}
            properties={properties}
            tenants={tenants}
            cases={cases}
          />
        </Modal>
      )}

      {isCaseDetailsModalOpen && currentCaseForDetails && (
        <Modal
          isOpen={isCaseDetailsModalOpen}
          onClose={() => setIsCaseDetailsModalOpen(false)}
          title={`Details: Case ${
            currentCaseForDetails.districtCourtCaseNumber ||
            currentCaseForDetails.id.substring(0, 8)
          }`}
          size="2xl"
        >
          <div className="space-y-3 p-1 text-gray-900 dark:text-gray-200">
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`text-xs font-semibold py-0.5 px-1.5 uppercase rounded-full ${
                  statusColors[currentCaseForDetails.status]
                }`}
              >
                {currentCaseForDetails.status}
              </span>
            </p>
            <p>
              <strong>Payment Status:</strong>{" "}
              <span
                className={`text-xs font-semibold py-0.5 px-1.5 uppercase rounded-full ${
                  paymentStatusColors[currentCaseForDetails.paymentStatus]
                }`}
              >
                {currentCaseForDetails.paymentStatus}
              </span>
            </p>
            <p>
              <strong>Price:</strong> ${currentCaseForDetails.price.toFixed(2)}
            </p>
            <p>
              <strong>Amount Due (at submission):</strong> $
              {currentCaseForDetails.rentOwedAtFiling.toFixed(2)}
            </p>
            <p>
              <strong>Current Amount Due:</strong> $
              {(
                currentCaseForDetails.currentRentOwed ??
                currentCaseForDetails.rentOwedAtFiling
              ).toFixed(2)}
            </p>
            <p>
              <strong>Initiated:</strong>{" "}
              {formatDateForDisplay(currentCaseForDetails.dateInitiated)}
            </p>
            <p>
              <strong>District Court Case #:</strong>{" "}
              {currentCaseForDetails.districtCourtCaseNumber || "N/A"}
            </p>
            <p>
              <strong>Warrant Ordered:</strong>{" "}
              {formatDateForDisplay(currentCaseForDetails.warrantOrderDate)}
            </p>
            <p>
              <strong>Initial Eviction Date:</strong>{" "}
              {formatDateForDisplay(currentCaseForDetails.initialEvictionDate)}
            </p>

            {/* This section was for AI generated notice, removed as per user request from here */}
            {/* {currentCaseForDetails.generatedDocuments.evictionNotice ... } */}

            {currentCaseForDetails.thirtyDayNoticeFileName &&
              currentCaseForDetails.status !== LegalCaseStatus.COMPLETE && (
                <p>
                  <strong>Uploaded Eviction Notice (Admin):</strong>{" "}
                  {currentCaseForDetails.thirtyDayNoticeFileName}
                </p>
              )}
            {currentCaseForDetails.courtCaseNumber && (
              <p>
                <strong>Court Case Number (General):</strong>{" "}
                {currentCaseForDetails.courtCaseNumber}
              </p>
            )}
            {currentCaseForDetails.trialDate && (
              <p>
                <strong>Trial Date:</strong>{" "}
                {formatDateForDisplay(currentCaseForDetails.trialDate)}
              </p>
            )}
            {currentCaseForDetails.courtOutcomeNotes && (
              <p>
                <strong>Court Outcome Notes:</strong>{" "}
                {currentCaseForDetails.courtOutcomeNotes}
              </p>
            )}

            {/* Section for Archived AI-Generated Documents (if any exist from past states) */}
            {currentCaseForDetails.generatedDocuments.warrantRequest && (
              <div className="mt-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-semibold">
                    Archived: AI-Generated Warrant Request
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        currentCaseForDetails.generatedDocuments
                          .warrantRequest!,
                        "Warrant Request"
                      )
                    }
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">
                  {currentCaseForDetails.generatedDocuments.warrantRequest}
                </pre>
              </div>
            )}
            {currentCaseForDetails.generatedDocuments.evictionRequest && (
              <div className="mt-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-semibold">
                    Archived: AI-Generated Eviction Posting Request
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        currentCaseForDetails.generatedDocuments
                          .evictionRequest!,
                        "Eviction Posting Request"
                      )
                    }
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    Copy
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">
                  {currentCaseForDetails.generatedDocuments.evictionRequest}
                </pre>
              </div>
            )}

            {/* New section for uploaded documents for COMPLETED cases */}
            {currentCaseForDetails.status === LegalCaseStatus.COMPLETE && (
              <div className="mt-4 pt-3 border-t dark:border-gray-700">
                <h4 className="text-md font-semibold mb-2">
                  Uploaded Case Documents
                </h4>
                <ul className="space-y-2 text-sm">
                  {currentCaseForDetails.thirtyDayNoticeFileName && (
                    <li className="flex justify-between items-center">
                      <span>
                        Eviction Notice:{" "}
                        {currentCaseForDetails.thirtyDayNoticeFileName}
                      </span>
                      <button
                        onClick={() =>
                          handleSimulatedDownload(
                            currentCaseForDetails.thirtyDayNoticeFileName
                          )
                        }
                        className="btn-secondary text-xs"
                      >
                        Download (Simulated)
                      </button>
                    </li>
                  )}
                  {currentCaseForDetails.uploadedDocument1FileName && (
                    <li className="flex justify-between items-center">
                      <span>
                        Certificate of Mailing:{" "}
                        {currentCaseForDetails.uploadedDocument1FileName}
                      </span>
                      <button
                        onClick={() =>
                          handleSimulatedDownload(
                            currentCaseForDetails.uploadedDocument1FileName
                          )
                        }
                        className="btn-secondary text-xs"
                      >
                        Download (Simulated)
                      </button>
                    </li>
                  )}
                  {currentCaseForDetails.uploadedPhotoFileName && (
                    <li className="flex justify-between items-center">
                      <span>
                        Photo: {currentCaseForDetails.uploadedPhotoFileName}
                      </span>
                      <button
                        onClick={() =>
                          handleSimulatedDownload(
                            currentCaseForDetails.uploadedPhotoFileName
                          )
                        }
                        className="btn-secondary text-xs"
                      >
                        Download (Simulated)
                      </button>
                    </li>
                  )}
                  {currentCaseForDetails.uploadedReceiptFileName && (
                    <li className="flex justify-between items-center">
                      <span>
                        Receipt: {currentCaseForDetails.uploadedReceiptFileName}
                      </span>
                      <button
                        onClick={() =>
                          handleSimulatedDownload(
                            currentCaseForDetails.uploadedReceiptFileName
                          )
                        }
                        className="btn-secondary text-xs"
                      >
                        Download (Simulated)
                      </button>
                    </li>
                  )}
                  {/* uploadedDocument2FileName is not shown as it was removed from admin uploads */}
                  {!(
                    currentCaseForDetails.thirtyDayNoticeFileName ||
                    currentCaseForDetails.uploadedDocument1FileName ||
                    currentCaseForDetails.uploadedPhotoFileName ||
                    currentCaseForDetails.uploadedReceiptFileName
                  ) && (
                    <li>
                      No uploaded documents found for this completed case.
                    </li>
                  )}
                </ul>
              </div>
            )}

            {copySuccess && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {copySuccess}
              </p>
            )}
            <button
              onClick={() => setIsCaseDetailsModalOpen(false)}
              className="btn-secondary text-sm mt-4"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {isGeneralModalOpen && (
        <Modal
          isOpen={isGeneralModalOpen}
          onClose={() => setIsGeneralModalOpen(false)}
          title={generalModalTitle}
          size="md"
        >
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            {generalModalMessage}
          </p>
          {generalModalActions && (
            <div className="flex justify-end space-x-2">
              {generalModalActions}
            </div>
          )}
        </Modal>
      )}

      <style>{`
        .btn-primary { 
          @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-60; 
        }
        .btn-secondary { 
          @apply py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-60;
        }
        .btn-outline { 
          @apply py-2 px-4 bg-transparent rounded-md hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors disabled:opacity-60 border border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400;
        }
        .btn-delete { 
          @apply py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-60;
        }
        .input-sm { @apply mt-1 block w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200; }
      `}</style>
    </div>
  );
};

export default CasesPage;
