import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, RegistrationData } from '../types';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';
import { errorService } from '../services/errorService';
import { getActiveBackend } from '../config/backend';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const activeBackend = getActiveBackend();
        
        if (activeBackend === 'supabase') {
          setIsLoading(false);
        } else {
          const userResult = authService.getCurrentUser();
          if (userResult instanceof Promise) {
            const user = await userResult;
            if (user) {
              setCurrentUser(user);
              updateCartCount(user.id);
            }
          } else {
            if (userResult) {
              setCurrentUser(userResult);
              updateCartCount(userResult.id);
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.logout();
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const activeBackend = getActiveBackend();
    
    if (activeBackend === 'supabase') {
      import('../services/supabase').then(({ supabase }) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            
            if (event === 'SIGNED_IN' && session?.user) {
              if (!session.user.email_confirmed_at) {
                await supabase.auth.signOut();
                return;
              }
              
              try {
                // Get profile data for the authenticated user
                const { data: profileData, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                if (profileData && !error) {
                  // Import the mapping function
                  const { mapSupabaseProfileToUser } = await import('../services/supabase');
                  const user = mapSupabaseProfileToUser(profileData);
                  setCurrentUser(user);
                  updateCartCount(user.id);
                }
              } catch (error) {
                console.error('Error getting profile data:', error);
              }
            } else if (event === 'SIGNED_OUT') {
              setCurrentUser(null);
              setCartItemCount(0);
            }
          }
        );

        // Cleanup subscription
        return () => subscription.unsubscribe();
      });
    }
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
      
      setAuthError(null);
    } catch (error) {
      console.error('Registration error:', error);
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
