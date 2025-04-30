/**
 * # Views Types
 *
 * This file defines TypeScript types and interfaces related to view management in the application. 
 * These types ensure consistency when handling view types, time ranges, and view control props.
 *
 * ## Key Types
 * - **ViewType**:
 *   - Represents the type of view, either `'day'` or `'week'`.
 * - **TimeRange**:
 *   - Represents a start and end date for a specific time range.
 * - **ViewControlsProps**:
 *   - Defines the props for the `ViewControls` component, including:
 *     - `viewType`: The current view type (`'day'` or `'week'`).
 *     - `onViewTypeChange`: Callback for changing the view type.
 *     - `onNavigate`: Callback for navigating between time periods.
 *     - `currentDate`: The currently selected date.
 *
 * ## Usage
 * These types are used in components like `ViewControls` to manage view-related functionality.
 */

export type ViewType = 'day' | 'week';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ViewControlsProps {
    viewType: ViewType;
    onViewTypeChange: (viewType: ViewType) => void;
    onNavigate: (direction: 'prev' | 'next') => void;
    currentDate: Date;
  }