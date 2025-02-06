import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { UserConfig as VitestUserConfig } from "vitest/config";

const vitestConfig: VitestUserConfig = {
  test: {
    setupFiles: './src/setupTests.ts', // Path to your setup file
    globals: true, // Enable global variables for Vitest
  },
}

const configDetails: VitestUserConfig = {
  test: {
    globals: true, // Enable global APIs if needed
    globalSetup: './src/globalSetup.ts', // Adjust the path to your setup file
  },
};
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // ...vitestConfig
  // ...configDetails
});
