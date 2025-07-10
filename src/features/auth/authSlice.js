// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  session: null,
  profile: null,
  isLoading: true, // Indicates if auth state is still being determined
  error: null,
};

// Async Thunk for user sign-in/sign-up
export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async ({ supabase, email, password, authMode, displayName }, { rejectWithValue, dispatch }) => {
    try {
      let data, error;
      if (authMode === 'signup') {
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName } // Store display_name in auth.users.user_metadata
          }
        }));
        if (error) throw error;
        if (data.user) {
          // If signup is successful, also create a profile entry in the 'profiles' table
          // This insert should happen AFTER successful user creation in auth.users
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, display_name: displayName }
          ]);
          if (profileError) throw profileError;
          // For signup, we don't immediately set session as user needs to confirm email
          // The onAuthStateChange listener will handle setting session once confirmed/logged in
          return { user: data.user, message: 'Sign up successful! Please check your email to confirm your account.' };
        }
      } else { // login
        ({ data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (error) throw error;
      }
      return data.session; // Return session for fulfilled action
    } catch (e) {
      // Dispatch a local error action to update the slice's error state
      dispatch(setAuthError(e.message));
      return rejectWithValue(e.message);
    }
  }
);

// Async Thunk for user sign-out
export const signOutUser = createAsyncThunk(
  'auth/signOutUser',
  async (supabase, { rejectWithValue, dispatch }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch(clearAuth()); // Clear auth state in Redux
      return true; // Indicate success
    } catch (e) {
      dispatch(setAuthError(e.message));
      return rejectWithValue(e.message);
    }
  }
);

// Async Thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async ({ supabase, userId }, { rejectWithValue, dispatch }) => {
    try {
      // Removed .single() to avoid 406 error if no profile exists yet
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId);

      if (error) throw error; // Handle any other Supabase errors

      // If data is an empty array (no profile found), set profile to null
      const profileData = data && data.length > 0 ? data[0] : null;
      dispatch(setProfile(profileData)); // Update profile in Redux
      return profileData;
    } catch (e) {
      dispatch(setAuthError(e.message));
      return rejectWithValue(e.message);
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
      state.isLoading = false;
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
    // Handle pending, fulfilled, and rejected states of async thunks
    builder
      .addCase(signInUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        // Session is handled by onAuthStateChange listener, not directly here for sign-in
        // For signup, a message might be returned
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Authentication failed.';
      })
      .addCase(signOutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        // State cleared by clearAuth reducer
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed.';
      })
      .addCase(fetchUserProfile.pending, (state) => {
        // Profile loading is part of overall auth loading, not separate
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        // Profile set by setProfile reducer
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch profile.';
      });
  },
});

export const { setSession, setProfile, setAuthLoading, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
