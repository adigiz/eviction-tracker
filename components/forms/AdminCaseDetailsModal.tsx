import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import {
  LegalCase,
  User,
  Property,
  Tenant,
  LegalCaseStatus,
  PaymentStatus,
} from "../../types";
import { errorService } from "../../services/errorService";

interface AdminCaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: LegalCase;
  landlord: User;
  property: Property;
  tenant: Tenant;
  allContractors: User[];
  onSave: (updatedCase: LegalCase) => void;
}

const AdminCaseDetailsModal: React.FC<AdminCaseDetailsModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  landlord,
  property,
  tenant,
  allContractors,
  onSave,
}) => {
  const [editableCaseDetails, setEditableCaseDetails] = useState<
    Partial<LegalCase>
  >({});

  useEffect(() => {
    if (caseItem) {
      setEditableCaseDetails({ ...caseItem });
    }
  }, [caseItem]);

  const handleModalInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditableCaseDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableCaseDetails((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : value,
    }));
  };

  const handleFileUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof LegalCase
  ) => {
    const file = e.target.files?.[0];
    setEditableCaseDetails((prev) => ({
      ...prev,
      [fileType]: file ? file.name : undefined,
    }));
  };

  const handleMarkAsCompleted = () => {
    setEditableCaseDetails((prev) => ({
      ...prev,
      status: LegalCaseStatus.COMPLETE,
    }));
  };

  const handleSaveCaseDetails = () => {
    if (editableCaseDetails) {
      // User requested check: All 4 docs must be present to mark as 'Complete'
      if (editableCaseDetails.status === LegalCaseStatus.COMPLETE) {
        const allDocsUploaded =
          !!editableCaseDetails.thirtyDayNoticeFileName &&
          !!editableCaseDetails.uploadedPhotoFileName &&
          !!editableCaseDetails.uploadedReceiptFileName &&
          !!editableCaseDetails.uploadedDocument1FileName;

        if (!allDocsUploaded) {
          errorService.showWarning(
            "Cannot save as 'Complete'. All 4 required documents must be uploaded first."
          );
          return; // Stop the save
        }
      }

      const updatedCaseData = {
        ...caseItem,
        ...editableCaseDetails,
      } as LegalCase;

      onSave(updatedCaseData);
      onClose();
    }
  };

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString + "T00:00:00").toLocaleDateString();
  };

  const documentFieldsConfig: { key: keyof LegalCase; label: string }[] = [
    { key: "thirtyDayNoticeFileName", label: "Eviction Notice" },
    { key: "uploadedPhotoFileName", label: "Photo" },
    { key: "uploadedReceiptFileName", label: "Receipt" },
    { key: "uploadedDocument1FileName", label: "Certificate of Mailing" },
  ];

  const areAllDocumentsUploaded =
    !!editableCaseDetails.thirtyDayNoticeFileName &&
    !!editableCaseDetails.uploadedPhotoFileName &&
    !!editableCaseDetails.uploadedReceiptFileName &&
    !!editableCaseDetails.uploadedDocument1FileName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Case Details: ${
        editableCaseDetails.districtCourtCaseNumber ||
        caseItem.id.substring(0, 8)
      } (Admin Edit)`}
      size="4xl"
    >
      <div className="space-y-6 p-2 text-gray-700 dark:text-gray-300 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-900/50">
          <p className="text-gray-800 dark:text-gray-200">
            <strong>Client:</strong> {landlord.name} ({landlord.username})
          </p>
          <p className="text-gray-800 dark:text-gray-200">
            <strong>Property:</strong> {property.address}
            {property.unit ? `, ${property.unit}` : ""}, {property.city}
          </p>
          <p className="text-gray-800 dark:text-gray-200">
            <strong>Tenant(s):</strong> {tenant.tenantNames.join(" & ")}
          </p>
          <p className="text-gray-800 dark:text-gray-200">
            <strong>Date Initiated:</strong>{" "}
            {formatDateForDisplay(caseItem.dateInitiated)}
          </p>
          <p className="text-gray-800 dark:text-gray-200">
            <strong>Amount Due (submission):</strong> $
            {caseItem.rentOwedAtFiling.toFixed(2)}
          </p>
          <p className="text-gray-800 dark:text-gray-200">
            <strong>Current Total Amount Due:</strong> $
            {(
              editableCaseDetails.currentRentOwed ??
              caseItem.currentRentOwed ??
              caseItem.rentOwedAtFiling
            ).toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Case Status
            </label>
            <select
              id="status"
              name="status"
              value={editableCaseDetails.status}
              onChange={handleModalInputChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(LegalCaseStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="paymentStatus"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Payment Status
            </label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={editableCaseDetails.paymentStatus}
              onChange={handleModalInputChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="trialDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Trial Date
            </label>
            <input
              type="date"
              id="trialDate"
              name="trialDate"
              value={editableCaseDetails.trialDate || ""}
              onChange={handleModalDateChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="districtCourtCaseNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              District Court Case Number
            </label>
            <input
              type="text"
              id="districtCourtCaseNumber"
              name="districtCourtCaseNumber"
              value={editableCaseDetails.districtCourtCaseNumber || ""}
              onChange={handleModalInputChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter case number"
            />
          </div>

          <div>
            <label
              htmlFor="contractorId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Assigned Contractor
            </label>
            <select
              id="contractorId"
              name="contractorId"
              value={editableCaseDetails.contractorId || ""}
              onChange={handleModalInputChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Unassigned --</option>
              {allContractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.username})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="courtOutcomeNotes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Notes
            </label>
            <textarea
              id="courtOutcomeNotes"
              name="courtOutcomeNotes"
              value={editableCaseDetails.courtOutcomeNotes || ""}
              onChange={handleModalInputChange}
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter case notes"
            />
          </div>
        </div>

        {caseItem.generatedDocuments.evictionNotice && (
          <div className="mt-2 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-900/50">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              AI-Generated Eviction Notice (Original)
            </h4>
            <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto text-gray-600 dark:text-gray-300">
              {caseItem.generatedDocuments.evictionNotice}
            </pre>
          </div>
        )}

        <div className="mt-4 p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Manage Uploaded Documents
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Note: Only filenames are stored. Actual file content is not saved in
            this demo application.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentFieldsConfig.map((docConfig) => (
              <div key={docConfig.key}>
                <label
                  htmlFor={docConfig.key}
                  className="block text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  {docConfig.label}
                </label>
                {(editableCaseDetails[docConfig.key] as string) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    Current: {editableCaseDetails[docConfig.key] as string}
                  </p>
                )}
                <input
                  type="file"
                  id={docConfig.key}
                  name={docConfig.key}
                  onChange={(e) => handleFileUploadChange(e, docConfig.key)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-600"
                />
              </div>
            ))}
          </div>
        </div>

        {editableCaseDetails.status !== LegalCaseStatus.COMPLETE && (
          <div className="mt-4">
            <button
              onClick={handleMarkAsCompleted}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!areAllDocumentsUploaded}
              title={
                !areAllDocumentsUploaded
                  ? "All 4 documents must be uploaded to mark as complete."
                  : "Set status to Complete"
              }
            >
              Mark as Completed (Status: {LegalCaseStatus.COMPLETE})
            </button>
            {!areAllDocumentsUploaded && (
              <p className="text-xs text-center text-red-400 mt-1">
                All 4 documents must be uploaded before this action is
                available.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCaseDetails}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminCaseDetailsModal;
