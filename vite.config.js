import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Import the React plugin for Vite

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // This enables React support in Vite
    // Tailwind CSS is typically handled by PostCSS, which Vite automatically picks up.
    // You do not need to import 'tailwindcss' or '@tailwindcss/vite' here.
  ],
  // The 'content', 'theme', and 'plugins' for Tailwind CSS
  // should be in your tailwind.config.js file, not here.
});
