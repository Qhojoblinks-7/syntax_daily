import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClient } from '@supabase/supabase-js';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation and useNavigate

// Import the LandingPage component
import LandingPage from './LandingPage';
// Import the LoginPage component
import LoginPage from './features/auth/LoginPage';
// Import Redux actions and thunks
import {
  setSession,
  setProfile,
  setAuthLoading,
  setAuthError,
  // clearAuth, // Not used directly here, handled by signOutUser
  // signInUser, // Not used directly here, handled by LoginPage
  signOutUser,
  fetchUserProfile
} from './features/auth/authSlice';

import {
  setMyEntries,
  setPublicEntries,
  setWorkLogLoading,
  setWorkLogError,
  // clearWorkLogs, // Not used directly here
  fetchMyWorkLogs,
  fetchPublicWorkLogs,
  addOrUpdateWorkLog,
  deleteWorkLog
} from './features/workLog/workLogSlice';

// Initialize Supabase client once outside the component to prevent multiple instances
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


function App() {
  const dispatch = useDispatch();
  const { session, profile, isLoading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { myEntries, publicEntries, isLoading: workLogLoading, error: workLogError } = useSelector((state) => state.workLog);

  const navigate = useNavigate(); // Hook for programmatic navigation
  const location = useLocation(); // Hook to get current URL path

  const [currentPage, setCurrentPage] = useState('my-log');

  const [project, setProject] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPublic, setIsPublic] = useState(false);

  const [editingEntryId, setEditingEntryId] = useState(null);

  // Removed local state for email, password, displayName, authMode as LoginPage handles them

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
        dispatch(fetchUserProfile({ supabase, userId: session.user.id }));
        // If user logs in/signs up and is on a public/auth page, redirect to dashboard
        if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
            navigate('/dashboard');
        }
      } else {
        dispatch(setProfile(null));
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
        dispatch(fetchUserProfile({ supabase, userId: session.user.id }));
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
  }, [dispatch, supabase, supabaseUrl, supabaseAnonKey, navigate, location.pathname]); // Added navigate and location.pathname to dependencies

  // Effect for fetching my work logs
  useEffect(() => {
    if (session?.user && currentPage === 'my-log') {
      dispatch(fetchMyWorkLogs({ supabase, userId: session.user.id }));
    } else if (!session?.user && currentPage === 'my-log') {
      // Clear my entries if user logs out while on 'my-log' page
      dispatch(setMyEntries([]));
    }
  }, [dispatch, supabase, session, currentPage]);

  // Effect for fetching public work logs
  useEffect(() => {
    if (currentPage === 'public-logs') {
      dispatch(fetchPublicWorkLogs(supabase));
    } else {
      // Clear public entries if not on 'public-logs' page (e.g., switching to 'my-log')
      dispatch(setPublicEntries([]));
    }
  }, [dispatch, supabase, currentPage]);


  const handleAddOrUpdateEntry = async (e) => {
    e.preventDefault();
    if (!session?.user) {
      dispatch(setAuthError("User not authenticated."));
      return;
    }
    if (!project || !taskDescription || !hoursSpent || !entryDate) {
      dispatch(setAuthError("Please fill in all required fields (Project, Task, Hours, Date)."));
      return;
    }
    if (isNaN(parseFloat(hoursSpent)) || parseFloat(hoursSpent) <= 0) {
      dispatch(setAuthError("Hours Spent must be a positive number."));
      return;
    }

    const entryData = {
      id: editingEntryId,
      project: project.trim(),
      task_description: taskDescription.trim(),
      hours_spent: parseFloat(hoursSpent),
      status,
      entry_date: entryDate,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      is_public: isPublic,
    };

    const actionResult = await dispatch(addOrUpdateWorkLog({ supabase, entryData }));

    if (addOrUpdateWorkLog.fulfilled.match(actionResult)) {
      setEditingEntryId(null);
      setProject('');
      setTaskDescription('');
      setHoursSpent('');
      setStatus('In Progress');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setIsPublic(false);
    } else if (addOrUpdateWorkLog.rejected.match(actionResult)) {
      console.error("Failed to add/update work log:", actionResult.payload || actionResult.error.message);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntryId(entry.id);
    setProject(entry.project);
    setTaskDescription(entry.task_description);
    setHoursSpent(entry.hours_spent.toString());
    setStatus(entry.status);
    setEntryDate(entry.entry_date);
    setIsPublic(entry.is_public);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!session?.user) {
      dispatch(setAuthError("User not authenticated."));
      return;
    }
    // Using a custom modal/dialog is preferred over window.confirm for better UI/UX
    // For now, retaining window.confirm as per previous code, but recommend replacing.
    if (window.confirm("Are you sure you want to delete this work entry?")) {
      const actionResult = await dispatch(deleteWorkLog({ supabase, id, userId: session.user.id }));
      if (deleteWorkLog.rejected.match(actionResult)) {
        console.error("Failed to delete work log:", actionResult.payload || actionResult.error.message);
      }
    }
  };

  // Removed handleAuth as it's now handled by LoginPage component

  const handleLogout = async () => {
    const actionResult = await dispatch(signOutUser(supabase));
    if (signOutUser.fulfilled.match(actionResult)) {
      setCurrentPage('public-logs'); // Reset to public logs after logout
      navigate('/login'); // Redirect to login page
    } else if (signOutUser.rejected.match(actionResult)) {
      console.error("Logout failed:", actionResult.payload || actionResult.error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading application...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page: Accessible to all, typically for marketing/info */}
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
            <div className="min-h-screen bg-gray-100 font-sans text-gray-800 p-4 sm:p-8">
              <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 sm:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 mb-4 sm:mb-0">
                    Software Engineer Work Log
                  </h1>
                  <div className="flex items-center space-x-4">
                    {session?.user && (
                      <span className="text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">
                        Logged in as: <span className="font-mono text-blue-600 text-xs">
                          {profile?.display_name || session.user.email || session.user.id}
                        </span>
                      </span>
                    )}
                    {session?.user && (
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                </header>

                {(authError || workLogError) && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {authError || workLogError}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => { dispatch(setAuthError(null)); dispatch(setWorkLogError(null)); }}>
                      <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.697l-2.651 3.152a1.2 1.2 0 1 1-1.697-1.697L8.303 10 5.152 7.348a1.2 1.2 0 0 1 1.697-1.697L10 8.303l2.651-3.152a1.2 1.2 0 1 1 1.697 1.697L11.697 10l3.152 2.651a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </span>
                  </div>
                )}

                <nav className="mb-8 flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentPage('my-log')}
                    className={`px-6 py-2 rounded-lg font-semibold transition duration-200 shadow-md ${
                      currentPage === 'my-log' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    My Log
                  </button>
                  <button
                    onClick={() => setCurrentPage('public-logs')}
                    className={`px-6 py-2 rounded-lg font-semibold transition duration-200 shadow-md ${
                      currentPage === 'public-logs' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Public Logs
                  </button>
                </nav>

                {currentPage === 'my-log' && (
                  <>
                    <section className="mb-10">
                      <h2 className="text-2xl font-bold text-gray-700 mb-5">
                        {editingEntryId ? 'Edit Work Entry' : 'Add New Work Entry'}
                      </h2>
                      <form onSubmit={handleAddOrUpdateEntry} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                          <input
                            type="text"
                            id="project"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            placeholder="e.g., Habit Tracker Backend"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                          <input
                            type="text"
                            id="taskDescription"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            placeholder="e.g., Defined Habit and HabitEntry models"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="hoursSpent" className="block text-sm font-medium text-gray-700 mb-1">Hours Spent</label>
                          <input
                            type="number"
                            id="hoursSpent"
                            value={hoursSpent}
                            onChange={(e) => setHoursSpent(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            placeholder="e.g., 2.5"
                            step="0.1"
                            min="0.1"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            id="entryDate"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            required
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="isPublic" className="ml-2 block text-sm font-medium text-gray-700">
                            Make this entry public
                          </label>
                        </div>
                        <div className="col-span-1 md:col-span-2 flex justify-end space-x-4">
                          <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105"
                            disabled={workLogLoading}
                          >
                            {workLogLoading ? 'Saving...' : (editingEntryId ? 'Update Entry' : 'Add Entry')}
                          </button>
                          {editingEntryId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEntryId(null);
                                setProject('');
                                setTaskDescription('');
                                setHoursSpent('');
                                setStatus('In Progress');
                                setEntryDate(new Date().toISOString().split('T')[0]);
                                setIsPublic(false);
                              }}
                              className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition duration-200 shadow-md transform hover:scale-105"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-700 mb-5">My Work Log</h2>
                      {myEntries.length === 0 && !workLogLoading && (
                        <p className="text-gray-500 italic">No work entries yet. Add one above!</p>
                      )}
                      {workLogLoading && myEntries.length === 0 && (
                        <p className="text-gray-500">Loading entries...</p>
                      )}

                      <div className="space-y-4">
                        {myEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                          >
                            <div className="flex-grow mb-3 sm:mb-0">
                              <h3 className="text-lg font-semibold text-blue-700">{entry.project}</h3>
                              <p className="text-gray-600 text-sm mb-1">{entry.task_description}</p>
                              <p className="text-gray-500 text-xs">
                                {entry.hours_spent} hours | {entry.status} | {entry.entry_date}
                                {entry.is_public && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Public</span>}
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition duration-200 shadow-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition duration-200 shadow-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {currentPage === 'public-logs' && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-700 mb-5">Public Work Logs</h2>
                    {publicEntries.length === 0 && !workLogLoading && (
                      <p className="text-gray-500 italic">No public work entries available yet.</p>
                    )}
                    {workLogLoading && publicEntries.length === 0 && (
                      <p className="text-gray-500">Loading public entries...</p>
                    )}

                    <div className="space-y-4">
                      {publicEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                        >
                          <div className="flex-grow mb-3 sm:mb-0">
                            <h3 className="text-lg font-semibold text-blue-700">{entry.project}</h3>
                            <p className="text-gray-600 text-sm mb-1">{entry.task_description}</p>
                            <p className="text-gray-500 text-xs">
                              {entry.hours_spent} hours | {entry.status} | {entry.entry_date}
                            </p>
                            {entry.profiles && entry.profiles.display_name && (
                               <p className="text-gray-500 text-xs mt-1">
                                 Logged by: <span className="font-medium text-blue-600">{entry.profiles.display_name}</span>
                               </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            // If not authenticated, render LoginPage based on route
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
