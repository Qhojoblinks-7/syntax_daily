import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClient } from '@supabase/supabase-js';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Import the LandingPage component
import LandingPage from './LandingPage';
// Import the LoginPage component
import LoginPage from './features/auth/LoginPage';
// Import the new DashboardPage component
import DashboardPage from './DashboardPage'; // New import

// Import Redux actions and thunks
import {
  setSession,
  setProfile,
  setAuthLoading,
  setAuthError,
  fetchUserProfile
} from './features/auth/authSlice';

// Initialize Supabase client once outside the component to prevent multiple instances
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


function App() {
  const dispatch = useDispatch();
  const { session, isLoading: authLoading, error: authError } = useSelector((state) => state.auth);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for Supabase configuration
    if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
      dispatch(setAuthError("Supabase URL or Anon Key not configured. Please check your environment variables."));
      return;
    }

    dispatch(setAuthLoading(true));

    // Supabase Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setSession(session));
      if (session?.user) {
        // Ensure profile is fetched/created before allowing other operations
        // Pass session.user to fetchUserProfile for metadata
        dispatch(fetchUserProfile({ supabase, userId: session.user.id, user: session.user }));

        // If user logs in/signs up and is on a public/auth page, redirect to dashboard
        if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
            navigate('/dashboard');
        }
      } else {
        dispatch(setProfile(null)); // Clear profile on logout
        // If user logs out and is on a protected route, redirect to login
        if (location.pathname !== '/login' && location.pathname !== '/signup' && location.pathname !== '/') {
            navigate('/login');
        }
      }
      dispatch(setAuthLoading(false)); // Set loading to false after initial auth check
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setSession(session));
      if (session?.user) {
        // Pass session.user to fetchUserProfile for metadata
        dispatch(fetchUserProfile({ supabase, userId: session.user.id, user: session.user }));
      }
    }).catch(e => {
      console.error("Error getting initial session:", e);
      dispatch(setAuthError("Failed to get initial session."));
    }).finally(() => {
      dispatch(setAuthLoading(false)); // Ensure loading is false after initial session check
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dispatch, supabase, supabaseUrl, supabaseAnonKey, navigate, location.pathname]);


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading application...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page: Accessible to all */}
      <Route path="/" element={<LandingPage />} />

      {/* Login Page: Renders LoginPage in 'login' mode */}
      <Route path="/login" element={<LoginPage initialAuthMode="login" />} />

      {/* Signup Page: Renders LoginPage in 'signup' mode */}
      <Route path="/signup" element={<LoginPage initialAuthMode="signup" />} />

      {/* Protected Dashboard Route: Only accessible if session exists */}
      <Route
        path="/dashboard"
        element={
          session ? (
            <DashboardPage /> 
          ) : (
            // If not authenticated, redirect to login
            <LoginPage initialAuthMode={location.pathname === '/signup' ? 'signup' : 'login'} />
          )
        }
      />
      {/* Fallback route for any undefined paths, redirect to login or landing */}
      <Route path="*" element={<LoginPage initialAuthMode={location.pathname === '/signup' ? 'signup' : 'login'} />} />
    </Routes>
  );
}

export default App;
