/**
 * # Dashboard Components Barrel File
 *
 * This file serves as a centralized export point for all components within the `Dashboard` module. 
 * It simplifies imports across the application by allowing developers to import multiple components 
 * from a single location.
 *
 * ## Purpose
 * - **Centralized Exports**: Provides a single entry point for all `Dashboard` components.
 * - **Simplified Imports**: Reduces the need for long, repetitive import paths in other files.
 * - **Maintainability**: Makes it easier to update file paths if the folder structure changes.
 *
 * ## Usage
 * Instead of importing components individually:
 * ```typescript
 * import { Dashboard } from '@/components/Dashboard/Dashboard';
 * import { CategoryView } from '@/components/Dashboard/views/CategoryView';
 * import { DeviceView } from '@/components/Dashboard/views/DeviceView';
 * ```
 * You can import them all from this file:
 * ```typescript
 * import { Dashboard, CategoryView, DeviceView } from '@/components/Dashboard';
 * ```
 */

// Export all dashboard components
export { Dashboard } from './Dashboard';
export { CategoryView } from './views/CategoryView';
export { DeviceView } from './views/DeviceView';
export { CostInsights } from './CostInsights/CostInsights';
export { SocialComparison } from './SocialComparison/SocialComparison';
export { EnergyChart } from './charts/EnergyChart';