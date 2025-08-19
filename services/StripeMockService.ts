
import { LegalCase, PaymentStatus, LegalCaseStatus } from '../types';
import * as Storage from './localStorageService';
import { STRIPE_CHECKOUT_SESSION_KEY_PREFIX } from '../constants';

// This service MOCKS Stripe interactions for a frontend-only environment.
// In a real application, these operations (especially creating checkout sessions)
// would be handled by a secure backend.

interface SimulatedCheckoutSession {
  id: string;
  clientSecret?: string; // Not strictly needed for redirect-based Checkout
  status: 'open' | 'complete' | 'expired';
  caseIds: string[]; // IDs of LegalCase items in this session
  totalAmount: number;
  userId: string;
  createdAt: number;
}

// Simulate backend creating a Stripe Checkout Session
export const createMockCheckoutSession = async (
  userId: string,
  items: LegalCase[]
): Promise<{ sessionId: string; error?: string }> => {
  if (!items || items.length === 0) {
    return { sessionId: '', error: "No items to checkout." };
  }

  const sessionId = `mock_cs_${Date.now()}_${Storage.generateId().substring(0, 8)}`;
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  const sessionData: SimulatedCheckoutSession = {
    id: sessionId,
    status: 'open',
    caseIds: items.map(item => item.id),
    totalAmount,
    userId,
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(`${STRIPE_CHECKOUT_SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(sessionData));
  } catch (e) {
    console.error("Failed to save mock checkout session:", e);
    return { sessionId: '', error: "Failed to create mock session." };
  }
  
  items.forEach(item => {
    const updatedCase = { 
      ...item, 
      paymentStatus: PaymentStatus.PENDING_PAYMENT,
      stripeCheckoutSessionId: sessionId 
    };
    Storage.updateLegalCase(updatedCase);
  });

  console.log(`Mock Checkout Session created: ${sessionId} for ${items.length} items, total $${totalAmount.toFixed(2)}`);
  return { sessionId };
};


export const retrieveMockCheckoutSession = (sessionId: string): SimulatedCheckoutSession | null => {
  try {
    const sessionStr = localStorage.getItem(`${STRIPE_CHECKOUT_SESSION_KEY_PREFIX}${sessionId}`);
    if (sessionStr) {
      return JSON.parse(sessionStr) as SimulatedCheckoutSession;
    }
  } catch(e) {
    console.error("Error retrieving mock session:", e);
  }
  return null;
};

export const processMockPaymentSuccess = (sessionId: string): { success: boolean, updatedCases?: LegalCase[], error?: string } => {
  const session = retrieveMockCheckoutSession(sessionId);
  if (!session || session.status !== 'open') {
    return { success: false, error: "Invalid or already processed session." };
  }

  const updatedCases: LegalCase[] = [];
  try {
    session.caseIds.forEach(caseId => {
      const caseItem = Storage.getAllLegalCasesForAdmin().find(c => c.id === caseId); 
      if (caseItem && caseItem.stripeCheckoutSessionId === sessionId) {
        const updatedCase: LegalCase = {
          ...caseItem,
          paymentStatus: PaymentStatus.PAID,
          status: LegalCaseStatus.SUBMITTED, // Status becomes SUBMITTED upon successful payment
          stripePaymentIntentId: `mock_pi_${Date.now()}` 
        };
        Storage.updateLegalCase(updatedCase);
        updatedCases.push(updatedCase);
      }
    });
    
    session.status = 'complete';
    localStorage.setItem(`${STRIPE_CHECKOUT_SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(session));
    
    console.log(`Mock Payment Success processed for session: ${sessionId}. Cases moved to SUBMITTED.`);
    return { success: true, updatedCases };

  } catch (error) {
    console.error("Error processing mock payment success:", error);
    return { success: false, error: "Error updating case statuses on payment success." };
  }
};


export const processMockPaymentCancel = (sessionId: string): { success: boolean, error?: string } => {
  const session = retrieveMockCheckoutSession(sessionId);
  if (!session || session.status !== 'open') {
    return { success: false, error: "Invalid or already processed/expired session for cancellation." };
  }

  try {
    session.caseIds.forEach(caseId => {
      const caseItem = Storage.getAllLegalCasesForAdmin().find(c => c.id === caseId);
      if (caseItem && caseItem.stripeCheckoutSessionId === sessionId && caseItem.paymentStatus === PaymentStatus.PENDING_PAYMENT) {
        const updatedCase: LegalCase = {
          ...caseItem,
          paymentStatus: PaymentStatus.UNPAID, 
          // status remains NOTICE_DRAFT or whatever it was before pending payment
        };
        Storage.updateLegalCase(updatedCase);
      }
    });
    
    session.status = 'expired'; 
    localStorage.setItem(`${STRIPE_CHECKOUT_SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(session));
    
    console.log(`Mock Payment Cancelled for session: ${sessionId}. Items reverted to Unpaid.`);
    return { success: true };

  } catch (error) {
    console.error("Error processing mock payment cancellation:", error);
    return { success: false, error: "Error updating case statuses on payment cancellation." };
  }
};