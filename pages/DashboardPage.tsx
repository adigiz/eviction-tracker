import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import { Property, Tenant, LegalCase, LegalCaseStatus } from "../types";
import {
  getProperties,
  getTenants,
  getLegalCases,
} from "../services/localStorageService";
import Modal from "../components/Modal";
import { OFFICE_EMAIL_ADDRESS } from "../constants";
import { errorService } from "../services/errorService";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  linkTo?: string;
  icon?: React.ReactNode;
}> = ({ title, value, linkTo, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl dark:shadow-gray-900/50 dark:hover:shadow-gray-700/50 transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-semibold text-gray-800 dark:text-white">
          {value}
        </p>
      </div>
      {icon && (
        <div className="text-primary-500 dark:text-primary-400">{icon}</div>
      )}
    </div>
    {linkTo && (
      <Link
        to={linkTo}
        className="mt-4 inline-block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
      >
        View Details &rarr;
      </Link>
    )}
  </div>
);

const DashboardPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);

  // State for email modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    if (auth?.currentUser) {
      setProperties(getProperties(auth.currentUser.id));
      setTenants(getTenants(auth.currentUser.id));
      setCases(getLegalCases(auth.currentUser.id));
    }
  }, [auth?.currentUser]);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) return;

    const emailContent = `
--- EMAIL SIMULATION ---
This is a simulated email. In a real application, this would be sent via an email service.

From: ${auth.currentUser.name}
To: ${OFFICE_EMAIL_ADDRESS}
Subject: ${emailSubject}
--------------------------
Message Body:
${emailBody}
--------------------------
    `;
    errorService.showInfo("Email content copied to clipboard!");

    // Reset and close
    setEmailSubject("");
    setEmailBody("");
    setIsEmailModalOpen(false);
  };

  if (!auth?.currentUser) {
    return (
      <p className="p-8 text-center">Loading user data or not logged in...</p>
    );
  }

  const activeCasesCount = cases.filter(
    (c) => c.status !== LegalCaseStatus.COMPLETE
  ).length;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Welcome, {auth.currentUser.name}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Total Tenants"
          value={tenants.length}
          linkTo="/tenants"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          }
        />
        <StatCard
          title="Active Requests"
          value={activeCasesCount} // Use the new count for active cases
          linkTo="/cases"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Quick Actions
        </h2>
        <div className="space-y-3">
          <QuickActionLink
            to="/tenants"
            text="Manage Tenants"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          />
          <QuickActionLink
            to="/cases?action=new_ftpr"
            text="Submit New Request"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="block w-full text-left px-4 py-3 bg-primary-50 dark:bg-primary-900/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-medium rounded-md transition-colors flex items-center"
          >
            <span className="mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </span>
            Email the Office
          </button>
        </div>
      </div>

      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Email the Office"
        size="lg"
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              From:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {auth.currentUser.name}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {OFFICE_EMAIL_ADDRESS}
              </span>
            </p>
          </div>
          <div>
            <label
              htmlFor="emailSubject"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subject
            </label>
            <input
              type="text"
              id="emailSubject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label
              htmlFor="emailBody"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Message
            </label>
            <textarea
              id="emailBody"
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 border border-transparent rounded-md shadow-sm"
            >
              Send Email (Simulated)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const QuickActionLink: React.FC<{
  to: string;
  text: string;
  icon: React.ReactNode;
}> = ({ to, text, icon }) => (
  <Link
    to={to}
    className="block w-full text-left px-4 py-3 bg-primary-50 dark:bg-primary-900/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-medium rounded-md transition-colors flex items-center"
  >
    <span className="mr-3">{icon}</span>
    {text}
  </Link>
);

export default DashboardPage;
