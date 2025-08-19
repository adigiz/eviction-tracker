
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../App';
import { User, LegalCase, Property, Tenant, LegalCaseStatus } from '../../types';
import * as Storage from '../../services/localStorageService';

const StatCard: React.FC<{ title: string; value: string | number; linkTo?: string; icon?: React.ReactNode, bgColorClass?: string }> = ({ title, value, linkTo, icon, bgColorClass = 'bg-gray-800' }) => (
  <div className={`${bgColorClass} p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-semibold text-white">{value}</p>
      </div>
      {icon && <div className="text-primary-400">{icon}</div>}
    </div>
    {linkTo && (
      <Link to={linkTo} className="mt-4 inline-block text-sm text-primary-400 hover:text-primary-300 font-medium">
        Manage &rarr;
      </Link>
    )}
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [totalLandlords, setTotalLandlords] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);


  useEffect(() => {
    if (auth?.currentUser?.role === 'admin') {
      const allCases = Storage.getAllLegalCasesForAdmin();
      setTotalLandlords(Storage.getAllLandlordUsers().length);
      setTotalSubmissions(allCases.length);
      
      const openCases = allCases.filter(c => 
        c.status !== LegalCaseStatus.COMPLETE
      ).length;
      setOpenRequestsCount(openCases);
    }
  }, [auth?.currentUser]);

  if (auth?.currentUser?.role !== 'admin') {
    return <p className="p-8 text-center text-red-500">Access Denied. Admin privileges required.</p>;
  }
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Admin Dashboard</h1>
      <p className="text-gray-300 mb-6">Welcome, {auth?.currentUser?.name}. Overview of the platform:</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Clients" 
          value={totalLandlords} 
          linkTo="/admin/clients"
          bgColorClass="bg-gray-800"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
        />
        <StatCard 
          title="Total Submissions" 
          value={totalSubmissions} 
          linkTo="/admin/all-cases"
          bgColorClass="bg-gray-800"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <StatCard
          title="Open Requests"
          value={openRequestsCount}
          linkTo="/admin/all-cases" // Or a dedicated page later: /admin/open-requests
          bgColorClass="bg-gray-800"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Quick Links</h2>
          <ul className="space-y-2">
            <li><Link to="/admin/clients" className="text-primary-400 hover:underline">Manage Clients</Link></li>
            <li><Link to="/admin/all-cases" className="text-primary-400 hover:underline">View All Submissions</Link></li>
            {/* Add more links as needed */}
          </ul>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">System Status</h2>
          <p className="text-gray-300">All systems operational.</p>
          {/* More status details can be added here */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
