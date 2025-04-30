/**
 * # Main Entry Point
 *
 * The `main.tsx` file serves as the entry point for the Energy Dashboard application. 
 * It initializes the React application and renders the root component (`App`) into the DOM.
 *
 * ## Purpose
 * - Attaches the React application to the `#root` element in the HTML file.
 * - Wraps the application in `StrictMode` to help identify potential issues during development.
 * - Imports global styles (`index.css`) for the application.
 *
 * ## Why It's Necessary
 * - Acts as the bridge between the React application and the browser DOM.
 * - Ensures the `App` component is properly rendered and initialized.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)