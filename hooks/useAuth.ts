import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, RegistrationData } from '../types';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';
import { errorService } from '../services/errorService';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          updateCartCount(user.id);
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const updateCartCount = useCallback((userId: string) => {
    const count = cartService.getCartItemCount(userId);
    setCartItemCount(count);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      updateCartCount(user.id);
      setAuthError(null);
      // No success toast - user is redirected to dashboard
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setAuthError(message);
      errorService.showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [updateCartCount]);

  const register = useCallback(async (data: RegistrationData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await authService.register(data);
      setCurrentUser(user);
      setCartItemCount(0);
      setAuthError(null);
      // Show success toast for registration since user stays on the same page
      errorService.showSuccess('Account created successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setAuthError(message);
      errorService.showError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setCartItemCount(0);
    setAuthError(null);
    // Show success toast for logout since user is redirected
    errorService.showSuccess('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setAuthError(null);
    try {
      const updatedUser = await authService.updateProfile(currentUser.id, updatedData);
      setCurrentUser(updatedUser);
      setAuthError(null);
      // Show success toast for profile updates
      errorService.showSuccess('Profile updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      setAuthError(message);
      errorService.showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const authContextValue = useMemo(() => ({
    currentUser,
    login,
    register,
    logout,
    isLoading,
    getCartItemCount: () => cartItemCount,
    updateCartCount,
    updateProfile,
    authError,
  }), [currentUser, login, register, logout, isLoading, cartItemCount, updateCartCount, updateProfile, authError]);

  return {
    currentUser,
    isLoading,
    cartItemCount,
    login,
    register,
    logout,
    updateProfile,
    updateCartCount,
    authContextValue,
  };
};
