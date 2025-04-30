/**
 * # App Component
 *
 * The `App` component serves as the root component of the Energy Dashboard application. 
 * It initializes the application by rendering the `AppRouter`, which defines the routing structure.
 *
 * ## Purpose
 * - Acts as the entry point for the React application.
 * - Wraps the application with any global providers (if needed in the future).
 * - Renders the `AppRouter` to manage navigation between views.
 *
 * ## Why It's Necessary
 * - Provides a centralized location to initialize and structure the application.
 * - Ensures the routing logic (`AppRouter`) is properly integrated into the app.
 *
 * ## Usage
 * This file is typically rendered by `index.tsx` to start the application:
 * ```tsx
 * import React from 'react';
 * import ReactDOM from 'react-dom';
 * import App from './App';
 *
 * ReactDOM.render(<App />, document.getElementById('root'));
 * ```
 */

import { AppRouter } from './router/AppRouter';

function App() {
  return (
    <div className="App">
      <AppRouter />
    </div>
  );
}

export default App;