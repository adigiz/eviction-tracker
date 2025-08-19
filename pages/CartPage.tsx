import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LegalCase, PaymentStatus, LegalCaseStatus } from "../types";
import { AuthContext } from "../App";
import * as Storage from "../services/localStorageService";
import * as StripeMockService from "../services/StripeMockService"; // Simulated Stripe service
import LoadingSpinner from "../components/LoadingSpinner";

const CartPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<LegalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.currentUser) {
      const unpaidCases = Storage.getLegalCases(auth.currentUser.id)
        .filter(
          (c) =>
            c.paymentStatus === PaymentStatus.UNPAID &&
            c.status === LegalCaseStatus.NOTICE_DRAFT
        )
        .sort(
          (a, b) =>
            new Date(b.dateInitiated).getTime() -
            new Date(a.dateInitiated).getTime()
        );
      setCartItems(unpaidCases);
    }
    setIsLoading(false);
  }, [auth?.currentUser]);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleRemoveFromCart = (caseId: string) => {
    if (
      window.confirm(
        "Are you sure you want to remove this request from your cart? It will be deleted permanently."
      )
    ) {
      Storage.deleteLegalCase(caseId); // Assuming a function to delete a case by ID
      const updatedCartItems = cartItems.filter((item) => item.id !== caseId);
      setCartItems(updatedCartItems);
      auth?.updateCartCount?.(); // Update navbar badge
    }
  };

  const handleProceedToCheckout = async () => {
    if (!auth?.currentUser || cartItems.length === 0) return;

    setIsProcessingPayment(true);
    setError(null);

    try {
      // Simulate backend call to create Stripe Checkout session
      const { sessionId, error: checkoutError } =
        await StripeMockService.createMockCheckoutSession(
          auth.currentUser.id,
          cartItems
        );

      if (checkoutError || !sessionId) {
        setError(
          checkoutError || "Failed to initiate checkout. Please try again."
        );
        setIsProcessingPayment(false);
        return;
      }

      // Update cart items in state to reflect PENDING_PAYMENT (though StripeMockService already did in localStorage)
      setCartItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          paymentStatus: PaymentStatus.PENDING_PAYMENT,
          stripeCheckoutSessionId: sessionId,
        }))
      );
      auth?.updateCartCount?.();

      // In a real Stripe Checkout (redirect) flow, you'd redirect to Stripe's hosted page.
      // Here, we simulate the redirect and immediate outcome.

      // Simulate Stripe processing delay and random outcome
      setTimeout(() => {
        const isSuccessful = Math.random() > 0.2; // 80% success rate for mock

        if (isSuccessful) {
          navigate(`/payment-success?session_id=${sessionId}`);
        } else {
          // Simulate Stripe redirecting to a cancel URL (or failure)
          // For simplicity, we'll use the same cancel page for now.
          // In a real app, Stripe handles this redirect.
          StripeMockService.processMockPaymentCancel(sessionId); // Ensure items revert if "Stripe" fails before redirect
          navigate(
            `/payment-cancel?session_id=${sessionId}&reason=mock_payment_failed`
          );
        }
        setIsProcessingPayment(false);
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred during checkout.");
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <LoadingSpinner text="Loading your cart..." />
      </div>
    );
  }

  const getPropertyAddress = (propertyId: string) => {
    if (!auth?.currentUser) return "N/A";
    const prop = Storage.getProperties(auth.currentUser.id).find(
      (p) => p.id === propertyId
    );
    return prop
      ? `${prop.address}${prop.unit ? `, ${prop.unit}` : ""}`
      : "Property details missing";
  };

  const getTenantNames = (tenantId: string) => {
    if (!auth?.currentUser) return "N/A";
    const tenant = Storage.getTenants(auth.currentUser.id).find(
      (t) => t.id === tenantId
    );
    return tenant?.tenantNames?.join(" & ") || "Tenant details missing";
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Your Cart
      </h1>
      {error && (
        <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-4">
          {error}
        </p>
      )}

      {isProcessingPayment ? (
        <LoadingSpinner text="Processing payment simulation..." size="lg" />
      ) : cartItems.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-16 w-16 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 011-1h8a1 1 0 110 2H7a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            Your cart is empty.
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add some eviction letter requests to get started.
          </p>
          <button
            onClick={() => navigate("/cases?action=new_ftpr")}
            className="mt-6 btn-primary-nav"
          >
            Submit New Request
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Request Details
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Tenant(s)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Property
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        Eviction Letter Request
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Ref: {item.id.substring(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Court Case #: {item.districtCourtCaseNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getTenantNames(item.tenantId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getPropertyAddress(item.propertyId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Remove from cart"
                        aria-label={`Remove request ${item.id.substring(
                          0,
                          8
                        )} from cart`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Total: ${totalAmount.toFixed(2)}
            </div>
            <button
              onClick={handleProceedToCheckout}
              disabled={cartItems.length === 0 || isProcessingPayment}
              className="mt-4 sm:mt-0 w-full sm:w-auto btn-primary disabled:opacity-50 flex items-center justify-center"
              aria-live="polite"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zm-7 4a1 1 0 100 2h4a1 1 0 100-2h-4z"
                  clipRule="evenodd"
                />
              </svg>
              Proceed to Checkout (Simulated)
            </button>
          </div>
        </div>
      )}
      <style>{`
        .btn-primary {
          @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors;
        }
        .btn-primary-nav { /* For navigation buttons that need primary styling */
            @apply py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors;
        }
      `}</style>
    </div>
  );
};

export default CartPage;
