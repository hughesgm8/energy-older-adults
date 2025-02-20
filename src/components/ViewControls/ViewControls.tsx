import { Button } from '@/components/ui/button';
import { ViewControlsProps } from '@/types/views';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ViewControls({ viewType, onViewTypeChange, onNavigate, currentDate }: ViewControlsProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <Button
          variant={viewType === 'day' ? 'default' : 'secondary'}
          onClick={() => onViewTypeChange('day')}
        >
          Day
        </Button>
        <Button
          variant={viewType === 'week' ? 'default' : 'secondary'}
          onClick={() => onViewTypeChange('week')}
        >
          Week
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('prev')}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[120px] text-center">
          {currentDate.toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('next')}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}