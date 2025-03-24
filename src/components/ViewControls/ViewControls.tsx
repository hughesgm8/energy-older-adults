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

export function ViewControls({
  viewType,
  onViewTypeChange,
  onNavigate,
  currentDate,
  viewLevel,
  onViewLevelChange
}: ViewControlsProps) {

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
      {/* Category/Device Tabs */}
      <div className="border-b mt-10">
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => onViewLevelChange('category')}
            className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
              viewLevel === 'category' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Categories
            </span>
          </button>
          <button
            onClick={() => onViewLevelChange('device')}
            className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
              viewLevel === 'device' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Devices
            </span>
          </button>
        </div>
      </div>
      
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
  );
}