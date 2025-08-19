import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Property, Tenant, PropertyType as PropertyTypeEnum } from '../types'; // Renamed PropertyType to PropertyTypeEnum to avoid conflict
import { AuthContext } from '../App';
import * as Storage from '../services/localStorageService';
import Modal from '../components/Modal';
import PropertyForm from '../components/forms/PropertyForm';

const PropertiesPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editingPropertyForTenant, setEditingPropertyForTenant] = useState<Property | null>(null);
  
  const location = useLocation();

  useEffect(() => {
    if (auth?.currentUser) {
      setProperties(Storage.getProperties(auth.currentUser.id));
      setTenants(Storage.getTenants(auth.currentUser.id));
    }
  }, [auth?.currentUser]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('action') === 'add') {
      handleAddTenantClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleAddTenantClick = () => {
    setEditingTenant(null);
    setEditingPropertyForTenant(null);
    setIsModalOpen(true);
  };

  const handleEditTenant = (tenantToEdit: Tenant) => {
    setEditingTenant(tenantToEdit);
    const associatedProperty = properties.find(p => p.id === tenantToEdit.propertyId);
    setEditingPropertyForTenant(associatedProperty || null);
    setIsModalOpen(true);
  };

  const handleDeleteTenant = (tenantId: string) => {
    if (window.confirm("Are you sure you want to delete this tenant? This action cannot be undone. The associated property will not be deleted.")) {
      if (auth?.currentUser) {
        Storage.deleteTenant(tenantId);
        setTenants(Storage.getTenants(auth.currentUser.id));
        // Associated property is not deleted, it remains.
      }
    }
  };

  const handleFormSubmit = ({ property, tenant }: { property: Property, tenant?: Tenant }) => {
    if (!auth?.currentUser) return;

    let propertyIdToLink = property.id;

    // Determine if we are updating an existing property or adding a new one
    const existingProperty = properties.find(p => p.id === property.id);
    if (existingProperty) {
      Storage.updateProperty(property);
    } else {
      Storage.addProperty(property);
    }
    // propertyIdToLink is property.id which is either from existing or newly generated in form

    if (tenant) {
      const tenantToSave: Tenant = { ...tenant, propertyId: propertyIdToLink };
      
      if (editingTenant && editingTenant.id === tenantToSave.id) { 
        Storage.updateTenant(tenantToSave);
      } else { 
        const existingTenantWithId = tenants.find(t => t.id === tenantToSave.id);
        if (existingTenantWithId) { 
             Storage.updateTenant(tenantToSave);
        } else { 
            Storage.addTenant(tenantToSave);
        }
      }
    } else if (editingTenant && !tenant) {
      // If tenant fields were cleared for an existing tenant, implies tenant should be unlinked or possibly deleted.
      // Current logic: do nothing to tenant if tenant data is not returned. 
      // If explicit deletion of tenant is desired when fields are cleared, add Storage.deleteTenant(editingTenant.id);
    }

    setProperties(Storage.getProperties(auth.currentUser.id));
    setTenants(Storage.getTenants(auth.currentUser.id));
    setIsModalOpen(false);
    setEditingTenant(null);
    setEditingPropertyForTenant(null);
  };
  
  const displayTenantNamesArray = (names: string[] | undefined): string => {
    if (!names || names.length === 0) return 'N/A';
    return names.join(' & ');
  };

  if (!auth?.currentUser) return <p className="p-4">Loading...</p>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Tenants & Properties</h1>
        <button
          onClick={handleAddTenantClick}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Add Tenant & Property
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.084-1.284-.24-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.084-1.284.24-1.857m0 0a5.002 5.002 0 019.52 0M12 12a5 5 0 110-10 5 5 0 010 10z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No tenants found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first tenant and property.</p>
            <button onClick={handleAddTenantClick} className="mt-6 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add Tenant & Property</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map(tenant => {
            const property = properties.find(p => p.id === tenant.propertyId);
            return (
              <div key={tenant.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl dark:shadow-gray-900/50 dark:hover:shadow-gray-700/50 transition-shadow duration-300 flex flex-col justify-between">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-400 mb-2">
                    {displayTenantNamesArray(tenant.tenantNames)}
                  </h2>
                  {tenant.email && <p className="text-sm text-gray-600 dark:text-gray-300">Email: {tenant.email}</p>}
                  {tenant.phone && <p className="text-sm text-gray-600 dark:text-gray-300">Phone: {tenant.phone}</p>}
                  
                  {property && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Associated Property</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{property.address}{property.unit ? `, ${property.unit}` : ''}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{property.city}, {property.state} {property.zipCode}</p>
                      {property.county && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">County: {property.county}</p>}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type: {property.propertyType || 'N/A'}</p>
                      {property.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic break-words">Eviction Posting Info: {property.description}</p>}
                    </div>
                  )}
                  {!property && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-red-500 dark:text-red-400">Property details not found for this tenant.</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 flex justify-end space-x-2">
                  <button onClick={() => handleEditTenant(tenant)} 
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 py-1 px-3 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">Edit</button>
                  <button onClick={() => handleDeleteTenant(tenant.id)}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 py-1 px-3 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">Delete Tenant</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTenant ? 'Edit Tenant & Property' : 'Add New Tenant & Property'} 
        size="3xl"
      >
        <PropertyForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          initialTenant={editingTenant}
          initialProperty={editingPropertyForTenant}
        />
      </Modal>
    </div>
  );
};

export default PropertiesPage;