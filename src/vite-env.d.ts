/**
 * # Vite Environment Types
 *
 * The `vite-env.d.ts` file provides TypeScript with type definitions for Vite-specific features and environment variables.
 *
 * ## Purpose
 * - Ensures TypeScript recognizes Vite's global types, such as `import.meta.env`.
 * - Provides type checking and IntelliSense for Vite environment variables.
 *
 * ## Why It's Necessary
 * - Required for TypeScript projects using Vite to avoid type errors and ensure compatibility with Vite's features.
 */

// Provides type definitions for Vite's client-side features.
/// <reference types="vite/client" />