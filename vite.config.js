import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group all node_modules into a vendor chunk
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
          // You can also define chunks for specific parts of your app
          // if (id.includes('src/features/auth')) {
          //   return 'auth-feature';
          // }
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Optionally increase the limit to 1000 kB
  }
});