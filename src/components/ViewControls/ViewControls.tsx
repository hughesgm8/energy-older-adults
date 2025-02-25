import { Button } from '@/components/ui/button';
import { ViewControlsProps, ViewType } from '@/types/views';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ViewControls({ viewType, onViewTypeChange, onNavigate, currentDate }: ViewControlsProps) {
  
  const formatDateRange = (date: Date, viewType: ViewType) => {
    // For day view, just show the current date
    if (viewType === 'day') {
      return date.toLocaleDateString('en-AU', { 
        day: 'numeric', 
        month: 'short'
      });
    }
    
    // For week view, calculate start date and show range
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - 6); // Go back 6 days to make a 7-day week
    
    // Format the start date
    const startStr = startDate.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short'
    });
    
    // Format the end date
    const endStr = date.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short'
    });
    
    return `${startStr} - ${endStr}`;
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant={viewType === 'day' ? 'default' : 'secondary'}
          onClick={() => onViewTypeChange('day')}
          className="flex-1 sm:flex-none"
          size="sm"
        >
          Day
        </Button>
        <Button
          variant={viewType === 'week' ? 'default' : 'secondary'}
          onClick={() => onViewTypeChange('week')}
          className="flex-1 sm:flex-none"
          size="sm"
        >
          Week
        </Button>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('prev')}
          aria-label="Previous"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium min-w-20 text-center">
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
  );
}