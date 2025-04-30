/**
 * # ViewControls Component
 *
 * The `ViewControls` component provides navigation and view-switching functionality for the dashboard. 
 * It allows users to toggle between "day" and "week" views and navigate through time periods (e.g., previous or next day/week).
 *
 * ## Key Features
 * - **View Type Selector**:
 *   - Allows users to switch between "day" and "week" views using a dropdown menu.
 * - **Date Navigation**:
 *   - Provides buttons to navigate to the previous or next time period (day or week).
 *   - Displays the current date or date range in a user-friendly format.
 * - **Responsive Design**:
 *   - Styled to fit seamlessly into the dashboard's layout, with a sticky position for consistent visibility.
 *
 * ## Props
 * - `viewType: ViewType`
 *   - The current view type, either `"day"` or `"week"`.
 * - `onViewTypeChange: (viewType: ViewType) => void`
 *   - Callback function triggered when the user selects a different view type.
 * - `onNavigate: (direction: 'prev' | 'next') => void`
 *   - Callback function triggered when the user clicks the "Previous" or "Next" button.
 * - `currentDate: Date`
 *   - The currently selected date, used to display the date or date range.
 *
 * ## Data Flow
 * - **View Type Changes**:
 *   - When the user selects a new view type (e.g., "day" or "week"), the `onViewTypeChange` callback is triggered to update the state in the parent component.
 * - **Date Navigation**:
 *   - Clicking the "Previous" or "Next" button triggers the `onNavigate` callback with the direction (`'prev'` or `'next'`), allowing the parent component to update the `currentDate`.
 * - **Date Formatting**:
 *   - The `formatDateRange` function formats the `currentDate` into a readable string, showing either a single date (for "day" view) or a date range (for "week" view).
 *
 * ## Usage
 * This component is typically used in `Dashboard.tsx` to provide navigation and view-switching functionality:
 * ```tsx
 * <ViewControls
 *   viewType={viewType}
 *   onViewTypeChange={(newViewType) => setViewType(newViewType)}
 *   onNavigate={(direction) => handleDateNavigation(direction)}
 *   currentDate={currentDate}
 * />
 * ```
 *
 * ## Notes
 * - The `formatDateRange` function ensures that the displayed date or date range is formatted correctly based on the selected view type.
 * - The component is styled with a sticky position to remain visible as the user scrolls through the dashboard.
 * - The `lucide-react` library is used for icons (e.g., `ChevronLeft`, `ChevronRight`, `Calendar`).
 *
 * ## Dependencies
 * - **lucide-react**: Provides icons for navigation and view selection.
 * - **Button**: A reusable button component from the UI library.
 * - **Select**: A dropdown component for selecting the view type.
 * - **ViewType**: Enum defining the possible view types (`"day"` or `"week"`).
 */

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ViewType } from '@/types/views';

interface ViewControlsProps {
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  currentDate: Date;
}

function formatDateRange(date: Date, viewType: ViewType) {
  if (viewType === 'day') {
    return date.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short'
    });
  }
  
  // For week view
  const sunday = new Date(date);
  const currentDayOfWeek = date.getDay();
  sunday.setDate(date.getDate() - currentDayOfWeek); // Go back to Sunday
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6); // Go forward to Saturday
  
  const startStr = sunday.toLocaleDateString('en-AU', { 
    day: 'numeric', 
    month: 'short'
  });
  
  const endStr = saturday.toLocaleDateString('en-AU', { 
    day: 'numeric', 
    month: 'short'
  });
  
  return `${startStr} - ${endStr}`;
}

export function ViewControls({
  viewType,
  onViewTypeChange,
  onNavigate,
  currentDate,
}: ViewControlsProps) {

  return (
    <div className="sticky top-16 z-10 flex justify-center mt-2 mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
        bg-primary-100 border border-primary-300 shadow-lg backdrop-blur-sm
        hover:shadow-xl transition-shadow duration-300">
        <Select value={viewType} onValueChange={(value: ViewType) => onViewTypeChange(value)}>
          <SelectTrigger className="w-[80px] sm:w-[120px] h-8 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none px-2 font-medium text-primary-700">
            <div className="flex items-center gap-2 overflow-hidden">
              <SelectValue placeholder="View" className="truncate" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center h-8 border-l border-primary-300 pl-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('prev')}
            aria-label="Previous Day"
            title={`Previous ${viewType === 'day' ? 'Day' : 'Week'}`}
            className="h-8 w-8 rounded-full hover:bg-primary-200 hover:text-primary-800 text-primary-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium min-w-24 text-center px-1 text-primary-900">
            {formatDateRange(currentDate, viewType)}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('next')}
            aria-label="Next Day"
            title={`Next ${viewType === 'day' ? 'Day' : 'Week'}`}
            className="h-8 w-8 rounded-full hover:bg-primary-200 hover:text-primary-800 text-primary-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}