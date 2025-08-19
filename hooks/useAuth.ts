import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, RegistrationData } from '../types';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';
import { errorService } from '../services/errorService';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

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
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      updateCartCount(user.id);
      errorService.showSuccess('Login successful!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      errorService.showError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateCartCount]);

  const register = useCallback(async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      const user = await authService.register(data);
      setCurrentUser(user);
      setCartItemCount(0);
      errorService.showSuccess('Registration successful!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      errorService.showError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setCartItemCount(0);
    errorService.showSuccess('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(currentUser.id, updatedData);
      setCurrentUser(updatedUser);
      errorService.showSuccess('Profile updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      errorService.showError(message);
      throw error;
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
  }), [currentUser, login, register, logout, isLoading, cartItemCount, updateCartCount, updateProfile]);

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
