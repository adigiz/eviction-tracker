import { LegalCase, PaymentStatus, LegalCaseStatus } from '../types';
import * as Storage from './localStorageService';

export interface CartService {
  getCartItemCount: (userId: string) => number;
  updateCartCount: (userId: string) => void;
}

class LocalStorageCartService implements CartService {
  getCartItemCount(userId: string): number {
    try {
      const userCases = Storage.getLegalCases(userId);
      return userCases.filter(
        (c) =>
          c.paymentStatus === PaymentStatus.UNPAID &&
          c.status === LegalCaseStatus.NOTICE_DRAFT
      ).length;
    } catch (error) {
      console.warn('Failed to get cart count:', error);
      return 0;
    }
  }

  updateCartCount(userId: string): void {
    // This method exists for compatibility but the count is calculated on-demand
    // In a real app, you might want to cache this value
  }
}

export const cartService = new LocalStorageCartService();
