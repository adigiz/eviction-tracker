import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { RegistrationData } from '../types';

const SignUpPage: React.FC = () => {
    const [formData, setFormData] = useState<RegistrationData>({
        username: '',
        password: '',
        name: '',
        businessName: '',
        address: '',
        email: '',
        phone: '',
        referralCode: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    if (!auth) {
        return <p>Auth context is not available.</p>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.username.trim() || !formData.password || !formData.name.trim() || !formData.address.trim() || !formData.email.trim() || !formData.phone.trim()) {
            setFormError(`Please fill out all required fields.`);
            return;
        }

        if (formData.password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }
        
        auth.register(formData);
        // The register function in App.tsx will handle navigation on success
    };

    const inputFieldClasses = "mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const requiredSpan = <span className="text-red-500 dark:text-red-400">*</span>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-center text-primary-700 dark:text-primary-400 mb-8">Create Your Account</h1>
                {formError && (
                    <div className="bg-red-100 dark:bg-red-500/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{formError}</p>
                    </div>
                )}
                <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="username" className={labelClasses}>Username {requiredSpan}</label>
                            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className={inputFieldClasses} required autoComplete="username"/>
                        </div>
                         <div>
                            <label htmlFor="name" className={labelClasses}>Full Name / Company Name {requiredSpan}</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputFieldClasses} required autoComplete="name"/>
                        </div>
                        <div>
                            <label htmlFor="password" className={labelClasses}>Password {requiredSpan}</label>
                            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className={inputFieldClasses} required autoComplete="new-password"/>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password {requiredSpan}</label>
                            <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputFieldClasses} required autoComplete="new-password"/>
                        </div>
                         <div>
                            <label htmlFor="email" className={labelClasses}>Email Address {requiredSpan}</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputFieldClasses} required autoComplete="email"/>
                        </div>
                        <div>
                            <label htmlFor="phone" className={labelClasses}>Phone Number {requiredSpan}</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={inputFieldClasses} required autoComplete="tel"/>
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="address" className={labelClasses}>Mailing Address {requiredSpan}</label>
                            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className={inputFieldClasses} required autoComplete="street-address"/>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="businessName" className={labelClasses}>Business Name (Optional)</label>
                                <input type="text" name="businessName" id="businessName" value={formData.businessName || ''} onChange={handleChange} className={inputFieldClasses} />
                            </div>
                            <div>
                                <label htmlFor="referralCode" className={labelClasses}>Referral Code (Optional)</label>
                                <input type="text" name="referralCode" id="referralCode" value={formData.referralCode || ''} onChange={handleChange} className={inputFieldClasses} />
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <button
                            type="submit"
                            disabled={auth.isLoading}
                            className="w-full sm:w-auto flex justify-center py-3 px-8 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {auth.isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                Log in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
