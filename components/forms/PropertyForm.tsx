import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Property, PropertyType, County, Tenant } from '../../types';
import { AuthContext } from '../../App';
import { generateId } from '../../services/localStorageService';
import { MARYLAND_STATE_CODE } from '../../constants';

interface PropertyFormProps {
  onSubmit: (data: { property: Property, tenant?: Tenant }) => void;
  onCancel: () => void;
  initialProperty?: Property | null;
  initialTenant?: Tenant | null;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, onCancel, initialProperty, initialTenant }) => {
  const auth = useContext(AuthContext);
  
  // Property States
  const [propertyType, setPropertyType] = useState<PropertyType>(PropertyType.RESIDENTIAL);
  const [address, setAddress] = useState('');
  const [unit, setUnit] = useState('');
  const [county, setCounty] = useState<County | ''>('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [description, setDescription] = useState('');

  // Property Error States
  const [propertyTypeError, setPropertyTypeError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [countyError, setCountyError] = useState('');
  const [cityError, setCityError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');


  // Tenant States
  const [tenantNames, setTenantNames] = useState<string[]>(['', '', '', '']);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Tenant Error States
  const [tenant1NameError, setTenant1NameError] = useState('');

  const availableCounties = useMemo(() => {
    if (!auth?.currentUser?.priceOverrides) {
        return [];
    }

    const unlockedCounties = Object.entries(auth.currentUser.priceOverrides)
        .filter(([, details]) => details.unlocked)
        .map(([countyName]) => countyName as County);
    
    // If we are editing a property, ensure its current county is in the list,
    // even if it has been locked since creation. This allows saving other edits
    // without being forced to change the county.
    if (initialProperty?.county && !unlockedCounties.includes(initialProperty.county)) {
        return [initialProperty.county, ...unlockedCounties].sort();
    }
    
    return unlockedCounties.sort();
  }, [auth?.currentUser, initialProperty]);


  useEffect(() => {
    // Initialize Property Fields
    if (initialProperty) {
      setPropertyType(initialProperty.propertyType || PropertyType.RESIDENTIAL);
      setAddress(initialProperty.address);
      setUnit(initialProperty.unit || '');
      setCounty(initialProperty.county || '');
      setCity(initialProperty.city);
      setZipCode(initialProperty.zipCode || '');
      setDescription(initialProperty.description || '');
    } else {
      setPropertyType(PropertyType.RESIDENTIAL);
      setAddress('');
      setUnit('');
      setCounty('');
      setCity('');
      setZipCode('');
      setDescription('');
    }

    // Initialize Tenant Fields
    if (initialTenant) {
        const names = [...(initialTenant.tenantNames || [])];
        while (names.length < 4) names.push(''); 
        setTenantNames(names.slice(0, 4));
        setEmail(initialTenant.email || '');
        setPhone(initialTenant.phone || '');
    } else {
        setTenantNames(['', '', '', '']);
        setEmail('');
        setPhone('');
    }

    // Clear all errors on initial load/data change
    setPropertyTypeError(''); setAddressError(''); setCountyError(''); setCityError(''); 
    setZipCodeError(''); setDescriptionError('');
    setTenant1NameError(''); 
  }, [initialProperty, initialTenant]);


  useEffect(() => {
    if (county === County.BALTIMORE_CITY) {
        setCity('Baltimore');
    }
  }, [county]);

  useEffect(() => {
    if (propertyType === PropertyType.COMMERCIAL) { 
        setTenantNames(prevNames => [prevNames[0], '', '', '']); 
    }
  }, [propertyType, initialTenant]);


  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setZipCode(numericValue.slice(0, 5));
    if (numericValue.length > 0 && numericValue.length < 5) {
      setZipCodeError('Zip code must be 5 digits.');
    } else {
      setZipCodeError('');
    }
  };

  const handleTenantNameChange = (index: number, value: string) => {
    const newNames = [...tenantNames];
    newNames[index] = value;
    setTenantNames(newNames);
    if (index === 0 && value.trim()) {
      setTenant1NameError('');
    }
  };


  const validateForm = (): boolean => {
    let isValid = true;
    // Property Validations
    if (!propertyType) { setPropertyTypeError('Property type is required.'); isValid = false; } else { setPropertyTypeError(''); }
    if (!address.trim()) { setAddressError('Address is required.'); isValid = false; } else { setAddressError(''); }
    if (!county) { setCountyError('County is required.'); isValid = false; } else { setCountyError(''); }
    if (!city.trim()) { setCityError('City is required.'); isValid = false; } else { setCityError(''); }
    if (!zipCode) { setZipCodeError('Zip code is required.'); isValid = false; }
    else if (zipCode.length !== 5) { setZipCodeError('Zip code must be 5 digits.'); isValid = false; }
    else { setZipCodeError(''); }
    if (!description.trim()) { setDescriptionError('For Eviction Posting is required.'); isValid = false; } else { setDescriptionError(''); }

    // Tenant Validations (only if tenant name 1 is filled)
    const tenant1Filled = tenantNames[0].trim() !== '';
    if (!tenant1Filled) { 
        setTenant1NameError('');
    }
    return isValid;
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) {
        alert("User not logged in.");
        return;
    }

    if (!validateForm()) {
      const missingPropertyFields = [
        !propertyType && "Property Type",
        !address.trim() && "Address",
        !county && "County",
        !city.trim() && "City",
        !zipCode && "Zip Code",
        !description.trim() && "For Eviction Posting"
      ].filter(Boolean).join(', ');
      
      let alertMsg = "";
      if (missingPropertyFields) alertMsg += `Please fill in required property fields: ${missingPropertyFields}. `;
      
      if (alertMsg && !Object.values({ ...propertyErrorStatesExceptZipAndType, ...tenantErrorStates, propertyTypeError }).some(err => err !== '')) {
         alert(alertMsg);
      }
      return; 
    }
    
    const propertyData: Property = {
      id: initialProperty?.id || generateId(),
      landlordId: auth.currentUser.id,
      propertyType,
      address: address.trim(),
      unit: unit.trim() || undefined,
      county: county as County, 
      city: city.trim(),
      state: MARYLAND_STATE_CODE,
      zipCode,
      description: description.trim(),
      builtBefore1978: undefined,
      leadCertificateNumber: undefined,
      isAACountyMultipleDwelling: undefined,
      rentalLicenseNumber: undefined,
      rentalLicenseExpirationDate: undefined,
    };

    let tenantData: Tenant | undefined = undefined;
    const activeTenantNamesRaw = tenantNames.map(name => name.trim()).filter(name => name !== '');
    
    if (activeTenantNamesRaw.length > 0) { 
        const finalTenantNames = (propertyType === PropertyType.COMMERCIAL)
                                 ? [activeTenantNamesRaw[0]].filter(Boolean) 
                                 : activeTenantNamesRaw;

        if (finalTenantNames.length > 0) {
            tenantData = {
              id: initialTenant?.id || generateId(),
              landlordId: auth.currentUser.id,
              propertyId: propertyData.id, 
              tenantNames: finalTenantNames,
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
            };
        }
    }
    onSubmit({ property: propertyData, tenant: tenantData });
  };

  const propertyErrorStatesExceptZipAndType = { countyError, descriptionError, addressError, cityError };
  const tenantErrorStates = { tenant1NameError };


  // Tenant section conditional display logic
  let tenant1Label = "Tenant 1 (First & Last Name)";
  if (propertyType === PropertyType.COMMERCIAL) {
    tenant1Label = "Tenant 1 (Name of person or business only)";
  }
  const showResidentialOnlyTenantFields = propertyType === PropertyType.RESIDENTIAL;
  const showTenant2Input = showResidentialOnlyTenantFields;
  const showTenant3Input = showResidentialOnlyTenantFields && tenantNames[1].trim() !== '';
  const showTenant4Input = showResidentialOnlyTenantFields && tenantNames[2].trim() !== ''; 

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const errorClass = "mt-1 text-xs text-red-500 dark:text-red-400";
  const headingClass = "text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2 dark:border-gray-600";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className={headingClass}>Property Type</h2>
      
      {/* Property Type - Moved to Top */}
      <div>
        <label htmlFor="propertyType" className={labelClass}>Property Type <span className="text-red-500">*</span></label>
        <select id="propertyType" value={propertyType} 
            onChange={(e) => { setPropertyType(e.target.value as PropertyType); if (e.target.value) setPropertyTypeError('');}} 
            className={`${selectClass} ${propertyTypeError ? 'border-red-500 dark:border-red-400' : ''}`}>
            <option value={PropertyType.RESIDENTIAL}>Residential</option>
            <option value={PropertyType.COMMERCIAL}>Commercial</option>
        </select>
        {propertyTypeError && <p className={errorClass}>{propertyTypeError}</p>}
      </div>

      {propertyType === PropertyType.COMMERCIAL && (
        <div className="p-3 my-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/50 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> A notice to the tenant is not required for Commercial properties, but you can still generate one if you wish.
          </p>
        </div>
      )}

      {/* Tenant Details Section - Moved Up */}
      <h2 className={`${headingClass} mt-8`}>Tenant Details <span className="text-sm text-gray-500 dark:text-gray-400">(Optional - fill Tenant 1 Name to add/edit tenant)</span></h2>
      
      <div>
        <label htmlFor="tenantName1" className={labelClass}>{tenant1Label} <span className={`text-red-500 ${tenantNames[0].trim() ? '*' : ''}`}></span></label>
        <input type="text" id="tenantName1" value={tenantNames[0]} onChange={(e) => handleTenantNameChange(0, e.target.value)}
          className={`${inputClass} ${tenant1NameError ? 'border-red-500 dark:border-red-400' : ''}`} />
        {tenant1NameError && <p className={errorClass}>{tenant1NameError}</p>}
      </div>

      {showTenant2Input && (
        <div>
          <label htmlFor="tenantName2" className={labelClass}>Tenant 2 (First & Last Name)</label>
          <input type="text" id="tenantName2" value={tenantNames[1]} onChange={(e) => handleTenantNameChange(1, e.target.value)}
            className={inputClass} />
        </div>
      )}
      {showTenant3Input && (
        <div>
          <label htmlFor="tenantName3" className={labelClass}>Tenant 3 (First & Last Name)</label>
          <input type="text" id="tenantName3" value={tenantNames[2]} onChange={(e) => handleTenantNameChange(2, e.target.value)}
            className={inputClass} />
        </div>
      )}
      {showTenant4Input && (
        <div>
          <label htmlFor="tenantName4" className={labelClass}>Tenant 4 (First & Last Name)</label>
          <input type="text" id="tenantName4" value={tenantNames[3]} onChange={(e) => handleTenantNameChange(3, e.target.value)}
            className={inputClass} />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={labelClass}>Email (Optional)</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone (Optional)</label>
          <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                 className={inputClass} />
        </div>
      </div>

      {/* Remaining Property Fields - Moved Down */}
      <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 mt-8 dark:border-gray-600">Property Location & Description</h3>
      <div>
        <label htmlFor="address" className={labelClass}>Address <span className="text-red-500">*</span></label>
        <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} 
               className={`${inputClass} ${addressError ? 'border-red-500 dark:border-red-400' : ''}`} />
        {addressError && <p className={errorClass}>{addressError}</p>}
      </div>

      <div>
        <label htmlFor="unit" className={labelClass}>
          Unit / Apt / Suite <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
        </label>
        <input type="text" id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}
          className={inputClass} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="county" className={labelClass}>County <span className="text-red-500">*</span></label>
          <select id="county" value={county} 
              onChange={(e) => { setCounty(e.target.value as County | ''); if (e.target.value) setCountyError(''); }}
              className={`${selectClass} ${countyError ? 'border-red-500 dark:border-red-400' : ''}`}>
              <option value="" disabled>Select a County</option>
              {availableCounties.length > 0 ? (
                availableCounties.map(countyVal => (
                  <option key={countyVal} value={countyVal}>{countyVal}</option>
                ))
              ) : (
                <option value="" disabled>No counties available for your account</option>
              )}
          </select>
          {countyError && <p className={errorClass}>{countyError}</p>}
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>City <span className="text-red-500">*</span></label>
          <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} 
                 className={`${inputClass} ${cityError ? 'border-red-500 dark:border-red-400' : ''}`} />
          {cityError && <p className={errorClass}>{cityError}</p>}
        </div>
        <div>
          <label htmlFor="zipCode" className={labelClass}>Zip Code <span className="text-red-500">*</span></label>
          <input type="text" id="zipCode" value={zipCode} onChange={handleZipCodeChange} maxLength={5} pattern="\d{5}" title="Zip code must be 5 digits."
            className={`${inputClass} ${zipCodeError ? 'border-red-500 dark:border-red-400' : ''}`} />
            {zipCodeError && <p className={errorClass}>{zipCodeError}</p>}
        </div>
      </div>
            
      <div>
        <label htmlFor="description" className={labelClass}>For Eviction Posting <span className="text-red-500">*</span></label>
        <textarea id="description" value={description} 
                  onChange={(e) => { setDescription(e.target.value); if (e.target.value.trim()) setDescriptionError(''); }}
                  rows={3}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 ${descriptionError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="How can our agent gain access to the front door of the property so they can post an eviction notice on the door of the property"></textarea>
        {descriptionError && <p className={errorClass}>{descriptionError}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Cancel
        </button>
        <button type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          {initialTenant ? 'Update Tenant & Property' : 'Add Tenant & Property'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;