import React, { useState, useEffect, useContext } from "react";
import {
  LegalCase,
  LegalCaseStatus,
  PaymentStatus,
  User,
  Property,
  Tenant,
  County,
} from "../../types";
import { AuthContext } from "../../App";
import * as Storage from "../../services/localStorageService";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import { generateFinalNoticeOfEvictionDatePDF } from "../../services/pdfService";
import { errorService } from "../../services/errorService";

const ContractorDashboardPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [availableJobs, setAvailableJobs] = useState<LegalCase[]>([]);
  const [myJobs, setMyJobs] = useState<LegalCase[]>([]);
  const [allLandlords, setAllLandlords] = useState<User[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<LegalCase | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [evictionNoticeFile, setEvictionNoticeFile] = useState<File | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    if (auth?.currentUser?.role === "contractor") {
      const allCases = Storage.getAllLegalCasesForAdmin();
      const available = allCases
        .filter(
          (c) =>
            c.status === LegalCaseStatus.SUBMITTED &&
            c.paymentStatus === PaymentStatus.PAID &&
            !c.contractorId
        )
        .sort(
          (a, b) =>
            new Date(a.dateInitiated).getTime() -
            new Date(b.dateInitiated).getTime()
        );

      const mine = allCases
        .filter(
          (c) =>
            c.status === LegalCaseStatus.SUBMITTED &&
            c.paymentStatus === PaymentStatus.PAID &&
            c.contractorId === auth.currentUser?.id
        )
        .sort(
          (a, b) =>
            new Date(a.claimedAt || 0).getTime() -
            new Date(b.claimedAt || 0).getTime()
        );

      setAvailableJobs(available);
      setMyJobs(mine);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    if (auth?.currentUser) {
      setAllLandlords(Storage.getAllLandlordUsers());
      setAllProperties(Storage.getAllPropertiesForAdmin());
      setAllTenants(Storage.getAllTenantsForAdmin());
      loadData();
    }
    setIsLoading(false);
  }, [auth?.currentUser]);

  const handleClaimJob = (caseId: string) => {
    const caseToUpdate = availableJobs.find((c) => c.id === caseId);
    if (caseToUpdate && auth.currentUser) {
      const updatedCase: LegalCase = {
        ...caseToUpdate,
        contractorId: auth.currentUser.id,
        claimedAt: new Date().toISOString(),
      };
      Storage.updateLegalCase(updatedCase);
      loadData();
    }
  };

  const handleUnclaimJob = (caseId: string) => {
    const caseToUpdate = myJobs.find((c) => c.id === caseId);
    if (caseToUpdate) {
      const updatedCase: LegalCase = {
        ...caseToUpdate,
        contractorId: undefined,
        claimedAt: undefined,
      };
      Storage.updateLegalCase(updatedCase);
      loadData();
    }
  };

  const handleOpenUpdateModal = (job: LegalCase) => {
    setSelectedJob(job);
    setPhotoFile(null);
    setCertFile(null);
    setReceiptFile(null);
    setEvictionNoticeFile(null);
    setIsModalOpen(true);
  };

  const handleSubmitUpdate = () => {
    if (!selectedJob) return;
    setIsSubmitting(true);

    const updatedCase: LegalCase = {
      ...selectedJob,
      status: LegalCaseStatus.IN_PROGRESS,
      postingCompletedAt: new Date().toISOString(),
      uploadedPhotoFileName: photoFile?.name,
      uploadedDocument1FileName: certFile?.name, // Using Document1 for Certificate of Mailing
      uploadedReceiptFileName: receiptFile?.name,
      thirtyDayNoticeFileName: evictionNoticeFile?.name,
    };

    Storage.updateLegalCase(updatedCase);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setSelectedJob(null);
    loadData();
  };

  const getCaseContext = (caseItem: LegalCase) => {
    const landlord = allLandlords.find((l) => l.id === caseItem.landlordId);
    const property = allProperties.find((p) => p.id === caseItem.propertyId);
    const tenant = allTenants.find((t) => t.id === caseItem.tenantId);
    return { landlord, property, tenant };
  };

  const handleDownloadPDF = (job: LegalCase) => {
    const { landlord, property, tenant } = getCaseContext(job);
    if (landlord && property && tenant && auth.currentUser) {
      generateFinalNoticeOfEvictionDatePDF(
        job,
        property,
        tenant,
        landlord,
        auth.currentUser
      );
    } else {
      errorService.showError(
        "Could not generate PDF. Missing required information for the case."
      );
    }
  };

  const JobCard = ({
    job,
    isClaimed,
  }: {
    job: LegalCase;
    isClaimed: boolean;
  }) => {
    const { landlord, property, tenant } = getCaseContext(job);

    let dueDateString = "N/A";
    let isOverdue = false;

    if (job.initialEvictionDate) {
      const evictionDate = new Date(job.initialEvictionDate + "T00:00:00");
      const dueDate = new Date(evictionDate);
      dueDate.setDate(dueDate.getDate() - 8);
      dueDateString = dueDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      isOverdue = dueDate < today;
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <div className="p-5 flex-grow">
          {property?.county &&
            (property.county === County.BALTIMORE_CITY ? (
              <div className="mb-2 p-1 bg-yellow-300 text-black text-center font-bold rounded-md text-sm">
                Baltimore City
              </div>
            ) : (
              <div className="mb-2 p-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-center font-semibold rounded-md text-sm">
                {property.county}
              </div>
            ))}
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">
            Case: {job.districtCourtCaseNumber || "N/A"}
          </h3>
          <p
            className={`text-sm font-bold ${
              isOverdue
                ? "text-red-500 dark:text-red-400 animate-pulse"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            Due Date: {dueDateString}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            For Client: {landlord?.name || "N/A"}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <strong>Property:</strong> {property?.address}, {property?.city}
            </p>
            <p>
              <strong>Tenant:</strong>{" "}
              {tenant?.tenantNames.join(" & ") || "N/A"}
            </p>
            <p>
              <strong>Posting Instructions:</strong>{" "}
              <span className="italic">
                {property?.description || "No special instructions."}
              </span>
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 flex justify-end items-center space-x-2">
          {isClaimed ? (
            <>
              <button
                onClick={() => handleDownloadPDF(job)}
                className="btn-secondary-sm"
              >
                Download Form
              </button>
              <button
                onClick={() => handleOpenUpdateModal(job)}
                className="btn-primary-sm"
              >
                Update Posting
              </button>
              <button
                onClick={() => handleUnclaimJob(job.id)}
                className="btn-secondary-sm"
              >
                Unclaim
              </button>
            </>
          ) : (
            <button
              onClick={() => handleClaimJob(job.id)}
              className="btn-claim-sm"
            >
              Claim Job
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading)
    return <LoadingSpinner text="Loading Job Board..." size="lg" />;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Contractor Job Board
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Welcome, {auth?.currentUser?.name}. Claim jobs to post eviction notices.
      </p>

      {/* My Claimed Jobs */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          My Claimed Jobs ({myJobs.length})
        </h2>
        {myJobs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            You have no claimed jobs. Claim a job from the list below to get
            started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myJobs.map((job) => (
              <React.Fragment key={job.id}>
                <JobCard job={job} isClaimed={true} />
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {/* Available Jobs */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Available Jobs for Posting ({availableJobs.length})
        </h2>
        {availableJobs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No available jobs at the moment. Check back later.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableJobs.map((job) => (
              <React.Fragment key={job.id}>
                <JobCard job={job} isClaimed={false} />
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && selectedJob && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Update Posting for Case ${selectedJob.districtCourtCaseNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                Upload Required Documents
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Please upload all four required documents to complete this job.
                All fields are mandatory.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label
                  htmlFor="evictionNoticeFile"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Eviction Notice
                </label>
                <input
                  type="file"
                  id="evictionNoticeFile"
                  onChange={(e) =>
                    setEvictionNoticeFile(e.target.files?.[0] || null)
                  }
                  className="file-input"
                  accept="image/*,.pdf"
                />
                {evictionNoticeFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Selected: {evictionNoticeFile.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="photoFile"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Photo of Posted Notice
                </label>
                <input
                  type="file"
                  id="photoFile"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="file-input"
                  accept="image/*,.pdf"
                />
                {photoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Selected: {photoFile.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="receiptFile"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Receipt
                </label>
                <input
                  type="file"
                  id="receiptFile"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="file-input"
                  accept="image/*,.pdf"
                />
                {receiptFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Selected: {receiptFile.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="certFile"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Certificate of Mailing
                </label>
                <input
                  type="file"
                  id="certFile"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="file-input"
                  accept="image/*,.pdf"
                />
                {certFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Selected: {certFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUpdate}
                className="btn-primary"
                disabled={
                  isSubmitting ||
                  !photoFile ||
                  !certFile ||
                  !receiptFile ||
                  !evictionNoticeFile
                }
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Submit All Documents & Complete Job"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .btn-primary { 
          @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50;
        }
        .btn-secondary { 
          @apply py-2 px-4 bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500;
        }
        .btn-primary-sm { 
          @apply py-1 px-3 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50;
        }
        .btn-secondary-sm { 
          @apply py-1 px-3 text-sm bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500;
        }
        .btn-claim-sm { 
          @apply py-1 px-3 text-sm bg-orange-500 font-bold text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50;
        }
        .file-input { @apply mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-800/50 file:text-primary-700 dark:file:text-primary-200 hover:file:bg-primary-100 dark:hover:file:bg-primary-700/50; }
      `}</style>
    </div>
  );
};

export default ContractorDashboardPage;
