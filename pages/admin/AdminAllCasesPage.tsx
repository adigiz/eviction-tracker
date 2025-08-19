
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegalCase, User, Property, Tenant, LegalCaseStatus, PaymentStatus } from '../../types'; 
import * as Storage from '../../services/localStorageService';
import { AuthContext } from '../../App';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal'; 
import { generateFinalNoticeOfEvictionDatePDF, generateBulkFinalNoticeOfEvictionDatePDF } from '../../services/pdfService';

const statusColors: Record<LegalCaseStatus, string> = {
  [LegalCaseStatus.NOTICE_DRAFT]: 'bg-yellow-100 text-yellow-800',
  [LegalCaseStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [LegalCaseStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
  [LegalCaseStatus.COMPLETE]: 'bg-green-100 text-green-800',
};

const paymentStatusColorsAdmin: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'bg-red-100 text-red-800',
  [PaymentStatus.PENDING_PAYMENT]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.FAILED]: 'bg-red-200 text-red-900',
  [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
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
  const [editableCaseDetails, setEditableCaseDetails] = useState<Partial<LegalCase>>({});
  
  const [selectedCaseLandlord, setSelectedCaseLandlord] = useState<User | null>(null);
  const [selectedCaseProperty, setSelectedCaseProperty] = useState<Property | null>(null);
  const [selectedCaseTenant, setSelectedCaseTenant] = useState<Tenant | null>(null);

  const [bulkPdfStartDate, setBulkPdfStartDate] = useState('');
  const [bulkPdfEndDate, setBulkPdfEndDate] = useState('');

  useEffect(() => {
    if (auth?.currentUser?.role === 'admin') {
      setAllCases(Storage.getAllLegalCasesForAdmin().sort((a, b) => new Date(b.dateInitiated).getTime() - new Date(a.dateInitiated).getTime()));
      setAllLandlords(Storage.getAllLandlordUsers());
      setAllProperties(Storage.getAllPropertiesForAdmin());
      setAllTenants(Storage.getAllTenantsForAdmin());
      setAllContractors(Storage.getAllContractorUsers());
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [auth?.currentUser]);

  const getLandlordName = (landlordId: string) => allLandlords.find(l => l.id === landlordId)?.name || 'N/A';
  const getContractorName = (contractorId?: string) => allContractors.find(c => c.id === contractorId)?.name || 'N/A';
  const getPropertyAddress = (propertyId: string) => {
    const prop = allProperties.find(p => p.id === propertyId);
    return prop ? `${prop.address}${prop.unit ? `, ${prop.unit}` : ''}, ${prop.city}` : 'N/A';
  };
  const getTenantNames = (tenantId: string) => {
    const tenant = allTenants.find(t => t.id === tenantId);
    return tenant?.tenantNames?.join(' & ') || 'N/A';
  };
  
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString + "T00:00:00").toLocaleDateString();
  };

  const handleViewDetails = (caseItem: LegalCase) => {
    setSelectedCase(caseItem);
    setEditableCaseDetails({ ...caseItem }); 
    setSelectedCaseLandlord(allLandlords.find(l => l.id === caseItem.landlordId) || null);
    setSelectedCaseProperty(allProperties.find(p => p.id === caseItem.propertyId) || null);
    setSelectedCaseTenant(allTenants.find(t => t.id === caseItem.tenantId) || null);
    setIsDetailsModalOpen(true);
  };
  
  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableCaseDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleModalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableCaseDetails(prev => ({ ...prev, [name]: value === '' ? undefined : value }));
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: keyof LegalCase) => {
    const file = e.target.files?.[0];
    setEditableCaseDetails(prev => ({
      ...prev,
      [fileType]: file ? file.name : undefined 
    }));
  };

  const handleMarkAsCompleted = () => {
    setEditableCaseDetails(prev => ({ ...prev, status: LegalCaseStatus.COMPLETE }));
  };
  
  const handleSaveCaseDetails = () => {
    if (selectedCase && editableCaseDetails) {
      // User requested check: All 4 docs must be present to mark as 'Complete'
      if (editableCaseDetails.status === LegalCaseStatus.COMPLETE) {
        const allDocsUploaded = 
          !!editableCaseDetails.thirtyDayNoticeFileName &&
          !!editableCaseDetails.uploadedPhotoFileName &&
          !!editableCaseDetails.uploadedReceiptFileName &&
          !!editableCaseDetails.uploadedDocument1FileName;
        
        if (!allDocsUploaded) {
          alert("Cannot save as 'Complete'. All 4 required documents must be uploaded first.");
          return; // Stop the save
        }
      }

      const updatedCaseData = { ...selectedCase, ...editableCaseDetails } as LegalCase;
      Storage.updateLegalCase(updatedCaseData);
      setAllCases(prevCases => prevCases.map(c => c.id === updatedCaseData.id ? updatedCaseData : c)
        .sort((a, b) => new Date(b.dateInitiated).getTime() - new Date(a.dateInitiated).getTime()));
      setIsDetailsModalOpen(false);
      setSelectedCase(null);
      setEditableCaseDetails({});
      alert("Case details updated by Admin.");
    }
  };

  const handleDownloadFinalNoticePDF = (caseItem: LegalCase) => {
    if (caseItem.paymentStatus !== PaymentStatus.PAID) {
      alert("This notice can only be generated for paid cases.");
      return;
    }
    if (!auth?.currentUser) {
        alert("Admin user not found.");
        return;
    }
    const property = allProperties.find(p => p.id === caseItem.propertyId);
    const tenant = allTenants.find(t => t.id === caseItem.tenantId);
    const landlord = allLandlords.find(l => l.id === caseItem.landlordId);

    if (property && tenant && landlord) {
      generateFinalNoticeOfEvictionDatePDF(caseItem, property, tenant, landlord, auth.currentUser);
    } else {
      alert("Could not find all necessary data (property, tenant, or landlord) to generate the PDF.");
    }
  };

  const handleBulkDownloadPDFs = () => {
    if (!bulkPdfStartDate || !bulkPdfEndDate) {
      alert("Please select both a start and end date for the bulk download.");
      return;
    }
    if (!auth?.currentUser) {
        alert("Admin user not found.");
        return;
    }

    const startDate = new Date(bulkPdfStartDate + "T00:00:00");
    const endDate = new Date(bulkPdfEndDate + "T23:59:59");

    const filteredCases = allCases.filter(c => {
      const caseDate = new Date(c.dateInitiated + "T00:00:00");
      return c.paymentStatus === PaymentStatus.PAID && caseDate >= startDate && caseDate <= endDate;
    });

    if (filteredCases.length === 0) {
      alert("No paid cases found in the selected date range.");
      return;
    }
    
    // Prepare maps for efficient lookup
    const propertiesMap = new Map(allProperties.map(p => [p.id, p]));
    const tenantsMap = new Map(allTenants.map(t => [t.id, t]));
    const landlordsMap = new Map(allLandlords.map(l => [l.id, l]));

    generateBulkFinalNoticeOfEvictionDatePDF(filteredCases, propertiesMap, tenantsMap, landlordsMap, auth.currentUser);
  };


  if (isLoading) {
    return <LoadingSpinner text="Loading all cases..." size="lg" />;
  }

  if (auth?.currentUser?.role !== 'admin') {
    return <p className="p-8 text-center text-red-500">Access Denied. Admin privileges required.</p>;
  }

  const documentFieldsConfig: { key: keyof LegalCase; label: string }[] = [
    { key: 'thirtyDayNoticeFileName', label: 'Eviction Notice' },
    { key: 'uploadedPhotoFileName', label: 'Photo' },
    { key: 'uploadedReceiptFileName', label: 'Receipt' },
    { key: 'uploadedDocument1FileName', label: 'Certificate of Mailing' },
  ];


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">All Client Submissions</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Bulk Download Final Eviction Date Notices</h2>
        <p className="text-sm text-gray-300 mb-3">Select a date range to download notices for all paid cases initiated within that period. Each notice will be on a new page in a single PDF.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="bulkPdfStartDate" className="block text-sm font-medium text-gray-300">Start Date</label>
            <input type="date" id="bulkPdfStartDate" name="bulkPdfStartDate" value={bulkPdfStartDate} onChange={e => setBulkPdfStartDate(e.target.value)} className="mt-1 block w-full input-sm admin-modal-text-input" />
          </div>
          <div>
            <label htmlFor="bulkPdfEndDate" className="block text-sm font-medium text-gray-300">End Date</label>
            <input type="date" id="bulkPdfEndDate" name="bulkPdfEndDate" value={bulkPdfEndDate} onChange={e => setBulkPdfEndDate(e.target.value)} className="mt-1 block w-full input-sm admin-modal-text-input" />
          </div>
          <button 
            onClick={handleBulkDownloadPDFs} 
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md h-fit"
            disabled={!bulkPdfStartDate || !bulkPdfEndDate}
          >
            Download for Range
          </button>
        </div>
      </div>


      {allCases.length === 0 ? (
        <p className="text-center py-10 bg-gray-800 rounded-lg shadow">No submissions found across all clients.</p>
      ) : (
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Case No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contractor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Initiated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {allCases.map(caseItem => (
                <tr key={caseItem.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">{caseItem.districtCourtCaseNumber || caseItem.id.substring(0, 8)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{getLandlordName(caseItem.landlordId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{getPropertyAddress(caseItem.propertyId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                     <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${statusColors[caseItem.status] || 'bg-gray-200 text-gray-800'}`}>
                        {caseItem.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{caseItem.contractorId ? getContractorName(caseItem.contractorId) : <span className="text-gray-500 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{new Date(caseItem.dateInitiated).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleViewDetails(caseItem)} className="text-primary-400 hover:text-primary-300 hover:underline">
                      View/Edit
                    </button>
                    {caseItem.paymentStatus === PaymentStatus.PAID && (
                       <button onClick={() => handleDownloadFinalNoticePDF(caseItem)} className="text-green-400 hover:text-green-300 hover:underline">
                         Download Notice
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isDetailsModalOpen && selectedCase && selectedCaseLandlord && selectedCaseProperty && selectedCaseTenant && (() => {
        const areAllDocumentsUploaded = 
          !!editableCaseDetails.thirtyDayNoticeFileName &&
          !!editableCaseDetails.uploadedPhotoFileName &&
          !!editableCaseDetails.uploadedReceiptFileName &&
          !!editableCaseDetails.uploadedDocument1FileName;

        return (
          <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Case Details: ${editableCaseDetails.districtCourtCaseNumber || selectedCase.id.substring(0,8)} (Admin Edit)`} size="4xl">
              <div className="space-y-6 p-2 text-gray-300 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-700 rounded-md bg-gray-900/50">
                      <p><strong>Client:</strong> {selectedCaseLandlord.name} ({selectedCaseLandlord.username})</p>
                      <p><strong>Property:</strong> {selectedCaseProperty.address}{selectedCaseProperty.unit ? `, ${selectedCaseProperty.unit}` : ''}, {selectedCaseProperty.city}</p>
                      <p><strong>Tenant(s):</strong> {selectedCaseTenant.tenantNames.join(' & ')}</p>
                      <p><strong>Date Initiated:</strong> {formatDateForDisplay(selectedCase.dateInitiated)}</p>
                      <p><strong>Amount Due (submission):</strong> ${selectedCase.rentOwedAtFiling.toFixed(2)}</p>
                      <p><strong>Current Total Amount Due:</strong> ${(editableCaseDetails.currentRentOwed ?? selectedCase.currentRentOwed ?? selectedCase.rentOwedAtFiling).toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                      <div>
                          <label htmlFor="status" className="block text-xs font-medium text-gray-400">Case Status</label>
                          <select id="status" name="status" value={editableCaseDetails.status} onChange={handleModalInputChange} className="mt-1 block w-full input-sm admin-modal-select">
                              {Object.values(LegalCaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      <div>
                          <label htmlFor="paymentStatus" className="block text-xs font-medium text-gray-400">Payment Status</label>
                          <select id="paymentStatus" name="paymentStatus" value={editableCaseDetails.paymentStatus} onChange={handleModalInputChange} className="mt-1 block w-full input-sm admin-modal-select">
                              {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                       <div>
                          <label htmlFor="trialDate" className="block text-xs font-medium text-gray-400">Trial Date</label>
                          <input type="date" id="trialDate" name="trialDate" value={editableCaseDetails.trialDate || ''} onChange={handleModalDateChange} className="mt-1 block w-full input-sm admin-modal-text-input" />
                      </div>
                       <div>
                          <label htmlFor="districtCourtCaseNumber" className="block text-xs font-medium text-gray-400">District Court Case Number</label>
                          <input type="text" id="districtCourtCaseNumber" name="districtCourtCaseNumber" value={editableCaseDetails.districtCourtCaseNumber || ''} onChange={handleModalInputChange} className="mt-1 block w-full input-sm admin-modal-text-input" />
                      </div>
                      <div>
                          <label htmlFor="contractorId" className="block text-xs font-medium text-gray-400">Assigned Contractor</label>
                          <select id="contractorId" name="contractorId" value={editableCaseDetails.contractorId || ''} onChange={handleModalInputChange} className="mt-1 block w-full input-sm admin-modal-select">
                              <option value="">-- Unassigned --</option>
                              {allContractors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.username})</option>)}
                          </select>
                      </div>
                      
                      <div className="md:col-span-3">
                          <label htmlFor="courtOutcomeNotes" className="block text-xs font-medium text-gray-400">Notes</label>
                          <textarea id="courtOutcomeNotes" name="courtOutcomeNotes" value={editableCaseDetails.courtOutcomeNotes || ''} onChange={handleModalInputChange} rows={3} className="mt-1 block w-full input-sm admin-modal-text-input"/>
                      </div>
                  </div>

                  {selectedCase.generatedDocuments.evictionNotice && (
                    <div className="mt-2 p-2 border border-gray-700 rounded-md bg-gray-900/50">
                        <h4 className="text-sm font-semibold text-gray-200">AI-Generated Eviction Notice (Original)</h4>
                        <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto text-gray-300">{selectedCase.generatedDocuments.evictionNotice}</pre>
                    </div>
                  )}
                 
                  <div className="mt-4 p-4 border border-gray-700 rounded-md">
                    <h3 className="text-md font-semibold text-gray-200 mb-3">Manage Uploaded Documents</h3>
                    <p className="text-xs text-gray-400 mb-3">Note: Only filenames are stored. Actual file content is not saved in this demo application.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documentFieldsConfig.map(docConfig => (
                          <div key={docConfig.key}>
                            <label htmlFor={docConfig.key} className="block text-xs font-medium text-gray-400">
                              {docConfig.label}
                            </label>
                            {(editableCaseDetails[docConfig.key] as string) && <p className="text-xs text-gray-500 truncate mb-1">Current: {editableCaseDetails[docConfig.key] as string}</p>}
                            <input 
                              type="file" 
                              id={docConfig.key} 
                              name={docConfig.key}
                              onChange={(e) => handleFileUploadChange(e, docConfig.key)} 
                              className="mt-1 block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
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
                            title={!areAllDocumentsUploaded ? "All 4 documents must be uploaded to mark as complete." : "Set status to Complete"}
                        >
                            Mark as Completed (Status: {LegalCaseStatus.COMPLETE})
                        </button>
                        {!areAllDocumentsUploaded && (
                             <p className="text-xs text-center text-red-400 mt-1">
                                All 4 documents must be uploaded before this action is available.
                            </p>
                        )}
                      </div>
                  )}

                   {selectedCase.paymentStatus === PaymentStatus.PAID && (
                      <button
                          onClick={() => handleDownloadFinalNoticePDF(selectedCase)}
                          className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                          Download "Final Notice of Eviction Date" PDF
                      </button>
                  )}


                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                      <button type="button" onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-500 border border-gray-500 rounded-md">Cancel</button>
                      <button type="button" onClick={handleSaveCaseDetails} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Save Changes</button>
                  </div>
              </div>
              <style>{`
                .input-sm { 
                  @apply px-2 py-1.5 text-sm border-gray-600 rounded-md shadow-sm bg-gray-900 text-gray-200 focus:ring-primary-400 focus:border-primary-400; 
                }
                .admin-modal-select {
                  background-color: #1f2937; 
                  color: #d1d5db;
                  border: 1px solid #4b5563; 
                  padding-top: 0.375rem; 
                  padding-bottom: 0.375rem;
                  padding-left: 0.5rem; 
                  padding-right: 2rem;
                  border-radius: 0.375rem; 
                }
                .admin-modal-select option {
                  background-color: #1f2937; 
                  color: #d1d5db;
                }
                .admin-modal-text-input {
                  background-color: #1f2937;
                  color: #d1d5db;
                  border: 1px solid #4b5563;
                  border-radius: 0.375rem;
                  padding: 0.375rem 0.5rem; 
                  width: 100%;
                }
                .admin-modal-text-input:focus {
                  outline: 2px solid transparent;
                  outline-offset: 2px;
                  border-color: #4ade80; 
                  --tw-ring-color: #4ade80;
                }
              `}</style>
          </Modal>
        )
      })()}
    </div>
  );
};

export default AdminAllCasesPage;
