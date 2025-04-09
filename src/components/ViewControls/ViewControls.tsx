import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { ViewControlsProps, ViewType } from '@/types/views';
import { Calendar, ChevronLeft, ChevronRight, LayoutGrid, Smartphone } from 'lucide-react';
import { useState } from 'react';
import React from 'react';

function ViewControlsBase({
  viewType,
  onViewTypeChange,
  onNavigate,
  currentDate,
}: ViewControlsProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const formatDateRange = (date: Date, viewType: ViewType) => {
    if (viewType === 'day') {
        return date.toLocaleDateString('en-AU', { 
            day: 'numeric', 
            month: 'short'
        });
    }
    
    // For week view, calculate Sunday to Saturday
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay()); // Go back to Sunday
    
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6); // Go to Saturday
    
    // Format the dates
    const startStr = sunday.toLocaleDateString('en-AU', { 
        day: 'numeric', 
        month: 'short'
    });
    
    const endStr = saturday.toLocaleDateString('en-AU', { 
        day: 'numeric', 
        month: 'short'
    });
    
    return `${startStr} - ${endStr}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Date and View Type Controls - Together */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Period Selector (Day/Week) - On left */}
        <Select value={viewType} onValueChange={(value: ViewType) => onViewTypeChange(value)}>
          <SelectTrigger className="w-[120px] h-9">
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
        
        {/* Date Navigation - On right */}
        <div className="flex items-center gap-2">
        <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsNavigating(true);
              onNavigate('prev');
              setTimeout(() => setIsNavigating(false), 300);
            }}
            aria-label="Previous"
            className="h-8 w-8"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <span className="animate-spin">↻</span>
            ): (
              <ChevronLeft className="h-4 w-4" />
            )}
            </Button>
          <div className="text-sm font-medium min-w-24 text-center">
            {formatDateRange(currentDate, viewType)}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsNavigating(true);
              onNavigate('next');
              setTimeout(() => setIsNavigating(false), 300);
            }}
            aria-label="Next"
            className="h-8 w-8"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <span className="animate-spin">↻</span>
            ): (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const ViewControls = React.memo(ViewControlsBase);