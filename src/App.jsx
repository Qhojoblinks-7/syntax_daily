import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from './supabaseClient'; // Import the centralized supabase client

// Import Redux actions
import { setSession, setProfile, clearAuth, setAuthLoading, fetchUserProfile, setAuthError } from './features/auth/authSlice'; // Added setProfile

// Import your components
import LandingPage from './LandingPage';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './DashboardPage';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading: authLoading, error: authError } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check for Supabase client initialization (error logging is in supabaseClient.js)
    if (!supabase || !supabase.auth) {
      dispatch(setAuthError("Supabase client not properly initialized. Check console for .env errors."));
      return;
    }

    dispatch(setAuthLoading(true));

    // Supabase Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => { // Added 'event' parameter
      console.log("Auth State Change Event:", event, "Session:", currentSession); // Debugging log
      dispatch(setSession(currentSession)); // Update Redux session
      if (currentSession?.user) {
        // Fetch user profile if session exists
        dispatch(fetchUserProfile({ supabase, userId: currentSession.user.id, user: currentSession.user }));

        // If user logs in/signs up and is on a public/auth page, redirect to dashboard
        if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
            console.log("Redirecting to dashboard from App.jsx due to successful auth."); // New debugging log
            navigate('/dashboard');
        }
      } else {
        dispatch(setProfile(null)); // Clear profile on logout
        // If user logs out and is on a protected route, redirect to login
        if (location.pathname !== '/login' && location.pathname !== '/signup' && location.pathname !== '/') {
            console.log("Redirecting to login from App.jsx due to logout/no session."); // New debugging log
            navigate('/login');
        }
      }
      dispatch(setAuthLoading(false)); // Set loading to false after auth state is determined
    });

    // Get initial session on mount (important for first load)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      dispatch(setSession(initialSession));
      if (initialSession?.user) {
        dispatch(fetchUserProfile({ supabase, userId: initialSession.user.id, user: initialSession.user }));
      }
    }).catch(e => {
      console.error("Error getting initial session:", e);
      dispatch(setAuthError("Failed to get initial session."));
    }).finally(() => {
      dispatch(setAuthLoading(false)); // Ensure loading is false after initial session check
    });

    // Cleanup the subscription on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dispatch, navigate, location.pathname]); // Optimized dependencies


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center space-x-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage initialAuthMode="login" />} />
      <Route path="/signup" element={<LoginPage initialAuthMode="signup" />} />
      {/* Protected Dashboard Route */}
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
      {/* Allow linking to specific sections of dashboard, e.g., /dashboard#submit-review */}
      <Route
        path="/dashboard#submit-review"
        element={
          session ? (
            <DashboardPage />
          ) : (
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
