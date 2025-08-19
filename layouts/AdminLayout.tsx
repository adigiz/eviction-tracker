import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { APP_NAME } from "../constants";

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Outlet />
      </main>
      <footer className="text-center p-4 text-xs bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white">
        &copy; {new Date().getFullYear()} {APP_NAME}. For demonstration purposes
        only. Not legal advice.
      </footer>
    </div>
  );
};
