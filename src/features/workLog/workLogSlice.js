// src/features/workLog/workLogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  myEntries: [],
  publicEntries: [],
  reviews: [], // New state for reviews
  isLoading: false, // Initial loading state for data fetching
  error: null,
  reviewsLoading: false, // Loading state for reviews
  reviewsError: null, // Error state for reviews
};

// Async Thunk for fetching user's private work logs
export const fetchMyWorkLogs = createAsyncThunk(
  'workLog/fetchMyWorkLogs',
  async ({ supabase, userId }, { rejectWithValue, dispatch }) => {
    dispatch(setWorkLogLoading(true)); // Set loading state
    try {
      const { data, error } = await supabase
        .from('work_log_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch(setMyEntries(data)); // Update state with fetched data
      return data;
    } catch (e) {
      dispatch(setWorkLogError(e.message)); // Dispatch local error action
      return rejectWithValue(e.message);
    } finally {
      // Ensure loading state is reset even on error
      dispatch(setWorkLogLoading(false));
    }
  }
);

// Async Thunk for fetching public work logs
export const fetchPublicWorkLogs = createAsyncThunk(
  'workLog/fetchPublicWorkLogs',
  async (supabase, { rejectWithValue, dispatch }) => {
    dispatch(setWorkLogLoading(true)); // Set loading state
    try {
      const { data, error } = await supabase
        .from('work_log_entries')
        .select('*, profiles(display_name)') // Join with profiles to get display name
        .eq('is_public', true)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch(setPublicEntries(data)); // Update state with fetched data
      return data;
    } catch (e) {
      dispatch(setWorkLogError(e.message)); // Dispatch local error action
      return rejectWithValue(e.message);
    } finally {
      // Ensure loading state is reset even on error
      dispatch(setWorkLogLoading(false));
    }
  }
);

// Async Thunk for fetching approved reviews
export const fetchApprovedReviews = createAsyncThunk(
  'workLog/fetchApprovedReviews',
  async (supabase, { rejectWithValue, dispatch }) => {
    dispatch(setReviewsLoading(true)); // Set loading state for reviews
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true) // Only fetch approved reviews
        .order('created_at', { ascending: false }); // Order by newest first

      if (error) throw error;
      dispatch(setReviews(data)); // Update state with fetched reviews
      return data;
    } catch (e) {
      dispatch(setReviewsError(e.message)); // Dispatch local error action for reviews
      return rejectWithValue(e.message);
    } finally {
      dispatch(setReviewsLoading(false)); // Ensure loading state is reset for reviews
    }
  }
);

// Async Thunk for adding or updating a work log entry
export const addOrUpdateWorkLog = createAsyncThunk(
  'workLog/addOrUpdateWorkLog',
  async ({ supabase, entryData }, { rejectWithValue, dispatch }) => {
    dispatch(setWorkLogLoading(true)); // Set loading state
    try {
      // --- IMPORTANT: Add a check for user_id here ---
      if (!entryData.user_id) {
        console.error("Attempted to add/update work log without a valid user_id:", entryData);
        // Dispatch an error or handle it as appropriate
        dispatch(setWorkLogError("User ID is missing for work log entry. Please ensure you are logged in."));
        return rejectWithValue("User ID is missing.");
      }
      // --- End of check ---

      let error;
      if (entryData.id) { // If ID exists, it's an update
        ({ error } = await supabase
          .from('work_log_entries')
          .update(entryData)
          .eq('id', entryData.id)
          .eq('user_id', entryData.user_id)); // Ensure user can only update their own entry
      } else { // Otherwise, it's a new entry
        ({ error } = await supabase
          .from('work_log_entries')
          .insert([entryData]));
      }

      if (error) throw error;
      // Data will be refetched by the real-time subscription in App.jsx (or explicit fetch)
      return true; // Indicate success
    } catch (e) {
      dispatch(setWorkLogError(e.message)); // Dispatch local error action
      return rejectWithValue(e.message);
    } finally {
      // Ensure loading state is reset even on error
      dispatch(setWorkLogLoading(false));
    }
  }
);

// Async Thunk for deleting a work log entry
export const deleteWorkLog = createAsyncThunk(
  'workLog/deleteWorkLog',
  async ({ supabase, id, userId }, { rejectWithValue, dispatch }) => {
    dispatch(setWorkLogLoading(true)); // Set loading state
    try {
      const { error } = await supabase
        .from('work_log_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure user can only delete their own entry

      if (error) throw error;
      // Data will be refetched by the real-time subscription in App.jsx
      return true; // Indicate success
    } catch (e) {
      dispatch(setWorkLogError(e.message)); // Dispatch local error action
      return rejectWithValue(e.message);
    } finally {
      // Ensure loading state is reset even on error
      dispatch(setWorkLogLoading(false));
    }
  }
);


const workLogSlice = createSlice({
  name: 'workLog',
  initialState,
  reducers: {
    // Synchronous reducers
    setMyEntries: (state, action) => {
      state.myEntries = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setPublicEntries: (state, action) => {
      state.publicEntries = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setReviews: (state, action) => { // New reducer for reviews
      state.reviews = action.payload;
      state.reviewsLoading = false;
      state.reviewsError = null;
    },
    setWorkLogLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setWorkLogError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setReviewsLoading: (state, action) => { // New reducer for reviews loading
      state.reviewsLoading = action.payload;
    },
    setReviewsError: (state, action) => { // New reducer for reviews error
      state.reviewsError = action.payload;
      state.reviewsLoading = false;
    },
    clearWorkLogs: (state) => {
      state.myEntries = [];
      state.publicEntries = [];
      state.reviews = []; // Clear reviews on logout
      state.isLoading = false;
      state.error = null;
      state.reviewsLoading = false;
      state.reviewsError = null;
    },
  },
  extraReducers: (builder) => {
    // Handle pending, fulfilled, and rejected states of async thunks
    builder
      // For fetchMyWorkLogs
      .addCase(fetchMyWorkLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyWorkLogs.fulfilled, (state) => {
        // State updated by setMyEntries reducer
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchMyWorkLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch my work logs.';
      })
      // For fetchPublicWorkLogs
      .addCase(fetchPublicWorkLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicWorkLogs.fulfilled, (state) => {
        // State updated by setPublicEntries reducer
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchPublicWorkLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch public work logs.';
      })
      // For fetchApprovedReviews (NEW)
      .addCase(fetchApprovedReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.reviewsError = null;
      })
      .addCase(fetchApprovedReviews.fulfilled, (state) => {
        // State updated by setReviews reducer
        state.reviewsLoading = false;
        state.reviewsError = null;
      })
      .addCase(fetchApprovedReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.reviewsError = action.payload || 'Failed to fetch reviews.';
      })
      // For addOrUpdateWorkLog
      .addCase(addOrUpdateWorkLog.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addOrUpdateWorkLog.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addOrUpdateWorkLog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to save work log.';
      })
      // For deleteWorkLog
      .addCase(deleteWorkLog.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWorkLog.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(deleteWorkLog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete work log.';
      });
  },
});

export const {
  setMyEntries,
  setPublicEntries,
  setReviews, // Export new action
  setWorkLogLoading,
  setWorkLogError,
  setReviewsLoading, // Export new action
  setReviewsError, // Export new action
  clearWorkLogs
} = workLogSlice.actions;
export default workLogSlice.reducer;
