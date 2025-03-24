import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ViewControls } from '../ViewControls/ViewControls';
import { ComparisonResult, participantComparisonService } from '@/services/ParticipantComparisonService';
import { useDeviceData } from '../../hooks/useDeviceData';
import { deviceCategorizationService } from '../../services/DashboardCategorizationService';
import { ViewType } from '../../types/views';
import { EnergyChart } from './charts/EnergyChart';
import { CategoryView } from './views/CategoryView';
import { DeviceView } from './views/DeviceView';
import { CostInsights } from './CostInsights/CostInsights';
import { SocialComparison } from './SocialComparison/SocialComparison';

export function Dashboard() {
    const { participantId } = useParams();
    const [viewType, setViewType] = useState<ViewType>('day');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [viewLevel, setViewLevel] = useState<'category' | 'device'>('category');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Use our custom hook to fetch and manage device data
    const {
      isLoading,
      error,
      deviceData,
      data,
      previousWeekData,
      availableDateRange,
      getTimeRange
    } = useDeviceData(participantId, currentDate, viewType);

    useEffect(() => {
      // Handle window resize for mobile detection
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update currentDate when availableDateRange changes (first load)
    useEffect(() => {
      if (availableDateRange && isLoading) {
        setCurrentDate(new Date(availableDateRange.end));
      }
    }, [availableDateRange, isLoading]);

    const fetchComparisons = async () => {
      if (!participantId || !availableDateRange) return;
      
      // Define timeRange inside the function to ensure it's using current values
      const comparisonTimeRange = getTimeRange(currentDate, viewType);
      
      try {
        console.log('Fetching comparison data with:', {
          participantId,
          timeRange: comparisonTimeRange,
          viewType
        });
        const results = await participantComparisonService.getComparisons(
          participantId,
          deviceData,
          comparisonTimeRange,
          viewType
        );
        
        console.log('Comparison results:', results);
        setComparisons(results);
      } catch (error) {
        console.error('Error fetching comparisons:', error);
      }
    };

    useEffect(() => {
      if (Object.keys(deviceData).length > 0) {
        fetchComparisons();
      }
    }, [deviceData, currentDate, viewType]);

    const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setViewLevel('device');
    };
    
    const handleBackToCategories = () => {
      setSelectedCategory(null);
      setViewLevel('category');
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
      if (!availableDateRange) return;
  
      // Get all unique dates from all devices
      const allDates = new Set<string>();
      
      Object.values(deviceData).forEach(device => {
        if (device?.hourly?.timestamps) {
          device.hourly.timestamps.forEach(timestamp => {
            const date = new Date(timestamp);
            // Store just the date part (YYYY-MM-DD)
            allDates.add(date.toISOString().split('T')[0]);
          });
        }
      });
      
      // Convert to Date objects and sort
      const sortedUniqueDates = [...allDates]
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());
      
      // Find current date (without time component)
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const currentIndex = sortedUniqueDates.findIndex(
        date => date.toISOString().split('T')[0] === currentDateStr
      );
      
      // If current date not found, use closest match
      let targetIndex = currentIndex;
      if (targetIndex === -1) {
        // Find closest date
        const closestDate = sortedUniqueDates.reduce((prev, curr) => {
          const prevDiff = Math.abs(prev.getTime() - currentDate.getTime());
          const currDiff = Math.abs(curr.getTime() - currentDate.getTime());
          return prevDiff < currDiff ? prev : curr;
        });
        
        targetIndex = sortedUniqueDates.findIndex(
          date => date.getTime() === closestDate.getTime()
        );
      }
      
      // Navigate based on direction
      if (direction === 'prev') {
        targetIndex = Math.max(0, targetIndex - 1);
      } else {
        targetIndex = Math.min(sortedUniqueDates.length - 1, targetIndex + 1);
      }
      
      // Set to the target date
      const newDate = new Date(sortedUniqueDates[targetIndex]);
      console.log(`Navigating to: ${newDate.toISOString().split('T')[0]}`);
      setCurrentDate(newDate);
    };

    // Helper function to format date range for display
    const formatDateRange = (start: Date, end: Date, viewType: ViewType) => {
      if (viewType === 'day') {
        return end.toLocaleDateString('en-AU', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric'
        });
      }
      
      // For week view
      const startStr = start.toLocaleDateString('en-AU', { 
        day: 'numeric', 
        month: 'short'
      });
      
      const endStr = end.toLocaleDateString('en-AU', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric'
      });
      
      return `${startStr} - ${endStr}`;
    };

    // Get color based on device category
    const getCategoryColor = (deviceName: string) => {
      const category = deviceCategorizationService.getDeviceCategory2(deviceName);
      const colorMap: Record<string, string> = {
        'Entertainment': '#2563eb', // blue
        'Smart Lighting': '#2dd4bf', // teal
        'Kitchen': '#dc2626', // red
        'Smart Home': '#8b5cf6', // purple
        'Heating': '#f59e0b', // amber
        'Cooling': '#3b82f6', // sky blue
        'Home Office': '#10b981', // emerald
      };
      
      return colorMap[category] || '#6b7280'; // gray as default
    };

    const getUniqueDeviceColor = (deviceKey: string, index: number) => {
      // A selection of distinct colors that are visually distinguishable
      const colorPalette = [
        '#2563eb', // blue
        '#dc2626', // red
        '#10b981', // emerald
        '#8b5cf6', // purple
        '#f59e0b', // amber
        '#ec4899', // pink
        '#14b8a6', // teal
        '#f97316', // orange
        '#6366f1', // indigo
        '#84cc16', // lime
        '#7c3aed', // violet
        '#06b6d4', // cyan
        '#eab308', // yellow
        '#ef4444', // bright red
        '#3b82f6', // bright blue
      ];
      
      // Use device key to consistently get the same color for a device
      // Or fallback to index if we have many devices
      return colorPalette[index % colorPalette.length];
    };

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen p-4">Loading dashboard data...</div>;
    }
    
    if (error) {
      return <div className="flex justify-center items-center min-h-screen p-4 text-red-500">Error: {error}</div>;
    }
    
    if (!deviceData || Object.keys(deviceData).length === 0) {
      return <div className="flex justify-center items-center min-h-screen p-4">No device data available for this participant.</div>;
    }
    
    const timeRange = getTimeRange(currentDate, viewType);

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* View Level Toggle */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
              Your Energy Usage ({participantId})
            </h1>
          </div>
          {viewLevel === 'category' && selectedCategory && (
            <div className="flex items-center mb-4 border-b pb-2">
              <Button 
                variant="ghost" 
                onClick={handleBackToCategories}
                className="flex items-center gap-1 text-sm"
                size="sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                All Categories
              </Button>
              <span className="mx-2">›</span>
              <span className="font-medium">{selectedCategory}</span>
            </div>
          )}

          {/* View Controls */}
          <ViewControls
            viewType={viewType}
            onViewTypeChange={setViewType}
            onNavigate={handleNavigate}
            currentDate={currentDate}
            viewLevel={viewLevel}
            onViewLevelChange={setViewLevel} 
          />

          {/* Date Range Info */}
          <div className="text-sm text-gray-600 mb-4 text-center sm:text-left">
            Showing data from {formatDateRange(timeRange.start, timeRange.end, viewType)}
            {data.length === 0 && " (No data available for this period)"}
          </div>

          {/* Dynamic Content - Either Categories or Devices */}
          {viewLevel === 'category' ? (
            // Category View Component
            <CategoryView 
              data={data}
              deviceData={deviceData}
              onCategoryClick={handleCategoryClick}
              getCategoryColor={getCategoryColor}
            />
          ) : (
            // Device View
            <DeviceView 
              data={data}
              deviceData={deviceData}
              selectedCategory={selectedCategory}
            />
          )}

          {/* Chart Card */}
          {viewLevel === 'device' && (
            <Card className="shadow">
              <CardContent className="pt-6">
                <EnergyChart 
                  data={data}
                  deviceData={deviceData}
                  viewType={viewType}
                  isMobile={isMobile}
                  getUniqueDeviceColor={getUniqueDeviceColor}
                />
              </CardContent>
            </Card>
          )}

          {/* Cost Insights Section */}
          <CostInsights 
            data={data}
            deviceData={deviceData}
            previousWeekData={previousWeekData}
            viewType={viewType}
          />

          {/* Social Comparison Section */}
          <SocialComparison 
            comparisons={comparisons}
            viewType={viewType}
          />
        </div>
      </div>
    );
}