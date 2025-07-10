import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Import useDispatch and useSelector
import { supabase } from './supabaseClient'; // Import the centralized supabase client
import Logo from '../public/syntaxD.png'; // Import your logo image
// Lucide React for icons
import { CheckCircle, Share2, TrendingUp, Code, Users, PlayCircle, ClipboardList, AlertTriangle, Lightbulb, Clock, BarChart2, Share, Menu, X, Star } from 'lucide-react'; // Added Star

// Import the async thunk for fetching reviews
import { fetchApprovedReviews } from './features/workLog/workLogSlice';

function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  // Select reviews and their loading/error states from the Redux store
  const { reviews, reviewsLoading, reviewsError } = useSelector((state) => state.workLog);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Effect to scroll to section when hash changes
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1)); // Remove '#'
      if (element) {
        // Use setTimeout to ensure the element is rendered and the navbar is in place
        // before attempting to scroll. Adjust delay if needed.
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100); // Small delay to account for rendering and fixed navbar
      }
    } else {
      // Optional: Scroll to top when no hash is present (e.g., on initial load or navigating to '/')
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]); // Re-run effect when location object changes

  // Effect to fetch approved reviews on component mount
  useEffect(() => {
    dispatch(fetchApprovedReviews(supabase));
  }, [dispatch, supabase]); // Depend on dispatch and supabase

  // Get the first review to display, if available
  const displayedReview = reviews.length > 0 ? reviews[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
      {/* Navbar - Mobile-first with Burger Menu */}
      <nav className="bg-white shadow-sm py-4 px-6 sm:px-8 fixed top-0 left-0 w-full z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center text-2xl font-bold text-blue-700" onClick={closeMobileMenu}>
            <img 
                src={Logo}
                alt="Syntax Daily Logo"
                className="h-15 w-auto mr-2"
            />
            Syntax Daily
          </Link>

          {/* Hamburger Menu Icon (visible on mobile, hidden on md and up) */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Desktop Navigation Links (hidden on mobile, visible on md and up) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/#features" className="text-gray-600 hover:text-blue-700 px-3 py-2 rounded-md text-base font-medium transition duration-150">Features</Link>
            <Link to="/#how-it-works" className="text-gray-600 hover:text-blue-700 px-3 py-2 rounded-md text-base font-medium transition duration-150">How it Works</Link>
            <Link to="/#testimonials" className="text-gray-600 hover:text-blue-700 px-3 py-2 rounded-md text-base font-medium transition duration-150">Reviews</Link>
            <Link to="/signup" className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md text-base font-medium">
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Mobile Menu Overlay (conditionally rendered) */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bg-white shadow-lg py-4 z-30">
            <div className="flex flex-col items-center space-y-4">
              <Link to="/#features" className="block text-gray-800 hover:text-blue-700 text-lg font-medium py-2" onClick={closeMobileMenu}>Features</Link>
              <Link to="/#how-it-works" className="block text-gray-800 hover:text-blue-700 text-lg font-medium py-2" onClick={closeMobileMenu}>How it Works</Link>
              <Link to="/#testimonials" className="block text-gray-800 hover:text-blue-700 text-lg font-medium py-2" onClick={closeMobileMenu}>Reviews</Link>
              <Link to="/signup" className="w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md text-lg font-medium" onClick={closeMobileMenu}>
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* A div to push content down, accounting for the fixed navbar height */}
      <div className="pt-16">
        {/* Hero Section */}
        <header className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 sm:py-20 px-6 sm:px-8 text-center overflow-hidden rounded-b-3xl shadow-lg">
          {/* Abstract background shapes */}
          <div className="absolute inset-0 z-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="20" cy="20" r="15" fill="currentColor" className="text-blue-500 animate-pulse" style={{ animationDuration: '6s' }} />
              <rect x="70" y="10" width="10" height="10" fill="currentColor" className="text-blue-400 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
              <polygon points="50,80 60,95 40,95" fill="currentColor" className="text-blue-500 animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
            </svg>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* New Badge */}
            <div className="inline-flex items-center bg-blue-400 bg-opacity-20 text-blue-100 text-sm font-semibold px-4 py-2 rounded-full mb-6 shadow-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Star size={16} className="mr-2 text-yellow-300" fill="currentColor" /> Perfect for ALX Students & Engineers
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up">
              Streamline Your Dev Day. Log Your Progress. <br /> <span className="text-blue-200">Share Your Wins.</span>
            </h1>
            <p className="text-lg sm:text-xl mb-8 sm:mb-10 opacity-90 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              The intuitive work log for modern software engineers, built for personal tracking and professional sharing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Link to="/signup" className="px-8 py-3 bg-white text-blue-700 font-bold rounded-full shadow-lg hover:bg-blue-100 transform hover:scale-105 transition duration-300 text-lg">
                Get Started - It's Free!
              </Link>
              <Link to="/#features" className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-700 transform hover:scale-105 transition duration-300 text-lg">
                Learn More
              </Link>
            </div>
          </div>
        </header>

        {/* Problem/Solution Section */}
        <section className="py-12 sm:py-16 px-6 sm:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-10 sm:mb-12">
              Tired of losing track of your dev efforts?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-red-100 transform hover:translate-y-[-5px] transition duration-300">
                <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-6">
                  <AlertTriangle className="text-red-500 mr-2 sm:mr-3" size={32} sm:size={36} strokeWidth={2} />
                  <h3 className="text-xl sm:text-2xl font-bold text-red-700">The Challenges</h3>
                </div>
                <ul className="text-base sm:text-lg text-gray-700 space-y-3 sm:space-y-4 text-left">
                  <li className="flex items-start">
                    <span className="mr-2 sm:mr-3 text-red-500 text-lg sm:text-xl">&bull;</span>
                    <p><span className="font-semibold">Effort Goes Unnoticed:</span> Your daily contributions often aren't visible to your network or future employers.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 sm:mr-3 text-red-500 text-lg sm:text-xl">&bull;</span>
                    <p><span className="font-semibold">Time Management Struggles:</span> It's hard to accurately recall how much time was spent on specific tasks.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 sm:mr-3 text-red-500 text-lg sm:text-xl">&bull;</span>
                    <p><span className="font-semibold">Lack of Accountability:</span> Without a clear log, self-discipline can waver.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 sm:mr-3 text-red-500 text-lg sm:text-xl">&bull;</span>
                    <p><span className="font-semibold">Portfolio Gaps:</span> Difficulty showcasing the breadth and depth of your personal projects.</p>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-green-100 transform hover:translate-y-[-5px] transition duration-300">
                <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-6">
                  <Lightbulb className="text-green-600 mr-2 sm:mr-3" size={32} sm:size={36} strokeWidth={2} />
                  <h3 className="text-xl sm:text-2xl font-bold text-green-700">Our Solution</h3>
                </div>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-left">
                  The Software Engineer Work Log provides a simple, powerful platform to meticulously record your coding journey. From bug fixes to feature implementations, track every hour, every project, and every win.
                  <br /><br />
                  Then, effortlessly transform your private logs into shareable insights, building a dynamic, verifiable portfolio that speaks volumes, and helping you stay on top of your game.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="py-12 sm:py-16 px-6 sm:px-8 bg-white shadow-inner rounded-t-3xl">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-4">
              Everything You Need to Track & Share
            </h2>
            <p className="text-base sm:text-lg text-center text-gray-600 mb-10 sm:mb-12">
              Built specifically for software engineers who want to document their journey <br className="hidden sm:inline" /> and showcase their progress professionally.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex flex-col p-5 sm:p-6 bg-gray-50 rounded-xl shadow-md border border-gray-100">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full w-fit mb-3 sm:mb-4">
                  <Clock className="text-blue-600" size={24} sm:size={28} strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">Quick Daily Logging</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Log your work in seconds. Track projects, tasks, and time spent with our intuitive interface designed for busy developers.
                </p>
                <ul className="text-gray-700 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> One-click time tracking</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Project categorization</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Smart suggestions</li>
                </ul>
              </div>

              <div className="flex flex-col p-5 sm:p-6 bg-gray-50 rounded-xl shadow-md border border-gray-100">
                <div className="p-2 sm:p-3 bg-green-100 rounded-full w-fit mb-3 sm:mb-4">
                  <BarChart2 className="text-green-600" size={24} sm:size={28} strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">Progress Analytics</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Visualize your coding journey with beautiful charts and insights that help you identify patterns and improve productivity.
                </p>
                <ul className="text-gray-700 space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Weekly/monthly summaries</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Productivity trends</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Goal tracking</li>
                </ul>
              </div>

              <div className="flex flex-col p-5 sm:p-6 bg-blue-600 text-white rounded-xl shadow-md border border-blue-700">
                <div className="p-2 sm:p-3 bg-blue-500 rounded-full w-fit mb-3 sm:mb-4">
                  <Share className="text-white" size={24} sm:size={28} strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Social Sharing</h3>
                <p className="text-sm sm:text-base mb-3 sm:mb-4 opacity-90">
                  Share your achievements on LinkedIn, X, and Facebook with beautiful, professional-looking work summaries.
                </p>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm opacity-90">
                  <li className="flex items-center"><CheckCircle className="text-blue-200 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Auto-generated posts</li>
                  <li className="flex items-center"><CheckCircle className="text-blue-200 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Custom templates</li>
                  <li className="flex items-center"><CheckCircle className="text-blue-200 mr-1.5 sm:mr-2" size={14} sm:size={16} strokeWidth={2} /> Professional branding</li>
                </ul>
              </div>
              
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 sm:py-16 px-6 sm:px-8 bg-gray-100">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-10 sm:mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
              {/* SVG for connecting lines (visible on md and up) */}
              <svg className="hidden md:block absolute inset-0 w-full h-full z-0" viewBox="0 0 1000 100" preserveAspectRatio="none">
                {/* Line from Step 1 to Step 2 */}
                <path
                  d="M 166 50 C 300 20, 350 80, 500 50"
                  fill="none"
                  stroke="#93C5FD" // Tailwind blue-300
                  strokeWidth="3"
                  className="animate-draw-line"
                />
                {/* Line from Step 2 to Step 3 */}
                <path
                  d="M 500 50 C 650 20, 700 80, 833 50"
                  fill="none"
                  stroke="#93C5FD" // Tailwind blue-300
                  strokeWidth="3"
                  className="animate-draw-line"
                  style={{ animationDelay: '0.5s' }} /* Delay second line animation */
                />
              </svg>

              {/* Step Cards */}
              <div className="flex flex-col items-center p-5 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 z-10">
                <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 mb-3 sm:mb-4">1</span>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">Sign Up</h3>
                <p className="text-sm sm:text-base text-gray-600">Create your free account in seconds. No credit card required.</p>
              </div>
              <div className="flex flex-col items-center p-5 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 z-10">
                <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 mb-3 sm:mb-4">2</span>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">Log Your Work</h3>
                <p className="text-sm sm:text-base text-gray-600">Start tracking projects, tasks, and hours with our intuitive interface.</p>
              </div>
              <div className="flex flex-col items-center p-5 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 z-10">
                <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 mb-3 sm:mb-4">3</span>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">Share Your Progress</h3>
                <p className="text-sm sm:text-base text-gray-600">Optionally share your achievements on social media or with your network.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section - Updated to match the provided image */}
        <section id="testimonials" className="py-12 sm:py-16 px-6 sm:px-8 bg-blue-700 text-white rounded-t-3xl shadow-lg">
          <div className="max-w-3xl mx-auto text-center">
            <PlayCircle className="text-blue-200 mx-auto mb-4 sm:mb-6" size={56} sm:size={64} strokeWidth={1.5} />
            {reviewsLoading && (
              <p className="text-blue-200">Loading review...</p>
            )}
            {reviewsError && (
              <p className="text-red-300">Error loading review: {reviewsError}</p>
            )}
            {!reviewsLoading && !reviewsError && !displayedReview && (
              <p className="text-blue-200 italic">No reviews yet. Be the first to share your experience!</p>
            )}
            {!reviewsLoading && !reviewsError && displayedReview && (
              <div className="bg-blue-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center max-w-lg mx-auto"> {/* Added max-w-lg and mx-auto for centering */}
                <Star size={24} className="text-yellow-400 mb-3" fill="currentColor" />
                <p className="text-base sm:text-lg italic leading-relaxed mb-4">
                  "{displayedReview.review_text}"
                </p>
                <p className="text-sm sm:text-base font-semibold">- {displayedReview.reviewer_name}</p>
                {displayedReview.title && <p className="text-blue-200 text-xs sm:text-sm mt-1">{displayedReview.title}</p>}
              </div>
            )}
          </div>
        </section>

        {/* Call to Action (Repeat) Section */}
        <section id="signup" className="py-12 sm:py-16 px-6 sm:px-8 bg-gray-50 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
            Ready to Take Control of Your Dev Journey?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
            Join hundreds of engineers who are already streamlining their work and showcasing their impact.
          </p>
          <Link to="/signup" className="px-8 sm:px-10 py-3 sm:py-4 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 transform hover:scale-105 transition duration-300 text-lg sm:text-xl">
            Get Started - It's Free!
          </Link>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 py-6 sm:py-8 px-6 sm:px-8 text-center rounded-t-3xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs sm:text-sm mb-3 sm:mb-0">&copy; {new Date().getFullYear()} Software Engineer Work Log. All rights reserved.</p>
            <div className="flex flex-wrap justify-center space-x-3 sm:space-x-4">
              <Link to="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition duration-150">Privacy Policy</Link>
              <Link to="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition duration-150">Terms of Service</Link>
              <Link to="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition duration-150">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
