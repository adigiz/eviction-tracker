import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Property, Tenant, LegalCase, LegalCaseStatus, PropertyType, PaymentStatus, County } from '../../types';
import { AuthContext } from '../../App';
import { generateId } from '../../services/localStorageService';
import LoadingSpinner from '../LoadingSpinner';
// Removed: import { generateEvictionNoticeContent } from '../../services/geminiService'; // AI generation will be post-payment
import { SUBSIDY_TYPES, DEFAULT_REQUEST_PRICE, DISCOUNT_AMOUNT } from '../../constants'; 

interface FTPRFormProps {
  onSubmitSuccess: (newCase: LegalCase) => void;
  onCancel: () => void;
  properties: Property[];
  tenants: Tenant[];
  cases: LegalCase[]; 
}

const FTPRForm: React.FC<FTPRFormProps> = ({ onSubmitSuccess, onCancel, properties, tenants, cases }) => {
  const auth = useContext(AuthContext);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(''); 
  
  const [rentOwed, setRentOwed] = useState<number | ''>('');
  const [noRightOfRedemption, setNoRightOfRedemption] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [thirtyDayNoticeFile, setThirtyDayNoticeFile] = useState<File | null>(null);
  const [thirtyDayNoticeFileError, setThirtyDayNoticeFileError] = useState<string>('');

  const [landlordSignature, setLandlordSignature] = useState<string>('');
  const [landlordSignatureError, setLandlordSignatureError] = useState<string>('');

  const [districtCourtCaseNumber, setDistrictCourtCaseNumber] = useState<string>('');
  const [warrantOrderDate, setWarrantOrderDate] = useState<string>('');
  const [initialEvictionDate, setInitialEvictionDate] = useState<string>('');
  const [districtCourtCaseNumberError, setDistrictCourtCaseNumberError] = useState<string>('');
  const [warrantOrderDateError, setWarrantOrderDateError] = useState<string>('');
  const [initialEvictionDateError, setInitialEvictionDateError] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>(''); 
  const [pricingError, setPricingError] = useState<string>('');

  const price = useMemo(() => {
    if (!auth?.currentUser || !selectedProperty) {
        setPricingError('');
        return DEFAULT_REQUEST_PRICE; // Fallback before selection
    }

    const { priceOverrides, referralCode } = auth.currentUser;
    const county = selectedProperty.county;

    if (priceOverrides && priceOverrides[county]) {
        const countyPriceInfo = priceOverrides[county];
        if (!countyPriceInfo.unlocked) {
            setPricingError(`Service is not currently available for ${county} on your account. Please contact support.`);
            return 0; // Return 0 to indicate an invalid price
        }
        
        let basePrice = countyPriceInfo.price;
        
        if (referralCode) {
            basePrice -= DISCOUNT_AMOUNT;
        }

        setPricingError(''); // Clear previous errors
        return Math.max(0, basePrice); // Ensure price isn't negative
    }

    // Fallback if no specific price is set for the county, treat as locked
    setPricingError(`Pricing for ${county} is not configured for your account. Please contact support.`);
    return 0;

  }, [auth?.currentUser, selectedProperty]);

  const isThirtyDayNoticeRequired = useMemo(() => {
    return selectedProperty?.propertyType === PropertyType.RESIDENTIAL &&
           selectedTenant?.isSubsidized === true &&
           selectedTenant?.subsidyType !== undefined &&
           selectedTenant?.subsidyType !== SUBSIDY_TYPES[0]; 
  }, [selectedProperty, selectedTenant]);

  useEffect(() => {
    if (selectedTenantId) {
      const tenant = tenants.find(t => t.id === selectedTenantId);
      setSelectedTenant(tenant || null);
      if (tenant) {
        const prop = properties.find(p => p.id === tenant.propertyId);
        setSelectedProperty(prop || null);
        setSelectedPropertyId(prop?.id || '');
      } else {
        setSelectedProperty(null);
        setSelectedPropertyId('');
      }
      setThirtyDayNoticeFile(null);
      setThirtyDayNoticeFileError('');
      setNoRightOfRedemption(false);
    } else {
      setSelectedTenant(null);
      setSelectedProperty(null);
      setSelectedPropertyId('');
      setThirtyDayNoticeFile(null);
      setThirtyDayNoticeFileError('');
      setNoRightOfRedemption(false);
    }
  }, [selectedTenantId, tenants, properties]);

  useEffect(() => {
    if (!isThirtyDayNoticeRequired) {
        setThirtyDayNoticeFile(null);
        setThirtyDayNoticeFileError('');
    }
  }, [isThirtyDayNoticeRequired]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setThirtyDayNoticeFile(file);
    if (file) {
        setThirtyDayNoticeFileError('');
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    let errorMessages: string[] = [];

    if (!selectedTenantId) errorMessages.push("Tenant selection is required.");
    if (!selectedPropertyId && selectedTenantId) errorMessages.push("Associated property for the selected tenant could not be found.");
    
    if (pricingError) {
        errorMessages.push(pricingError);
    }
    if (price <= 0 && selectedPropertyId) {
        errorMessages.push("Cannot submit with an invalid price.");
    }

    if (!noRightOfRedemption && (rentOwed === '' || Number(rentOwed) <= 0)) {
        errorMessages.push("Amount Due to Redeem the Property must be a positive number.");
    }
    
    if (!districtCourtCaseNumber.trim()) {
      errorMessages.push("District Court Case Number is required.");
      setDistrictCourtCaseNumberError("Required");
    } else {
      setDistrictCourtCaseNumberError("");
    }

    if (!warrantOrderDate) {
      errorMessages.push("Date Warrant Was Ordered by Court is required.");
      setWarrantOrderDateError("Required");
    } else {
      setWarrantOrderDateError("");
    }

    if (!initialEvictionDate) {
      errorMessages.push("Initial Scheduled Date of Eviction is required.");
      setInitialEvictionDateError("Required");
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const evictionD = new Date(initialEvictionDate + "T00:00:00"); 
      const diffTime = evictionD.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 17) {
        errorMessages.push("Initial Scheduled Date of Eviction must be at least 17 days from today.");
        setInitialEvictionDateError("Date must be at least 17 days from today.");
      } else {
        setInitialEvictionDateError("");
      }
    }

    if (isThirtyDayNoticeRequired && !thirtyDayNoticeFile) {
        errorMessages.push("A 30-day notice upload is required for this subsidy type.");
        setThirtyDayNoticeFileError("30-day notice upload is required.");
    } else {
        setThirtyDayNoticeFileError('');
    }

    if (!landlordSignature.trim()) {
        errorMessages.push("Your signature is required to affirm the oath.");
        setLandlordSignatureError("Signature is required.");
    } else {
        setLandlordSignatureError('');
    }
    
    if (selectedTenant?.isSubsidized && !noRightOfRedemption && rentOwed && selectedTenant.rentAmount && selectedTenant.rentAmount > 0) {
        const monthsOwed = Math.ceil(Number(rentOwed) / selectedTenant.rentAmount);
        if (monthsOwed > 12) {
            errorMessages.push("For subsidized tenancies, you can only claim up to 12 months of rent.");
        }
    }

    // Check for existing unpaid or non-terminal cases (excluding drafts)
    if (selectedTenantId && cases.some(c => 
        c.tenantId === selectedTenantId &&
        c.paymentStatus !== PaymentStatus.PAID && 
        (c.status !== LegalCaseStatus.COMPLETE &&
         c.status !== LegalCaseStatus.NOTICE_DRAFT) 
    )) {
        errorMessages.push(`An active or unpaid eviction letter request already exists for this tenant. Please complete payment or wait for the existing request to be resolved.`);
    }
    
    if (errorMessages.length > 0) {
        setFormError(errorMessages.join(' \n'));
        isValid = false;
    } else {
        setFormError('');
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); 

    if (!validateForm()) {
      return;
    }
    
    if (!auth?.currentUser || !selectedProperty || !selectedTenant) {
      setFormError("User, property or tenant data is missing.");
      return;
    }

    setIsLoading(true);

    const resolvedRentOwed = noRightOfRedemption ? 0 : Number(rentOwed);

    const newCase: LegalCase = {
      id: generateId(),
      landlordId: auth.currentUser.id,
      propertyId: selectedPropertyId,
      tenantId: selectedTenantId,
      caseType: 'FTPR',
      dateInitiated: new Date().toISOString().split('T')[0],
      rentOwedAtFiling: resolvedRentOwed,
      currentRentOwed: resolvedRentOwed,
      status: LegalCaseStatus.NOTICE_DRAFT, 
      paymentStatus: PaymentStatus.UNPAID, 
      price: price, 
      noRightOfRedemption: noRightOfRedemption,
      lateFeesCharged: undefined,
      thirtyDayNoticeFileName: isThirtyDayNoticeRequired && thirtyDayNoticeFile ? thirtyDayNoticeFile.name : undefined,
      paymentsMade: [], 
      noticeMailedDate: undefined,
      courtCaseNumber: undefined, 
      trialDate: undefined,
      courtHearingDate: undefined, 
      courtOutcomeNotes: undefined,
      generatedDocuments: { evictionNotice: undefined }, // Use evictionNotice
      districtCourtCaseNumber: districtCourtCaseNumber.trim() || undefined,
      warrantOrderDate: warrantOrderDate || undefined,
      initialEvictionDate: initialEvictionDate || undefined,
    };
    
    onSubmitSuccess(newCase);
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingSpinner text="Adding to Cart..." />;
  }

  const displayTenantNames = (names: string[] | undefined) => {
    if (!names || names.length === 0) return 'N/A';
    return names.join(' & ');
  };
  
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const errorTextClass = "mt-1 text-xs text-red-500 dark:text-red-400";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(formError || pricingError) && <p className="text-sm text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-500/20 p-3 rounded-md mb-4 whitespace-pre-line" role="alert">{formError || pricingError}</p>}
      
      <div>
        <label htmlFor="ftprTenantId" className={labelClass}>Tenant <span className="text-red-500">*</span></label>
        <select 
          id="ftprTenantId" 
          value={selectedTenantId} 
          onChange={(e) => setSelectedTenantId(e.target.value)} 
          required
          className={selectClass}
        >
          <option value="" disabled>Select tenant</option>
          {tenants.map(ten => {
            const prop = properties.find(p => p.id === ten.propertyId);
            return (
              <option key={ten.id} value={ten.id}>
                {displayTenantNames(ten.tenantNames)} 
                {prop ? ` - ${prop.address}${prop.unit ? `, ${prop.unit}`: ''} (${prop.county})` : ' - (Property details missing)'}
                {prop?.propertyType === PropertyType.RESIDENTIAL && ten.isSubsidized ? ` (Subsidized: ${ten.subsidyType || 'Yes'})` : ''}
              </option>
            );
          })}
        </select>
        {selectedTenantId && !selectedProperty && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">Warning: Could not find associated property for the selected tenant.</p>
        )}
      </div>
      
      {selectedTenant && selectedProperty && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Selected Property Details:</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Address: {selectedProperty.address}{selectedProperty.unit ? `, ${selectedProperty.unit}` : ''}, {selectedProperty.city}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Type: {selectedProperty.propertyType} in {selectedProperty.county}</p>
        </div>
      )}

      <div className="space-y-2 my-4 p-4 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          <label className={labelClass}>Was this case entered as a "No Right of Redemption"? <span className="text-red-500">*</span></label>
          <p className="text-xs text-gray-500 dark:text-gray-400">This is a judgment where the tenant is not given the option to "pay and stay".</p>
          <div className="mt-2 flex items-center space-x-6 pt-1">
              <div className="flex items-center">
                  <input
                      id="nror-no"
                      name="noRightOfRedemption"
                      type="radio"
                      checked={!noRightOfRedemption}
                      onChange={() => setNoRightOfRedemption(false)}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600"
                  />
                  <label htmlFor="nror-no" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      No (Tenant can pay to stay)
                  </label>
              </div>
              <div className="flex items-center">
                  <input
                      id="nror-yes"
                      name="noRightOfRedemption"
                      type="radio"
                      checked={noRightOfRedemption}
                      onChange={() => setNoRightOfRedemption(true)}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-600"
                  />
                  <label htmlFor="nror-yes" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Yes (Tenant cannot pay to stay)
                  </label>
              </div>
          </div>
      </div>

      {!noRightOfRedemption && (
        <div>
          <label htmlFor="rentOwed" className={labelClass}>Amount Due to Redeem the Property ($) <span className="text-red-500">*</span></label>
          <input type="number" id="rentOwed" value={rentOwed} onChange={(e) => setRentOwed(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                 min="0.01" step="0.01" required
                 className={inputClass} />
        </div>
      )}
            
      {isThirtyDayNoticeRequired && (
         <div className="space-y-2 p-4 border border-orange-300 dark:border-orange-500/70 bg-orange-50 dark:bg-orange-900/30 rounded-md">
            <label htmlFor="thirtyDayNoticeFile" className={labelClass}>
                Upload 30-Day Notice to Tenant <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-300">
                A 30-day notice is required for tenants with subsidy type: <strong>{selectedTenant?.subsidyType}</strong>.
            </p>
            <input 
                type="file" 
                id="thirtyDayNoticeFile" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                aria-describedby="thirtyDayNoticeFileDesc"
                className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-300
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-800/50 dark:file:text-primary-200
                            hover:file:bg-primary-100 dark:hover:file:bg-primary-700/50
                            ${thirtyDayNoticeFileError ? 'border-red-500 dark:border-red-400 border p-1 rounded-md' : 'border-gray-300 dark:border-gray-600'}`} 
            />
            <p id="thirtyDayNoticeFileDesc" className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accepted formats: PDF, DOC, DOCX, JPG, PNG.</p>
            {thirtyDayNoticeFile && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Selected file: {thirtyDayNoticeFile.name}</p>}
            {thirtyDayNoticeFileError && <p className={errorTextClass} role="alert">{thirtyDayNoticeFileError}</p>}
        </div>
      )}

      <div>
        <label htmlFor="districtCourtCaseNumber" className={labelClass}>District Court Case Number (Full Case Number) <span className="text-red-500">*</span></label>
        <input type="text" id="districtCourtCaseNumber" value={districtCourtCaseNumber} 
               onChange={(e) => {
                setDistrictCourtCaseNumber(e.target.value);
                if(e.target.value.trim()) setDistrictCourtCaseNumberError('');
               }} 
               required
               className={`${inputClass} ${districtCourtCaseNumberError ? 'border-red-500 dark:border-red-400' : ''}`} />
        {districtCourtCaseNumberError && <p className={errorTextClass}>{districtCourtCaseNumberError}</p>}
      </div>

      <div>
        <label htmlFor="warrantOrderDate" className={labelClass}>Date Warrant Was Ordered by Court <span className="text-red-500">*</span></label>
        <input type="date" id="warrantOrderDate" value={warrantOrderDate} 
               onChange={(e) => {
                 setWarrantOrderDate(e.target.value);
                 if(e.target.value) setWarrantOrderDateError('');
               }}
               required
               className={`${inputClass} ${warrantOrderDateError ? 'border-red-500 dark:border-red-400' : ''}`} />
        {warrantOrderDateError && <p className={errorTextClass}>{warrantOrderDateError}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This can be found at <a href="https://casesearch.courts.state.md.us" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">casesearch.courts.state.md.us</a></p>
      </div>

      <div>
        <label htmlFor="initialEvictionDate" className={labelClass}>Initial Scheduled Date of Eviction <span className="text-red-500">*</span></label>
        <input type="date" id="initialEvictionDate" value={initialEvictionDate} 
               onChange={(e) => {
                 setInitialEvictionDate(e.target.value);
                 const today = new Date(); today.setHours(0,0,0,0);
                 const evictionD = new Date(e.target.value + "T00:00:00");
                 const diffTime = evictionD.getTime() - today.getTime();
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 if(e.target.value && diffDays >= 17) setInitialEvictionDateError('');
               }} 
               required
               className={`${inputClass} ${initialEvictionDateError ? 'border-red-500 dark:border-red-400' : ''}`} />
        {initialEvictionDateError && <p className={errorTextClass}>{initialEvictionDateError}</p>}
      </div>
      
      <div className="space-y-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Oath:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              "I do solemnly swear or affirm under the penalty of perjury that the matters and facts set forth above are true to the best of my knowledge, information, and belief."
          </p>
          <div>
              <label htmlFor="landlordSignature" className={`${labelClass} mt-2`}>
                  Type Your Full Name as Signature <span className="text-red-500">*</span>
              </label>
              <input 
                  type="text" 
                  id="landlordSignature" 
                  value={landlordSignature} 
                  onChange={(e) => {
                      setLandlordSignature(e.target.value);
                      if (e.target.value.trim()) setLandlordSignatureError('');
                  }} 
                  required
                  className={`${inputClass} ${landlordSignatureError ? 'border-red-500 dark:border-red-400' : ''}`}
                  placeholder="Your Full Name"
              />
              {landlordSignatureError && <p className={errorTextClass} role="alert">{landlordSignatureError}</p>}
          </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm">
          Cancel
        </button>
        <button type="submit"
                disabled={!selectedTenantId || (!noRightOfRedemption && rentOwed === '') || isLoading || (isThirtyDayNoticeRequired && !thirtyDayNoticeFile) || !landlordSignature.trim() || !districtCourtCaseNumber.trim() || !warrantOrderDate || !initialEvictionDate || !!initialEvictionDateError || !!pricingError || price <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">
          Add to Cart ({!pricingError && price > 0 ? `$${price.toFixed(2)}` : 'Invalid Price'})
        </button>
      </div>
    </form>
  );
};

export default FTPRForm;