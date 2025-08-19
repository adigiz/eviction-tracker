import React, { useContext, useState } from "react";
import { Link, NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { AuthContext, ThemeContext } from "../App";
import { APP_NAME } from "../constants";
import Modal from "./Modal";
import {
  generateBlankFinalNoticeOfEvictionDatePDF,
  generateBlankCertificateOfMailingPDF,
  generateBlankFirmbookPDF,
} from "../services/pdfService";
import AccountEditForm from "./forms/AccountEditForm";

const InstructionsPanel: React.FC = () => {
  const [baltimoreOpen, setBaltimoreOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);

  return (
    <div className="p-1">
      <div className="space-y-2">
        {/* Baltimore City */}
        <div>
          <button
            onClick={() => setBaltimoreOpen(!baltimoreOpen)}
            className="w-full text-left font-semibold p-3 bg-yellow-300 text-black rounded-md flex justify-between items-center transition-all duration-300 hover:bg-yellow-400"
            aria-expanded={baltimoreOpen}
            aria-controls="baltimore-instructions"
          >
            <span>Baltimore City Instructions</span>
            <span
              className={`transform transition-transform duration-300 ${
                baltimoreOpen ? "rotate-180" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>
          {baltimoreOpen && (
            <div
              id="baltimore-instructions"
              className="p-4 mt-1 bg-white dark:bg-gray-700 border border-yellow-300 dark:border-yellow-500 rounded-b-md"
            >
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Certificate of mailing letter needs to be mailed out{" "}
                  <strong>AT LEAST 14 days BEFORE</strong> the eviction date.
                </li>
                <li>
                  The letter must be posted to the front door of the
                  property/unit, <strong>AT LEAST 7 days BEFORE</strong> the
                  eviction date. You must <strong>SIGN AND DATE</strong> the
                  form when you post it.
                </li>
                <li>
                  The photo of your posting{" "}
                  <strong>MUST include a Date stamp</strong> in the photo. If
                  you don't know how to add one in your native camera app, you
                  can try the TimeStampCameraFree app. But{" "}
                  <strong>DO NOT include GPS location</strong>, JUST time &
                  date.
                </li>
                <li>
                  Make sure to retain your mailing receipt from the post office
                  and a copy of your certificate of mailing/firmbook.
                </li>
              </ul>
            </div>
          )}
        </div>
        {/* Other Counties */}
        <div>
          <button
            onClick={() => setOtherOpen(!otherOpen)}
            className="w-full text-left font-semibold p-3 bg-primary-100 dark:bg-primary-800/50 text-primary-800 dark:text-primary-200 rounded-md flex justify-between items-center transition-all duration-300 hover:bg-primary-200 dark:hover:bg-primary-800/80"
            aria-expanded={otherOpen}
            aria-controls="other-md-instructions"
          >
            <span>All Other Maryland Counties Instructions</span>
            <span
              className={`transform transition-transform duration-300 ${
                otherOpen ? "rotate-180" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>
          {otherOpen && (
            <div
              id="other-md-instructions"
              className="p-4 mt-1 bg-white dark:bg-gray-700 border border-primary-200 dark:border-primary-700 rounded-b-md"
            >
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Certificate of mailing letter needs to be mailed out{" "}
                  <strong>AT LEAST 7 days BEFORE</strong> the eviction date.
                </li>
                <li>
                  The letter must be posted to the front door of the
                  property/unit, <strong>AT LEAST 7 days BEFORE</strong> the
                  eviction date. You must <strong>SIGN AND DATE</strong> the
                  form when you post it.
                </li>
                <li>
                  The photo of your posting{" "}
                  <strong>MUST include a Date stamp</strong> in the photo. If
                  you don't know how to add one in your native camera app, you
                  can try the TimeStampCameraFree app. But{" "}
                  <strong>DO NOT include GPS location</strong>, JUST time &
                  date.
                </li>
                <li>
                  Make sure to retain your mailing receipt from the post office
                  and a copy of your certificate of mailing/firmbook.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResourcesPanel: React.FC = () => {
  return (
    <div className="p-1">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Downloadable Forms
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-3 text-red-500"
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
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Blank Final Notice of Eviction Date Form
            </span>
          </div>
          <button
            onClick={generateBlankFinalNoticeOfEvictionDatePDF}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
          >
            Download PDF
          </button>
        </div>
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-3 text-red-500"
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
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Certificate of Mailing (PS Form 3817)
            </span>
          </div>
          <button
            onClick={generateBlankCertificateOfMailingPDF}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
          >
            Download PDF
          </button>
        </div>
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-3 text-red-500"
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
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Firmbook (PS Form 3665)
            </span>
          </div>
          <button
            onClick={generateBlankFirmbookPDF}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const ThemeToggle: React.FC = () => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) return null;

  const { theme, toggleTheme } = themeContext;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-200 bg-white/10 hover:bg-white/20"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        // Moon icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        // Sun icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};

const Navbar: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [isInfoCenterModalOpen, setIsInfoCenterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleLogout = () => {
    auth?.logout();
    navigate("/login");
  };

  const isAdmin = auth?.currentUser?.role === "admin";
  const isContractor = auth?.currentUser?.role === "contractor";
  const cartItemCount = auth?.getCartItemCount ? auth.getCartItemCount() : 0;

  return (
    <>
      <nav
        className={`text-white shadow-lg ${
          isAdmin
            ? "bg-primary-700"
            : isContractor
            ? "bg-primary-700"
            : "bg-primary-700"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to={
                  isAdmin
                    ? "/admin/dashboard"
                    : isContractor
                    ? "/contractor/dashboard"
                    : "/dashboard"
                }
                className={`font-bold text-xl ${
                  isAdmin
                    ? "text-white hover:text-primary-200"
                    : isContractor
                    ? "text-white hover:text-primary-200"
                    : "text-white hover:text-primary-200"
                } transition-colors`}
              >
                {APP_NAME}{" "}
                {isAdmin && (
                  <span className="text-sm font-normal text-primary-200">
                    (Admin)
                  </span>
                )}{" "}
                {isContractor && (
                  <span className="text-sm font-normal">(Contractor)</span>
                )}
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {isAdmin ? (
                  <>
                    <NavLink to="/admin/dashboard">Admin Dashboard</NavLink>
                    <NavLink to="/admin/clients">Clients</NavLink>
                    <NavLink to="/admin/contractors">Contractors</NavLink>
                    <NavLink to="/admin/all-cases">All Cases</NavLink>
                    <NavLink to="/admin/law-firms">Law Firms</NavLink>
                  </>
                ) : isContractor ? (
                  <>
                    <NavLink to="/contractor/dashboard">Job Board</NavLink>
                    <button
                      onClick={() => {
                        setActiveTab("instructions"); // Default to instructions tab
                        setIsInfoCenterModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-md text-sm font-medium text-primary-200 hover:bg-primary-600 hover:text-white transition-colors"
                      aria-label="Open Info Center"
                    >
                      Info Center
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/tenants">Tenants</NavLink>
                    <NavLink to="/cases">Eviction Letters</NavLink>
                    <NavLink
                      to="/cart"
                      isCartLink={true}
                      cartItemCount={cartItemCount}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 inline-block mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                      Cart
                      {cartItemCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {cartItemCount}
                        </span>
                      )}
                    </NavLink>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              {auth?.currentUser && (
                <div className="flex items-center">
                  <div className="flex items-center space-x-2 mr-4">
                    <ThemeToggle />
                    {!isAdmin && (
                      <button
                        onClick={() => setIsAccountModalOpen(true)}
                        className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-200 bg-white/10 hover:bg-white/20"
                        aria-label="Open account settings"
                        title="My Account"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zM8 12a6 6 0 00-6 5.354V18h12v-.646A6 6 0 008 12z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <span
                    className={`mr-4 text-sm ${
                      isAdmin ? "text-white" : "text-white"
                    }`}
                  >
                    Welcome, {auth.currentUser.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`${
                      isAdmin
                        ? "bg-primary-600 hover:bg-primary-500"
                        : isContractor
                        ? "bg-primary-600 hover:bg-primary-500"
                        : "bg-primary-600 hover:bg-primary-500"
                    } text-white font-medium py-2 px-4 rounded-md text-sm transition-colors`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            <div className="-mr-2 flex md:hidden">
              <button className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <Modal
        isOpen={isInfoCenterModalOpen}
        onClose={() => setIsInfoCenterModalOpen(false)}
        title="Contractor Info Center"
        size="lg"
      >
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("instructions")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "instructions"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "resources"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              Resources
            </button>
          </nav>
        </div>
        <div className="pt-5">
          {activeTab === "instructions" && <InstructionsPanel />}
          {activeTab === "resources" && <ResourcesPanel />}
        </div>
      </Modal>

      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="My Account"
        size="2xl"
      >
        <AccountEditForm onClose={() => setIsAccountModalOpen(false)} />
      </Modal>
    </>
  );
};

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isCartLink?: boolean;
  cartItemCount?: number;
}

const NavLink: React.FC<NavLinkProps> = ({
  to,
  children,
  isCartLink = false,
  cartItemCount = 0,
}) => {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.currentUser?.role === "admin";
  const isContractor = auth?.currentUser?.role === "contractor";
  const baseActiveClassName = isAdmin
    ? "bg-primary-800 text-white"
    : isContractor
    ? "bg-primary-800 text-white"
    : "bg-primary-800 text-white";
  const baseInactiveClassName = isAdmin
    ? "text-primary-200 hover:bg-primary-600 hover:text-white"
    : isContractor
    ? "text-primary-200 hover:bg-primary-600 hover:text-white"
    : "text-primary-200 hover:bg-primary-600 hover:text-white";

  const activeClassName = `${baseActiveClassName} ${
    isCartLink && cartItemCount > 0 ? "animate-pulse" : ""
  }`;
  const inactiveClassName = `${baseInactiveClassName} ${
    isCartLink && cartItemCount > 0
      ? "text-yellow-300 hover:text-yellow-100"
      : ""
  }`;

  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
          isActive ? activeClassName : inactiveClassName
        }`
      }
    >
      {children}
    </RouterNavLink>
  );
};

export default Navbar;
