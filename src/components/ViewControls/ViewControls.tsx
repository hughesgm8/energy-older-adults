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
  selectedCategory?: string | null;
  onBackToCategories?: () => void;
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
  selectedCategory = null,
  onBackToCategories
}: ViewControlsProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left side: Breadcrumbs or nothing */}
          <div className="flex items-center">
            {selectedCategory && onBackToCategories ? (
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  onClick={onBackToCategories}
                  className="flex items-center gap-1 text-sm h-8 px-2 -ml-2"
                  size="sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Home
                </Button>
                <span className="mx-1 text-gray-500">›</span>
                <span className="text-sm font-medium">{selectedCategory}</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">Home</span>
            )}
          </div>
          
          {/* Right side: View controls and date navigation */}
          <div className="flex items-center gap-2">
            {/* Date Period Selector */}
            <Select value={viewType} onValueChange={(value: ViewType) => onViewTypeChange(value)}>
              <SelectTrigger className="w-[120px] h-8">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <SelectValue placeholder="View" className="truncate" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Navigation */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('prev')}
              aria-label="Previous"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-sm font-medium min-w-24 text-center">
              {formatDateRange(currentDate, viewType)}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('next')}
              aria-label="Next"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}