import { createClient } from '@supabase/supabase-js';
import { User, RegistrationData, County, SupabaseAuthUser } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          name: string;
          role: 'admin' | 'landlord' | 'contractor';
          phone?: string;
          address?: string;
          business_name?: string;
          referral_code?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          price_overrides?: Record<string, { price: number; unlocked: boolean }>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Helper function to convert Supabase profile to our User type
export const mapSupabaseProfileToUser = (supabaseProfile: any): User => ({
  id: supabaseProfile.id,
  username: supabaseProfile.username,
  name: supabaseProfile.name,
  businessName: supabaseProfile.business_name,
  role: supabaseProfile.role,
  phone: supabaseProfile.phone,
  address: supabaseProfile.address,
  city: supabaseProfile.city,
  state: supabaseProfile.state,
  zipCode: supabaseProfile.zip_code,
  referralCode: supabaseProfile.referral_code,
  priceOverrides: supabaseProfile.price_overrides || {},
});

// Helper function to convert our User type to Supabase profile insert format
export const mapUserToSupabaseProfileInsert = (user: User) => ({
  username: user.username,
  email: user.email,
  name: user.name,
  business_name: user.businessName,
  role: user.role,
  phone: user.phone,
  address: user.address,
  city: user.city,
  state: user.state,
  zip_code: user.zipCode,
  referral_code: user.referralCode,
  price_overrides: user.priceOverrides,
});
