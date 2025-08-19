import React from "react";
import { Outlet } from "react-router-dom";

export const AuthLayout: React.FC = () => {
  return (
    <main className="bg-gray-50 dark:bg-gray-900">
      <Outlet />
    </main>
  );
};
