// Backend Configuration
// This file allows you to easily switch between localStorage and Supabase

export type BackendType = 'localStorage' | 'supabase';

// Environment-based configuration
export const getBackendType = (): BackendType => {
  // Check if Supabase environment variables are set
  const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (hasSupabaseConfig) {
    return 'supabase';
  }
  
  return 'localStorage';
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return getBackendType() === 'supabase';
};

// Get the current backend type (respects environment variables)
// This is now a function call, not a static value
export const getActiveBackend = (): BackendType => getBackendType();
