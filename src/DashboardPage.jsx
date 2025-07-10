import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClient } from '@supabase/supabase-js'; // Assuming supabase client is needed here
import { Share2, MoreVertical, X, Link, Twitter, Linkedin, Plus, ChevronDown, ChevronUp } from 'lucide-react'; // Added Plus, ChevronDown, ChevronUp icons

// Import Redux actions and thunks
import {
  setAuthError, // To display auth-related errors on the dashboard
  signOutUser,
} from './features/auth/authSlice';

import {
  setMyEntries,
  setPublicEntries,
  setWorkLogLoading,
  setWorkLogError,
  fetchMyWorkLogs,
  fetchPublicWorkLogs,
  addOrUpdateWorkLog,
  deleteWorkLog
} from './features/workLog/workLogSlice';

// Initialize Supabase client once (ensure these are your actual keys from .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


function DashboardPage() {
  const dispatch = useDispatch();
  const { session, profile, isLoading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { myEntries, publicEntries, isLoading: workLogLoading, error: workLogError } = useSelector((state) => state.workLog);

  const [currentPage, setCurrentPage] = useState('my-log');
  const [showAddEntryForm, setShowAddEntryForm] = useState(false); // State to toggle form visibility

  const [project, setProject] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursSpent, setHoursSpent] = '';
  const [status, setStatus] = useState('In Progress');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Accordion state: stores the ID of the currently expanded entry
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEntryToShare, setSelectedEntryToShare] = useState(null);
  const [showMobileShareMenu, setShowMobileShareMenu] = useState(null); // Stores ID of entry with open menu
  const shareMenuRef = useRef(null); // Ref for closing mobile share menu on outside click

  // Close mobile share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowMobileShareMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect for fetching my work logs
  useEffect(() => {
    if (session?.user && currentPage === 'my-log') {
      dispatch(fetchMyWorkLogs({ supabase, userId: session.user.id }));
    } else if (!session?.user && currentPage === 'my-log') {
      dispatch(setMyEntries([])); // Clear my entries if logged out
    }
  }, [dispatch, supabase, session, currentPage]);

  // Effect for fetching public work logs
  useEffect(() => {
    if (currentPage === 'public-logs') {
      dispatch(fetchPublicWorkLogs(supabase));
    } else {
      dispatch(setPublicEntries([])); // Clear public entries if not on public logs page
    }
  }, [dispatch, supabase, currentPage]);

  // Function to toggle the visibility of the add/edit form
  const toggleAddEntryForm = () => {
    setShowAddEntryForm(prev => !prev);
    // Reset form fields if hiding the form or starting a new entry
    if (showAddEntryForm || editingEntryId) {
      setEditingEntryId(null);
      setProject('');
      setTaskDescription('');
      setHoursSpent('');
      setStatus('In Progress');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setIsPublic(false);
    }
  };

  const handleAddOrUpdateEntry = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) {
      dispatch(setAuthError("User not authenticated or user ID not available. Please log in again."));
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
      project: project.trim(),
      task_description: taskDescription.trim(),
      hours_spent: parseFloat(hoursSpent),
      status,
      entry_date: entryDate,
      created_at: new Date().toISOString(),
      user_id: session.user.id,
      is_public: isPublic,
    };

    if (editingEntryId) {
      entryData.id = editingEntryId;
    }

    const actionResult = await dispatch(addOrUpdateWorkLog({ supabase, entryData }));

    if (addOrUpdateWorkLog.fulfilled.match(actionResult)) {
      toggleAddEntryForm(); // Hide form after successful submission
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
    setShowAddEntryForm(true); // Show the form for editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!session?.user) {
      dispatch(setAuthError("User not authenticated."));
      return;
    }
    if (window.confirm("Are you sure you want to delete this work entry?")) {
      const actionResult = await dispatch(deleteWorkLog({ supabase, id, userId: session.user.id }));
      if (deleteWorkLog.rejected.match(actionResult)) {
        console.error("Failed to delete work log:", actionResult.payload || actionResult.error.message);
      }
    }
  };

  const handleLogout = async () => {
    const actionResult = await dispatch(signOutUser(supabase));
    // Redirection is handled in App.jsx's auth listener
  };

  // Sharing Functions
  const openShareModal = (entry) => {
    setSelectedEntryToShare(entry);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setSelectedEntryToShare(null);
    setShowShareModal(false);
  };

  const generateShareLink = (entry) => {
    // In a real application, this would generate a unique public URL for the entry.
    // For now, it's a placeholder.
    // Example: `${window.location.origin}/public-entry/${entry.id}`
    return `${window.location.origin}/public-log-view?id=${entry.id}`;
  };

  const copyShareLink = (entry) => {
    const link = generateShareLink(entry);
    // Create a temporary input element to copy the text
    const tempInput = document.createElement('input');
    tempInput.value = link;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Share link copied to clipboard!'); // Use alert for now, consider custom modal later
    closeShareModal();
    setShowMobileShareMenu(null); // Close mobile menu if open
  };

  const shareToX = (entry) => {
    const text = `Check out my latest work log entry: "${entry.task_description}" on project "${entry.project}"! #WorkLog #DevProgress`;
    const url = generateShareLink(entry);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    closeShareModal();
    setShowMobileShareMenu(null); // Close mobile menu if open
  };

  const shareToLinkedIn = (entry) => {
    const title = `Work Log Update: ${entry.project}`;
    const summary = entry.task_description;
    const url = generateShareLink(entry);
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`, '_blank');
    closeShareModal();
    setShowMobileShareMenu(null); // Close mobile menu if open
  };

  // Function to toggle accordion for a specific entry
  const toggleAccordion = (entryId) => {
    setExpandedEntryId(prevId => (prevId === entryId ? null : entryId));
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-blue-800 text-white shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-8 text-center">WorkLog</h2>
        <nav className="flex-grow space-y-4">
          <button
            onClick={() => setCurrentPage('my-log')}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 ${
              currentPage === 'my-log' ? 'bg-blue-600 shadow-md' : 'hover:bg-blue-700'
            }`}
          >
            My Log
          </button>
          <button
            onClick={() => setCurrentPage('public-logs')}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 ${
              currentPage === 'public-logs' ? 'bg-blue-600 shadow-md' : 'hover:bg-blue-700'
            }`}
          >
            Public Logs
          </button>
        </nav>
        <div className="mt-8 pt-4 border-t border-blue-700 text-center">
          {session?.user && (
            <span className="block text-sm text-blue-200 mb-2 truncate">
              Logged in as: <span className="font-mono text-blue-50 text-xs">
                {profile?.display_name || session.user.email || session.user.id}
              </span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header and Navigation */}
      <header className="md:hidden w-full bg-blue-800 text-white p-4 flex flex-col items-center">
        <h1 className="text-2xl font-extrabold mb-3">Software Engineer Work Log</h1>
        <div className="flex items-center space-x-4 mb-3">
          {session?.user && (
            <span className="text-sm text-blue-200 truncate max-w-[150px]">
              Logged in as: <span className="font-mono text-blue-50 text-xs">
                {profile?.display_name || session.user.email || session.user.id}
              </span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 shadow-md text-sm"
          >
            Logout
          </button>
        </div>
        <nav className="w-full flex justify-center space-x-4">
          <button
            onClick={() => setCurrentPage('my-log')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition duration-200 shadow-md ${
              currentPage === 'my-log' ? 'bg-blue-600 text-white' : 'bg-blue-700 text-blue-100 hover:bg-blue-600'
            }`}
          >
            My Log
          </button>
          <button
            onClick={() => setCurrentPage('public-logs')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition duration-200 shadow-md ${
              currentPage === 'public-logs' ? 'bg-blue-600 text-white' : 'bg-blue-700 text-blue-100 hover:bg-blue-600'
            }`}
          >
            Public Logs
          </button>
        </nav>
      </header>


      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 sm:p-8">
          {/* Error/Success Messages */}
          {(authError || workLogError) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {authError || workLogError}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => { dispatch(setAuthError(null)); dispatch(setWorkLogError(null)); }}>
                <X className="h-5 w-5 text-red-500" />
              </span>
            </div>
          )}

          {currentPage === 'my-log' && (
            <>
              <section className="mb-8">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold text-gray-700">My Work Log Entries</h2>
                  <button
                    onClick={toggleAddEntryForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>{showAddEntryForm ? 'Hide Form' : 'Add New Entry'}</span>
                  </button>
                </div>

                {showAddEntryForm && (
                  <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8">
                    <h3 className="text-xl font-bold text-gray-700 mb-5">
                      {editingEntryId ? 'Edit Work Entry' : 'Add New Work Entry'}
                    </h3>
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
                            onClick={toggleAddEntryForm} // Use toggle to hide and reset
                            className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition duration-200 shadow-md transform hover:scale-105"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
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
                      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col relative group" // Changed to flex-col for accordion
                    >
                      <div className="flex justify-between items-start sm:items-center cursor-pointer" onClick={() => toggleAccordion(entry.id)}>
                        <div className="flex-grow mb-3 sm:mb-0 min-w-0">
                          <h3 className="text-lg font-semibold text-blue-700">{entry.project}</h3>
                          {/* Always show truncated description in the header */}
                          <p className="text-gray-600 text-sm mb-1 truncate" title={entry.task_description}>
                            {entry.task_description}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {entry.hours_spent} hours | {entry.status} | {entry.entry_date}
                            {entry.is_public && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Public</span>}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4"> {/* Added ml-4 for spacing */}
                          {/* Accordion Toggle Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click from toggling twice
                              toggleAccordion(entry.id);
                            }}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                            title={expandedEntryId === entry.id ? "Collapse" : "Expand"}
                          >
                            {expandedEntryId === entry.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {expandedEntryId === entry.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {/* Added whitespace-normal and break-words for proper wrapping */}
                          <p className="text-gray-700 text-sm mb-3 whitespace-normal break-words">
                            <span className="font-semibold">Full Description:</span> {entry.task_description}
                          </p>
                          {/* You can add more details here if needed */}
                          <div className="flex space-x-3 items-center justify-end"> {/* Moved action buttons here */}
                            {/* Desktop Share Button (visible on md and up, on hover) */}
                            {entry.is_public && (
                              <button
                                onClick={() => openShareModal(entry)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200 shadow-sm"
                                title="Share this entry"
                              >
                                <Share2 size={16} />
                              </button>
                            )}
                            {/* Mobile Share Button (visible on mobile, always) */}
                            {entry.is_public && (
                              <div className="relative md:hidden" ref={shareMenuRef}> {/* Ref for click outside */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click if any
                                    setShowMobileShareMenu(showMobileShareMenu === entry.id ? null : entry.id);
                                    setSelectedEntryToShare(entry);
                                  }}
                                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                                  title="More options"
                                >
                                  <MoreVertical size={20} />
                                </button>
                                {showMobileShareMenu === entry.id && (
                                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    <button
                                      onClick={() => copyShareLink(selectedEntryToShare)}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <Link size={16} className="mr-2" /> Copy Link
                                    </button>
                                    <button
                                      onClick={() => shareToX(selectedEntryToShare)}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <Twitter size={16} className="mr-2" /> Share to X
                                    </button>
                                    <button
                                      onClick={() => shareToLinkedIn(selectedEntryToShare)}
                                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      <Linkedin size={16} className="mr-2" /> Share to LinkedIn
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
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
                      )}
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
                    className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col relative group" // Changed to flex-col for accordion
                  >
                    <div className="flex justify-between items-start sm:items-center cursor-pointer" onClick={() => toggleAccordion(entry.id)}>
                      <div className="flex-grow mb-3 sm:mb-0 min-w-0">
                        <h3 className="text-lg font-semibold text-blue-700">{entry.project}</h3>
                        {/* Always show truncated description in the header */}
                        <p className="text-gray-600 text-sm mb-1 truncate" title={entry.task_description}>
                          {entry.task_description}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {entry.hours_spent} hours | {entry.status} | {entry.entry_date}
                        </p>
                        {entry.profiles && entry.profiles.display_name && (
                           <p className="text-gray-500 text-xs mt-1">
                             Logged by: <span className="font-medium text-blue-600">{entry.profiles.display_name}</span>
                           </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 ml-4"> {/* Added ml-4 for spacing */}
                        {/* Accordion Toggle Icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click from toggling twice
                            toggleAccordion(entry.id);
                          }}
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                          title={expandedEntryId === entry.id ? "Collapse" : "Expand"}
                        >
                          {expandedEntryId === entry.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {expandedEntryId === entry.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Added whitespace-normal and break-words for proper wrapping */}
                        <p className="text-gray-700 text-sm mb-3 whitespace-normal break-words">
                          <span className="font-semibold">Full Description:</span> {entry.task_description}
                        </p>
                        {/* You can add more details here if needed */}
                        {entry.is_public && (
                          <div className="flex space-x-3 items-center justify-end"> {/* Moved action buttons here */}
                             {/* Desktop Share Button (visible on md and up, on hover) */}
                             <button
                               onClick={() => openShareModal(entry)}
                               className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200 shadow-sm"
                               title="Share this entry"
                             >
                               <Share2 size={16} />
                             </button>
                             {/* Mobile Share Button (visible on mobile, always) */}
                             <div className="relative md:hidden" ref={shareMenuRef}>
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setShowMobileShareMenu(showMobileShareMenu === entry.id ? null : entry.id);
                                   setSelectedEntryToShare(entry);
                                 }}
                                 className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                                 title="More options"
                               >
                                 <MoreVertical size={20} />
                               </button>
                               {showMobileShareMenu === entry.id && (
                                 <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                   <button
                                     onClick={() => copyShareLink(selectedEntryToShare)}
                                     className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                   >
                                     <Link size={16} className="mr-2" /> Copy Link
                                   </button>
                                   <button
                                     onClick={() => shareToX(selectedEntryToShare)}
                                     className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                   >
                                     <Twitter size={16} className="mr-2" /> Share to X
                                   </button>
                                   <button
                                     onClick={() => shareToLinkedIn(selectedEntryToShare)}
                                     className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                   >
                                     <Linkedin size={16} className="mr-2" /> Share to LinkedIn
                                   </button>
                                 </div>
                               )}
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && selectedEntryToShare && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
            <button
              onClick={closeShareModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Share Work Entry</h3>
            <p className="text-gray-700 mb-4">
              "{selectedEntryToShare.task_description}" on project "{selectedEntryToShare.project}"
            </p>
            <div className="space-y-3">
              <button
                onClick={() => copyShareLink(selectedEntryToShare)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                <Link size={18} className="mr-2" /> Copy Share Link
              </button>
              <button
                onClick={() => shareToX(selectedEntryToShare)}
                className="w-full flex items-center justify-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition duration-200"
              >
                <Twitter size={18} className="mr-2" /> Share to X
              </button>
              <button
                onClick={() => shareToLinkedIn(selectedEntryToShare)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition duration-200"
              >
                <Linkedin size={18} className="mr-2" /> Share to LinkedIn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;

