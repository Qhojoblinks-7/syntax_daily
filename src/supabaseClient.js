    import { createClient } from '@supabase/supabase-js';

    // Ensure these are your actual keys from .env
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Validate that environment variables are loaded
    if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
      console.error('Supabase URL is not configured. Please check your .env file.');
    }
    if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
      console.error('Supabase Anon Key is not configured. Please check your .env file.');
    }

    // Create a single Supabase client instance
    export const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Optional: Log to confirm it's initialized
    console.log("Supabase client initialized from supabaseClient.js");
    