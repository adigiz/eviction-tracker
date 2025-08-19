import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import * as StripeMockService from "../services/StripeMockService";
import LoadingSpinner from "../components/LoadingSpinner";
import { LegalCase } from "../types";

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [processedCases, setProcessedCases] = useState<LegalCase[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("No payment session ID found. Cannot confirm payment.");
      setIsLoading(false);
      return;
    }

    const processPayment = async () => {
      // Simulate backend verifying the session and updating order status
      const {
        success,
        updatedCases,
        error: processError,
      } = StripeMockService.processMockPaymentSuccess(sessionId);

      if (success && updatedCases) {
        setMessage(
          `Payment successful! Your ${
            updatedCases.length > 1 ? "requests are" : "request is"
          } now being processed.`
        );
        setProcessedCases(updatedCases);
        auth?.updateCartCount?.(); // Update cart badge in navbar
      } else {
        setError(
          processError ||
            "There was an issue confirming your payment. Please contact support."
        );
      }
      setIsLoading(false);
    };

    processPayment();
  }, [searchParams, auth]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <LoadingSpinner text="Confirming your payment..." size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg mx-auto">
        {error ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-red-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
              Payment Confirmation Issue
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
            {processedCases.length > 0 && (
              <div className="mb-6 text-left bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Processed Requests:
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {processedCases.map((c) => (
                    <li key={c.id}>
                      Ref: {c.id.substring(0, 8)} (Case #
                      {c.districtCourtCaseNumber || "N/A"}) - Status: {c.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <Link to="/cases" className="btn-primary">
          View My Requests
        </Link>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-secondary ml-3"
        >
          Back to Dashboard
        </button>
      </div>
      <style>{`
        .btn-primary { @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors; }
        .btn-secondary { @apply py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors; }
      `}</style>
    </div>
  );
};

export default PaymentSuccessPage;
