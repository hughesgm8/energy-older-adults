import { Button } from '@/components/ui/button';
import { ViewControlsProps, ViewType } from '@/types/views';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ViewControls({ viewType, onViewTypeChange, onNavigate, currentDate }: ViewControlsProps) {
  
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