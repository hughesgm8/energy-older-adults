/*
Necessary config for Vite to work with React and Tailwind CSS
This file is a Vite configuration file that sets up the development environment for a React application using Tailwind CSS.
It includes the following features:
1. **React Support**: The `@vitejs/plugin-react` plugin is used to enable React support in the Vite build process.
2. **Tailwind CSS Support**: The `@tailwindcss/vite` plugin is used to enable Tailwind CSS support in the Vite build process.
3. **Path Aliases**: The `resolve.alias` option is used to create a path alias for the `src` directory, allowing you to import files using `@/` instead of relative paths.
*/

import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    }
  }
})
