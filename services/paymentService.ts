import { LegalCase } from '../types';
import { api } from './api';

export const paymentService = {
  createCheckoutSession: async (items: LegalCase[]): Promise<{ checkoutUrl: string }> => {
    // In a real app, the backend would create a Stripe Checkout session
    // and return the URL to redirect the user to.
    const itemIds = items.map(item => item.id);
    // This endpoint now needs to exist on the backend
    return api.checkout.createSession({ itemIds });
  },

  verifyPaymentSession: async (sessionId: string): Promise<{ success: boolean; cases: LegalCase[] }> => {
    // This function would be called on the success page. It asks our backend
    // if the payment for this session was successful (which the backend knows
    // from Stripe webhooks).
    return api.checkout.verifySession(sessionId);
  },

  handleCancelledPayment: async (sessionId: string): Promise<{ success: boolean }> => {
      // This function informs the backend that the user has cancelled, allowing for cleanup
      // of any pending payment states.
      return api.checkout.cancelSession({ sessionId });
  }
};
