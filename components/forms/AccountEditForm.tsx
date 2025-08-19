import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../App';
import { User } from '../../types';

interface AccountEditFormProps {
  onClose: () => void;
}

const AccountEditForm: React.FC<AccountEditFormProps> = ({ onClose }) => {
    const auth = useContext(AuthContext);
    const currentUser = auth?.currentUser;

    const [formData, setFormData] = useState({
        name: '',
        businessName: '',
        address: '',
        email: '',
        phone: '',
    });
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [formError, setFormError] = useState('');
    
    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                businessName: currentUser.businessName || '',
                address: currentUser.address || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name) {
            setFormError("Name cannot be empty.");
            return;
        }

        const updates: Partial<User> = { ...formData };
        
        if (passwordData.newPassword) {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setFormError("New passwords do not match.");
                return;
            }
            updates.password = passwordData.newPassword;
        }

        auth?.updateProfile(updates);
        onClose();
    };

    if (!currentUser) return <p>Loading user data...</p>;
    
    const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const headingClass = "text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2 dark:border-gray-600";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {formError && <p className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{formError}</p>}
            
            <h3 className={headingClass}>Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className={labelClass}>Full Name / Company Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="businessName" className={labelClass}>Business Name (Optional)</label>
                    <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} className={inputClass} />
                </div>
                 <div>
                    <label htmlFor="email" className={labelClass}>Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="phone" className={labelClass}>Phone</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address" className={labelClass}>Mailing Address</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
                </div>
            </div>

            <h3 className={`${headingClass} pt-4`}>Change Password</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Leave these fields blank to keep your current password.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="newPassword" className={labelClass}>New Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className={inputClass} autoComplete="new-password"/>
                </div>
                <div>
                    <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className={inputClass} autoComplete="new-password"/>
                </div>
             </div>

             <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm">
                    Cancel
                </button>
                <button type="submit" disabled={auth?.isLoading} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">
                    {auth?.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

export default AccountEditForm;
