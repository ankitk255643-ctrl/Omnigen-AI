import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

/**
 * Fetch a user profile by ID from the `profiles` table.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Ignore PGRST116 (No rows returned) as it just means the profile doesn't exist yet
    console.error('Error fetching profile:', error);
    throw error;
  }
  
  return data;
};

/**
 * Update an existing user profile in the `profiles` table.
 */
export const updateUserProfile = async (userId: string, updatedData: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
};

/**
 * Create a new user profile manually. 
 * Note: This is usually handled automatically via a Supabase Postgres Trigger on user signup,
 * but this function is provided as a fallback/manual override.
 */
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('profiles')
    .insert([
      { id: userId, ...profileData, updated_at: new Date().toISOString() }
    ]);

  if (error) throw error;
};
