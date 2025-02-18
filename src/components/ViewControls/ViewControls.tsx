import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewControlsProps } from '../../types/views';

export function ViewControls({ viewType, onViewTypeChange, onNavigate, currentDate }: ViewControlsProps) {
  const formatDate = (date: Date) => {
    if (viewType === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant={viewType === 'day' ? 'default' : 'outline'}
          onClick={() => onViewTypeChange('day')}
        >
          Day
        </Button>
        <Button
          variant={viewType === 'week' ? 'default' : 'outline'}
          onClick={() => onViewTypeChange('week')}
        >
          Week
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onNavigate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[200px] text-center font-medium">
          {formatDate(currentDate)}
        </span>
        <Button variant="outline" size="icon" onClick={() => onNavigate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}