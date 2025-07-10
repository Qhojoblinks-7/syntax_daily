import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import { Mail, Lock, User, Eye, EyeOff, ClipboardList, X } from 'lucide-react'; // Lucide icons
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Initialize Supabase client once (ensure these are your actual keys from .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function LoginPage({ initialAuthMode = 'login' }) { // Added initialAuthMode prop
  const [authMode, setAuthMode] = useState(initialAuthMode); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for form submission
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Validation Schema for Formik
  const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  });

  const SignupSchema = Yup.object().shape({
    displayName: Yup.string().min(2, 'Too Short!').max(50, 'Too Long!').required('Display Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  });

  const handleEmailAuth = async (values, { setSubmitting, resetForm }) => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsLoading(true);

    try {
      let { data, error } = {};
      if (authMode === 'signup') {
        // Sign up user with email and password, including display_name in user_metadata
        ({ data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { display_name: values.displayName }
          }
        }));

        if (error) throw error;

        // If signup is successful and user is created, insert into profiles table
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, display_name: values.displayName }
          ]);
          if (profileError) throw profileError;
        }
        setAuthSuccess('Sign up successful! Please check your email to confirm your account.');
      } else {
        // Sign in user with email and password
        ({ data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        }));
        if (error) throw error;
        setAuthSuccess('Logged in successfully!');
        // Redirect to dashboard after successful login
        navigate('/dashboard');
      }
      resetForm(); // Clear form fields on success
    } catch (error) {
      setAuthError(error.message);
      console.error("Auth error:", error.message);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Removed handleSocialAuth function as social login features are being removed.
  // const handleSocialAuth = async (provider) => { ... };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 sm:p-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-6">
          <ClipboardList className="text-blue-600 mb-2" size={48} strokeWidth={2} />
          <h1 className="text-3xl font-extrabold text-blue-700 text-center">
            {authMode === 'login' ? 'Welcome Back!' : 'Join WorkLog'}
          </h1>
        </div>

        {/* Error/Success Messages */}
        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {authError}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setAuthError(null)}>
              <X className="h-5 w-5 text-red-500" />
            </span>
          </div>
        )}
        {authSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Success:</strong>
            <span className="block sm:inline"> {authSuccess}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setAuthSuccess(null)}>
              <X className="h-5 w-5 text-green-500" />
            </span>
          </div>
        )}

        {/* Email & Password Form */}
        <Formik
          initialValues={{
            displayName: '',
            email: '',
            password: '',
          }}
          validationSchema={authMode === 'login' ? LoginSchema : SignupSchema}
          onSubmit={handleEmailAuth}
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Field
                      type="text"
                      id="displayName"
                      name="displayName"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      placeholder="Your Name"
                    />
                  </div>
                  <ErrorMessage name="displayName" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Field
                    type="email"
                    id="email"
                    name="email"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    placeholder="you@example.com"
                  />
                </div>
                <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Field
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                {authMode === 'login' && (
                  <div className="text-right mt-2">
                    <a href="#" className="text-sm text-blue-600 hover:underline">Forgot Password?</a>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105"
                disabled={isSubmitting || isLoading || !isValid || !dirty} // Disable if submitting, loading, or form is invalid/untouched
              >
                {isLoading ? 'Processing...' : (authMode === 'login' ? 'Log In' : 'Sign Up')}
              </button>
            </Form>
          )}
        </Formik>

        {/* Removed OR Separator */}
        {/* Removed Social Login Buttons */}

        {/* Toggle Login/Signup Mode */}
        <div className="mt-6 text-center">
          {authMode === 'login' ? (
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccess(null); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
