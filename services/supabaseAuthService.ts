import { User, RegistrationData } from '../types';
import { supabase, mapSupabaseProfileToUser, mapUserToSupabaseProfileInsert } from './supabase';

export class SupabaseAuthService {
  async login(username: string, password: string): Promise<User> {
    try {
      // First, try to determine if the input is an email or username
      const isEmail = username.includes('@');
      
      let email = username;
      let profileData = null;

      if (!isEmail) {
        // If it's a username, we need to find the profile to get the email
        
        // Try to get profile by username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('username', username)
          .single();

        if (profileError || !profile) {
          throw new Error('Invalid username or password');
        }

        email = profile.email;
      }

      // Now attempt to sign in with the email
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        throw new Error('Invalid username or password');
      }


      // Get the profile data after successful sign in
      let { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileErr || !profile) {
        // Profile doesn't exist, create it using the auth user data
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: signInData.user.id,
            username: signInData.user.user_metadata?.username || `user_${signInData.user.id.slice(0, 8)}`,
            email: signInData.user.email,
            name: signInData.user.user_metadata?.name || 'Unknown User',
            role: signInData.user.user_metadata?.role || 'landlord',
            phone: null,
            address: null,
            business_name: null,
            referral_code: null,
          })
          .select()
          .single();

        if (createError || !newProfile) {
          throw new Error('Failed to create user profile');
        }

        profile = newProfile;
      }


      if (!signInData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Please check your email and click the confirmation link before signing in');
      }

      return mapSupabaseProfileToUser(profile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Helper method to create a profile for a user who doesn't have one
  private async createProfileForUser(userId: string, userData: any): Promise<User | null> {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'landlord',
          phone: userData.phone || null,
          address: userData.address || null,
          business_name: userData.businessName || null,
          referral_code: userData.referralCode || null,
        })
        .select()
        .single();

      if (profileData && !profileError) {
        return mapSupabaseProfileToUser(profileData);
      }
    } catch (error) {
      console.error('Failed to create profile for user:', error);
    }
    return null;
  }

  async register(data: RegistrationData): Promise<User> {
    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', data.username)
        .single();

      if (existingProfile) {
        throw new Error('Username already exists');
      }
      
      // Create user in Supabase Auth (this handles password hashing)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            name: data.name,
            role: 'landlord',
          }
        }
      });

      if (authError) {
        console.error('Supabase auth creation failed:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user?.id) {
        throw new Error('User creation failed - no user ID returned');
      }

      await supabase.auth.signOut();
      
      
      // Return a minimal user object - the profile will be created when they first log in
      return {
        id: authData.user.id,
        username: data.username,
        name: data.name,
        email: data.email,
        role: 'landlord' as const,
        phone: data.phone || undefined,
        address: data.address || undefined,
        businessName: data.businessName || undefined,
        referralCode: data.referralCode || undefined,
        priceOverrides: {},
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout(): void {
    // Sign out from Supabase Auth
    supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Get current user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        return null;
      }

      return mapSupabaseProfileToUser(profileData);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updatedData: Partial<User>): Promise<User> {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(mapUserToSupabaseProfileInsert(updatedData as User))
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }

      return mapSupabaseProfileToUser(updatedProfile);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async checkUserExists(username: string): Promise<boolean> {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      return !!existingProfile;
    } catch (error) {
      return false;
    }
  }
}
