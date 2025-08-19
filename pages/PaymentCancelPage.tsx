import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import * as StripeMockService from "../services/StripeMockService"; // Simulated Stripe service
import LoadingSpinner from "../components/LoadingSpinner";

const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const reason = searchParams.get("reason");

    if (sessionId) {
      // If payment was cancelled, items might have been reverted to UNPAID by StripeMockService
      // or by the checkout process if it simulated a pre-redirect failure.
      // We can call processMockPaymentCancel again to ensure idempotency or if not called before.
      StripeMockService.processMockPaymentCancel(sessionId);
      auth?.updateCartCount?.(); // Update cart badge
    }

    if (reason === "mock_payment_failed") {
      setMessage(
        "Your payment could not be processed at this time. Please try again or use a different payment method. Your items are still in your cart."
      );
    } else {
      setMessage(
        "Your payment was cancelled. Your items are still in your cart if you wish to try again."
      );
    }

    setIsLoading(false);
  }, [searchParams, auth]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <LoadingSpinner text="Processing cancellation..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-yellow-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="space-x-4">
          <Link to="/cart" className="btn-primary">
            Return to Cart
          </Link>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      <style>{`
        .btn-primary { @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors; }
        .btn-secondary { @apply py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors; }
      `}</style>
    </div>
  );
};

export default PaymentCancelPage;
