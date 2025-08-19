import React, { useEffect, useState, useContext, useMemo } from 'react';
import { User, LegalCase } from '../../types';
import * as Storage from '../../services/localStorageService';
import { AuthContext } from '../../App';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

interface MonthlyAnalytics {
    [monthYear: string]: {
        [contractorId: string]: {
            contractorName: string;
            completionCount: number;
        }
    }
}

interface AllTimeAnalytics {
    [contractorId: string]: {
        totalCompletions: number;
    }
}

const AdminContractorListPage: React.FC = () => {
    const auth = useContext(AuthContext);
    const [contractors, setContractors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modals state
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingContractor, setEditingContractor] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', email: '', phone: '' });
    const [formError, setFormError] = useState('');

    // Analytics State
    const [analyticsData, setAnalyticsData] = useState<MonthlyAnalytics>({});
    const [allTimeStats, setAllTimeStats] = useState<AllTimeAnalytics>({});

    const loadData = () => {
        const allCases = Storage.getAllLegalCasesForAdmin();
        const allContractors = Storage.getAllContractorUsers();
        
        setContractors(allContractors);

        const contractorMap = new Map(allContractors.map(c => [c.id, c]));
        const monthlyData: MonthlyAnalytics = {};
        const allTimeData: AllTimeAnalytics = {};
        
        allContractors.forEach(c => {
            allTimeData[c.id] = { totalCompletions: 0 };
        });

        allCases.forEach(c => {
            if (c.contractorId && c.postingCompletedAt) {
                const contractor = contractorMap.get(c.contractorId);
                if (contractor) {
                    // All-Time stats
                    allTimeData[contractor.id].totalCompletions += 1;

                    // Monthly stats
                    const monthYear = new Date(c.postingCompletedAt).toLocaleString('default', { month: 'long', year: 'numeric' });

                    if (!monthlyData[monthYear]) {
                        monthlyData[monthYear] = {};
                    }
                    if (!monthlyData[monthYear][contractor.id]) {
                        monthlyData[monthYear][contractor.id] = {
                            contractorName: contractor.name,
                            completionCount: 0,
                        };
                    }
                    monthlyData[monthYear][contractor.id].completionCount += 1;
                }
            }
        });
        
        setAnalyticsData(monthlyData);
        setAllTimeStats(allTimeData);
    };


    useEffect(() => {
        if (auth?.currentUser?.role === 'admin') {
            loadData();
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [auth?.currentUser]);
    
    const sortedMonths = useMemo(() => {
        const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return Object.keys(analyticsData).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            if (yearA !== yearB) {
                return parseInt(yearB) - parseInt(yearA);
            }
            return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
        });
    }, [analyticsData]);

    const handleDownloadCSV = (month: string, dataForMonth: MonthlyAnalytics[string]) => {
        const csvHeader = ["Contractor", "Completed Postings"];
        
        const csvRows = Object.values(dataForMonth).map(contractor => [
            `"${contractor.contractorName.replace(/"/g, '""')}"`,
            contractor.completionCount,
        ]);
    
        const csvContent = [csvHeader.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const safeMonth = month.replace(/\s+/g, '-');
        link.setAttribute("download", `Contractor-Report-${safeMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const openAddModal = () => {
        setEditingContractor(null);
        setFormData({ name: '', username: '', password: '', email: '', phone: '' });
        setFormError('');
        setIsAddEditModalOpen(true);
    };

    const openEditModal = (contractor: User) => {
        setEditingContractor(contractor);
        setFormData({ 
            name: contractor.name, 
            username: contractor.username, 
            password: '', 
            email: contractor.email || '', 
            phone: contractor.phone || '' 
        });
        setFormError('');
        setIsAddEditModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSave = () => {
        setFormError('');
        const { name, username, password, email, phone } = formData;
        if (!name.trim() || !username.trim() || !email.trim()) {
            setFormError('Name, Username, and Email are required.');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setFormError('Please enter a valid email address.');
            return;
        }

        const allUsers = Storage.getAllRegisteredUsers();
        if (allUsers.some(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== editingContractor?.id)) {
            setFormError('This username is already taken.');
            return;
        }

        if (editingContractor) { // Editing existing contractor
             if (!password.trim() && !editingContractor.password) {
                setFormError("Password is required for a user that doesn't have one set.");
                return;
            }
            const updatedContractor: User = {
                ...editingContractor,
                name: name.trim(),
                username: username.trim(),
                password: password.trim() ? password.trim() : editingContractor.password,
                email: email.trim(),
                phone: phone.trim() || undefined,
            };
            Storage.persistUser(updatedContractor);
        } else { // Adding new contractor
            if (!password.trim()) {
                setFormError('Password is required for new contractors.');
                return;
            }
            const newContractor: User = {
                id: `contractor_${Storage.generateId()}`,
                role: 'contractor',
                name: name.trim(),
                username: username.trim(),
                password: password.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
            };
            Storage.persistUser(newContractor);
        }
        
        loadData();
        setIsAddEditModalOpen(false);
    };

    const handleDelete = (contractor: User) => {
        if (window.confirm(`Are you sure you want to delete contractor "${contractor.name}"? This action cannot be undone.`)) {
            Storage.deleteUser(contractor.id);
            loadData();
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="Loading contractors..." size="lg" />;
    }

    if (auth?.currentUser?.role !== 'admin') {
        return <p className="p-8 text-center text-red-500">Access Denied. Admin privileges required.</p>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-8">Contractors & Analytics</h1>

            {/* Management Section */}
            <div className="mt-8">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-100">Manage Contractor Accounts</h2>
                    <button onClick={openAddModal} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Contractor
                    </button>
                </div>

                {contractors.length === 0 ? (
                    <div className="text-center py-10 bg-gray-800 rounded-lg shadow">
                        <h3 className="mt-2 text-lg font-medium text-gray-100">No contractors found</h3>
                        <p className="mt-1 text-sm text-gray-400">Add a contractor to get started.</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Completed Jobs (All-Time)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {contractors.map(contractor => (
                                    <tr key={contractor.id} className="hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{contractor.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <div className="text-gray-300">{contractor.email || 'No Email'}</div>
                                            <div>{contractor.phone || 'No Phone'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{contractor.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center font-bold">{allTimeStats[contractor.id]?.totalCompletions || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            <button onClick={() => openEditModal(contractor)} className="text-yellow-400 hover:text-yellow-300 hover:underline">
                                                Manage Account
                                            </button>
                                            <button onClick={() => handleDelete(contractor)} className="text-red-400 hover:text-red-300 hover:underline">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Monthly Analytics Section */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold text-gray-100 mb-6">Monthly Performance Analytics</h2>
                {sortedMonths.length === 0 ? (
                    <div className="text-center py-10 bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-100">No Job Completion Data Found</h3>
                        <p className="mt-1 text-sm text-gray-400">No contractors have completed posting jobs yet.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedMonths.map(month => (
                            <div key={month} className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
                                <div className="px-6 py-4 bg-gray-700/50 border-b border-gray-700 flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-gray-200">{month}</h3>
                                    <button
                                        onClick={() => handleDownloadCSV(month, analyticsData[month])}
                                        className="inline-flex items-center py-1.5 px-3 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                        aria-label={`Download spreadsheet for ${month}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Download Report
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contractor</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Completed Jobs</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                                            {Object.entries(analyticsData[month]).sort(([, a], [, b]) => b.completionCount - a.completionCount).map(([contractorId, contractorData]) => (
                                                <tr key={contractorId} className="hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{contractorData.contractorName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">{contractorData.completionCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isAddEditModalOpen && (
                <Modal isOpen={isAddEditModalOpen} onClose={() => setIsAddEditModalOpen(false)} title={editingContractor ? "Manage Contractor Account" : "Add New Contractor"} size="2xl">
                    <div className="space-y-4 text-gray-200">
                        {formError && <p className="text-sm text-red-300 bg-red-500/20 p-2 rounded-md">{formError}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Name <span className="text-red-400">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="mt-1 block w-full input-form" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Username <span className="text-red-400">*</span></label>
                                <input type="text" name="username" value={formData.username} onChange={handleFormChange} className="mt-1 block w-full input-form" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Email <span className="text-red-400">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleFormChange} className="mt-1 block w-full input-form" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Phone (Optional)</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} className="mt-1 block w-full input-form" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Password {!editingContractor && <span className="text-red-400">*</span>}</label>
                                <input type="password" name="password" value={formData.password} onChange={handleFormChange} className="mt-1 block w-full input-form" placeholder={editingContractor ? "Leave blank to keep unchanged" : ""} />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                            <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="button" onClick={handleSave} className="btn-primary">Save</button>
                        </div>
                    </div>
                </Modal>
            )}

            <style>{`
                .btn-primary { @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md; }
                .btn-secondary { @apply px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 hover:bg-gray-500 border border-gray-500 rounded-md; }
                .input-form { @apply mt-1 block w-full px-3 py-2 text-base border border-gray-600 bg-gray-900 text-gray-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500; }
            `}</style>
        </div>
    );
};

export default AdminContractorListPage;