Work Log Application
A responsive web application for software engineers to log their daily work, track progress, and optionally share their entries publicly. Built with React, Redux Toolkit, and Supabase for authentication and data storage.

Features
User Authentication: Secure sign-up and login with email/password.

Personal Work Log: Users can add, edit, and delete their private work entries.

Fields: Project Name, Task Description, Hours Spent, Status (In Progress, Completed, Blocked, On Hold), Date.

Public Work Logs: Users can mark their entries as public, making them visible to others.

Review Submission: Users can submit reviews for the application.

Responsive Design: Optimized for desktop, tablet, and mobile devices.

Share Functionality:

Copy a direct link to a public entry.

Share public entries to X (formerly Twitter) and LinkedIn.

Toast Notifications: Provides subtle feedback for user actions (success, error, info).

Confirmation Modals: Ensures user intent for critical actions like deletion.

Redux Toolkit: State management for predictable data flow.

Supabase Integration: Backend-as-a-Service for authentication, database (PostgreSQL), and real-time capabilities.

Tailwind CSS: Utility-first CSS framework for rapid and consistent styling.

Lucide React Icons: Lightweight and customizable SVG icons.

Technologies Used
Frontend:

React.js

Redux Toolkit (for state management)

React Router DOM (for navigation)

Tailwind CSS (for styling)

Lucide React (for icons)

Backend (BaaS):

Supabase (Authentication, PostgreSQL Database)

Build Tool:

Vite

Setup and Installation
To get this project up and running on your local machine, follow these steps:

1. Prerequisites
Node.js (v18 or higher recommended)

npm or yarn

2. Clone the Repository
git clone <your-repository-url>
cd <your-repository-name>

3. Install Dependencies
npm install
# or
yarn install

4. Supabase Configuration
This application uses Supabase for its backend. You'll need to set up a Supabase project and configure your environment variables.

a. Create a Supabase Project
Go to Supabase and create a new project.

Once your project is created, navigate to Settings > API to find your Project URL and Anon Public Key.

b. Set up Environment Variables
Create a .env file in the root of your project (where package.json is located) and add the following:

VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

Replace "YOUR_SUPABASE_URL" and "YOUR_SUPABASE_ANON_KEY" with the values from your Supabase project.

c. Database Schema
You'll need to set up the necessary tables in your Supabase database.

profiles table:
This table stores user profile information.

CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NULL,
  avatar_url text NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

work_log_entries table:
This table stores the work log entries.

CREATE TABLE public.work_log_entries (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project text NOT NULL,
  task_description text NOT NULL,
  hours_spent numeric NOT NULL,
  status text NOT NULL,
  entry_date date NOT NULL,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT work_log_entries_pkey PRIMARY KEY (id)
);

ALTER TABLE public.work_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view their own work logs."
  ON public.work_log_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert work logs."
  ON public.work_log_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own work logs."
  ON public.work_log_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own work logs."
  ON public.work_log_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public work logs are viewable by everyone."
  ON public.work_log_entries FOR SELECT
  USING (is_public = true);

reviews table:
This table stores user reviews.

CREATE TABLE public.reviews (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_text text NOT NULL,
  reviewer_name text NOT NULL,
  title text NULL,
  is_approved boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert reviews."
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Approved reviews are viewable by everyone."
  ON public.reviews FOR SELECT
  USING (is_approved = true);

-- Optional: Policy for admins to manage reviews (requires admin role setup)
-- CREATE POLICY "Admins can update all reviews."
--   ON public.reviews FOR UPDATE
--   USING (get_user_role(auth.uid()) = 'admin');

5. Run the Application
npm run dev
# or
yarn dev

This will start the development server. Open your browser and navigate to http://localhost:5173 (or the port indicated in your terminal).

Project Structure
.
├── public/
├── src/
│   ├── App.jsx             # Main application component, handles routing and global auth.
│   ├── main.jsx            # Entry point for the React application.
│   ├── index.css           # Global Tailwind CSS styles.
│   ├── supabaseClient.js   # Centralized Supabase client initialization.
│   ├── store.js            # Redux store configuration.
│   ├── LandingPage.jsx     # Landing page component.
│   ├── DashboardPage.jsx   # Main dashboard for work log entries.
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.js  # Redux slice for authentication state and async actions.
│   │   │   └── LoginPage.jsx # Login/Signup UI component.
│   │   └── workLog/
│   │       └── workLogSlice.js # Redux slice for work log data and async actions.
├── tailwind.config.js      # Tailwind CSS configuration.
├── postcss.config.js       # PostCSS configuration for Tailwind.
├── vite.config.js          # Vite build tool configuration.
├── package.json
├── .env                    # Environment variables (not committed to Git).
└── README.md               # This file.

Usage
Sign Up / Log In:

Navigate to /signup to create a new account or /login if you already have one.

Use email/password or social login options (Google, GitHub).

My Log:

After logging in, you'll be redirected to your dashboard (/dashboard).

Click "Add New Entry" to open the form. Fill in the details and save.

You can edit or delete your entries using the respective buttons on each card.

Public Logs:

Switch to the "Public Logs" tab to view all work entries that users have marked as public.

Submit Review:

If prompted, or by navigating to the "Submit Review" tab, you can leave feedback for the application.

Contributing
Feel free to fork the repository, make improvements, and submit pull requests.

License
This project is open source and available under the MIT License.