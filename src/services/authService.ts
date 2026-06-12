import { supabase } from '../lib/supabaseClient';

/**
 * Sign up a new user with email and password.
 * Also passes extraProfileData to the user metadata, which is used by the SQL trigger to populate the profiles table.
 */
export const signUpUser = async (email: string, password: string, extraProfileData: { full_name?: string } = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: extraProfileData,
    },
  });
  if (error) throw error;
  return data;
};

/**
 * Log in an existing user with email and password.
 */
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Log out the current user.
 */
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the currently logged in user session.
 */
export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user || null;
};

/**
 * Subscribe to authentication state changes.
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return subscription;
};
