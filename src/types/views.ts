export type ViewType = 'day' | 'week';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ViewControlsProps {
  viewType: ViewType;
  onViewTypeChange: (type: ViewType) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  currentDate: Date;
}