// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  session: null,
  profile: null,
  isLoading: false,
  error: null,
};

// Async Thunk for fetching user profile
// Now accepts the 'user' object directly from the session
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async ({ supabase, userId, user }, { rejectWithValue }) => { // Added 'user' parameter
    try {
      // First, try to fetch the existing profile
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') { // No rows found (profile does not exist)
        console.log(`Profile for user ${userId} not found. Creating new profile.`);
        // --- ADDED FOR DEBUGGING: Log the user object to inspect its contents ---
        console.log("User object for new profile creation:", user);
        // --- END DEBUGGING ADDITION ---
        
        // Use the 'user' object passed from the session directly
        // No need for supabase.auth.admin.getUserById(userId) here
        if (!user) {
          console.error("User object is missing when attempting to create new profile.");
          return rejectWithValue("User data not available for profile creation.");
        }

        const newProfile = {
          id: userId,
          // Prioritize display_name from user_metadata (for email signup or if set by provider)
          // Fallback to full_name, then name, then email
          display_name: user.user_metadata.display_name ||
                        user.user_metadata.full_name ||
                        user.user_metadata.name ||
                        user.email,
          // Add other default profile fields if necessary
          avatar_url: user.user_metadata.avatar_url || null,
        };

        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting new profile:", insertError.message);
          throw insertError;
        }
        profile = insertedProfile;

      } else if (error) {
        console.error("Error fetching profile:", error.message);
        throw error;
      }

      return profile;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

// Async Thunk for signing in a user (email/password)
// Note: Social logins are handled directly in LoginPage using supabase.auth.signInWithOAuth
export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async ({ supabase, email, password, authMode, displayName }, { rejectWithValue, dispatch }) => {
    dispatch(setAuthLoading(true));
    try {
      let data, error;
      if (authMode === 'signup') {
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName } // Pass display_name to user_metadata
          }
        }));
      } else {
        ({ data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
      }

      if (error) throw error;
      
      // If sign-up/in is successful, ensure profile is fetched/created
      if (data.user) {
        // Pass the 'user' object directly to fetchUserProfile
        await dispatch(fetchUserProfile({ supabase, userId: data.user.id, user: data.user }));
      }

      return data.session;
    } catch (e) {
      dispatch(setAuthError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setAuthLoading(false));
    }
  }
);

// Async Thunk for signing out a user
export const signOutUser = createAsyncThunk(
  'auth/signOutUser',
  async (supabase, { rejectWithValue, dispatch }) => {
    dispatch(setAuthLoading(true));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch(clearAuth()); // Clear auth state on successful logout
      return true;
    } catch (e) {
      dispatch(setAuthError(e.message));
      return rejectWithValue(e.message);
    } finally {
      dispatch(setAuthLoading(false));
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous reducers
    setSession: (state, action) => {
      state.session = action.payload;
      state.isLoading = false; // Session status determines initial loading
      state.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.session = null;
      state.profile = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUserProfile lifecycle
      .addCase(fetchUserProfile.pending, (state) => {
        // state.isLoading = true; // Handled by setAuthLoading in App.jsx
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        // state.isLoading = false; // Handled by setAuthLoading in App.jsx
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profile = null;
        // state.isLoading = false; // Handled by setAuthLoading in App.jsx
        state.error = action.payload || 'Failed to fetch user profile.';
      });
  },
});

export const { setSession, setProfile, setAuthLoading, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
