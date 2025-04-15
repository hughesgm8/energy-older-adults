import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ViewControls } from '../ViewControls/ViewControls';
import { ComparisonResult, participantComparisonService } from '@/services/ParticipantComparisonService';
import { useDeviceData } from '../../hooks/useDeviceData';
import { deviceCategorizationService } from '../../services/DeviceCategorizationService';
import { ViewType } from '../../types/views';
import { EnergyChart } from './charts/EnergyChart';
import { CategoryView } from './views/CategoryView';
import { DeviceView } from './views/DeviceView';
import { CostInsights } from './CostInsights/CostInsights';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { UsageSummary } from './UsageSummary/UsageSummary';

/* SOCIAL COMPARISON FEATURE
This feature is temporarily disabled due to lack of realistic comparison data. 
The code is preserved for future implementation.
To re-enable:
1. Uncomment the SocialComparison import statement below.
2. Uncomment the SocialComparison component below ("useState<ComparisonResult[]>([])")
3. Uncomment the related state and effect in this file
4. Ensure the participantComparisonService is properly configured with realistic data
*/
// import { SocialComparison } from './SocialComparison/SocialComparison';

export function Dashboard() {
    const { participantId } = useParams();
    const [viewType, setViewType] = useState<ViewType>('day');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    // const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

    const {
      comparisonData,
      isLoading: isLoadingHistorical
    } = useHistoricalData(
      participantId,
      deviceData,
      data,
      viewType
    );

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

    
    /* const fetchComparisons = async () => {
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
    }, [deviceData, currentDate, viewType]); */

    const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
    };
    
    const handleBackToCategories = () => {
      setSelectedCategory(null);
    };

    const handleNavigate = useCallback((direction: 'prev' | 'next') => {
      if (!availableDateRange) return;
      
      console.log("Navigation triggered:", direction, "Current date:", currentDate.toISOString());
      
      // STEP 1: Calculate target date based on current view type
      const newTargetDate = new Date(currentDate);
      
      if (viewType === 'day') {
        // For day view, simply move by 1 day
        newTargetDate.setDate(newTargetDate.getDate() + (direction === 'next' ? 1 : -1));
      } else {
        // For week view, move by 7 days exactly
        newTargetDate.setDate(newTargetDate.getDate() + (direction === 'next' ? 7 : -7));
      }
      
      console.log("Target date calculated:", newTargetDate.toISOString());
    
      // STEP 2: Get all unique dates from available data
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
      
      if (allDates.size === 0) {
        console.log("No available dates found in data");
        return;
      }
      
      // STEP 3: Convert to Date objects and sort
      const sortedUniqueDates = [...allDates]
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());
      
      console.log("Available dates range:", 
        sortedUniqueDates[0].toISOString(), "to", 
        sortedUniqueDates[sortedUniqueDates.length - 1].toISOString(),
        "Total dates:", sortedUniqueDates.length);
      
      // STEP 4: Find the best matching date for our target
      const targetDateStr = newTargetDate.toISOString().split('T')[0];
      
      // First try to find exact match
      let matchIndex = sortedUniqueDates.findIndex(
        date => date.toISOString().split('T')[0] === targetDateStr
      );
      
      // If no exact match, find closest available date
      if (matchIndex === -1) {
        console.log("No exact match for target date, finding closest available date");
        
        if (viewType === 'day') {
          // For day view, find closest date
          const closestDate = sortedUniqueDates.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.getTime() - newTargetDate.getTime());
            const currDiff = Math.abs(curr.getTime() - newTargetDate.getTime());
            return prevDiff < currDiff ? prev : curr;
          });
          
          matchIndex = sortedUniqueDates.findIndex(
            date => date.getTime() === closestDate.getTime()
          );
          console.log("Selected closest available date:", sortedUniqueDates[matchIndex].toISOString());
        } else {
          // For week view, try to find a date in the target week
          // Define target week boundaries
          const targetWeekStart = new Date(newTargetDate);
          const dayOfWeek = targetWeekStart.getDay();
          targetWeekStart.setDate(targetWeekStart.getDate() - dayOfWeek); // Go to Sunday
          
          const targetWeekEnd = new Date(targetWeekStart);
          targetWeekEnd.setDate(targetWeekStart.getDate() + 6); // Go to Saturday
          
          // Find any date within the target week
          matchIndex = sortedUniqueDates.findIndex(date => 
            date >= targetWeekStart && date <= targetWeekEnd
          );
          
          // If no date in target week, use closest date to target week start
          if (matchIndex === -1) {
            const closestDate = sortedUniqueDates.reduce((prev, curr) => {
              const prevDiff = Math.abs(prev.getTime() - targetWeekStart.getTime());
              const currDiff = Math.abs(curr.getTime() - targetWeekStart.getTime());
              return prevDiff < currDiff ? prev : curr;
            });
            
            matchIndex = sortedUniqueDates.findIndex(
              date => date.getTime() === closestDate.getTime()
            );
            console.log("No date in target week, using closest available date:", 
              sortedUniqueDates[matchIndex].toISOString());
          } else {
            console.log("Found date within target week:", sortedUniqueDates[matchIndex].toISOString());
          }
        }
      }
      
      // STEP 5: Ensure we don't go beyond available data range
      matchIndex = Math.max(0, Math.min(sortedUniqueDates.length - 1, matchIndex));
      const finalDate = sortedUniqueDates[matchIndex];
      
      console.log(`Navigating to: ${finalDate.toISOString()}`);
      setCurrentDate(finalDate);
      
    }, [availableDateRange, deviceData, currentDate, viewType]);

    // Helper function to format date range for display
    const formatDateRange = (date: Date, viewType: ViewType) => {
  if (viewType === 'day') {
    return date.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short'
    });
  }
    
  // For week view, ALWAYS calculate Sunday to Saturday based on the current date
  const sunday = new Date(date);
  const currentDayOfWeek = date.getDay();
  sunday.setDate(date.getDate() - currentDayOfWeek); // Go back to Sunday
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6); // Go forward to Saturday
  
  console.log("Week view showing:", sunday.toISOString(), "to", saturday.toISOString());
  
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

    // Get color based either on device name or category name
    const getCategoryColor = (input: string) => {
      let category = input;
      
      // First check if input is already a category name by normalizing it
      const normalizedInput = input.trim();
      
      // Map old/similar categories to standardized ones
      const categoryMapping: Record<string, string> = {
        // Standard categories
        'Entertainment': 'Entertainment',
        'Lighting': 'Lighting',
        'Smart Lighting': 'Lighting',
        'Kitchen': 'Kitchen',
        'Smart Home': 'Smart Home',
        'Heating': 'Heating & Cooling',
        'Cooling': 'Heating & Cooling',
        'Ambience': 'Heating & Cooling',
        'Home Office': 'Home Office',
        // Additional mappings
        'Drink Prep': 'Kitchen',
        'Cooking': 'Kitchen',
      };
      
      // If input matches any known category (directly or via mapping), use the standardized version
      if (categoryMapping[normalizedInput]) {
        category = categoryMapping[normalizedInput];
      } else {
        // Otherwise, try to get the category from the device name
        try {
          const deviceCategory = deviceCategorizationService.getDeviceCategory(input);
          // Map the device category to our standardized categories
          category = categoryMapping[deviceCategory] || deviceCategory;
        } catch (e) {
          console.error(`Error getting category for "${input}":`, e);
          // Just use the input as is if there's an error
        }
      }
      
      // Define colors for our standardized categories
      const colorMap: Record<string, string> = {
        'Entertainment': '#2563eb', // blue
        'Lighting': '#2dd4bf',      // teal
        'Kitchen': '#dc2626',       // red
        'Smart Home': '#8b5cf6',    // purple
        'Heating & Cooling': '#f59e0b', // amber
        'Home Office': '#10b981',   // emerald
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
        {/* ViewControls as the first element - top of the page */}
        <ViewControls
          viewType={viewType}
          onViewTypeChange={setViewType}
          onNavigate={handleNavigate}
          currentDate={currentDate}
          selectedCategory={selectedCategory}
          onBackToCategories={handleBackToCategories}
        />
        
        {/* Main content with proper spacing */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Section 1: Usage Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {selectedCategory !== null ? `Current Usage: ${selectedCategory}` : 'Current Usage'}
            </h2>
            
            {/* Overall Usage Summary */}
            <UsageSummary
              data={data}
              deviceData={deviceData}
              viewType={viewType}
              comparisonData={comparisonData}
            />

            {/* Cost disclaimer */}
            <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
              Any costs shown are estimates based on the standard UK electricity price cap. Source: Ofgem
            </p>
            
            {/* Dynamic Content - Either Categories or Devices */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">
                {selectedCategory === null ? 'Breakdown by Category' : 'Devices'}
              </h3>
              {selectedCategory === null ? (
                // Category View with cost display
                <CategoryView 
                  data={data}
                  deviceData={deviceData}
                  onCategoryClick={handleCategoryClick}
                  getCategoryColor={getCategoryColor}
                  comparisonData={comparisonData}
                  viewType={viewType}
                  showCost={true} 
                />
              ) : (
                // Device View with cost display
                <DeviceView 
                  data={data}
                  deviceData={deviceData}
                  selectedCategory={selectedCategory}
                  participantId={participantId}
                  viewType={viewType}
                  showCost={true} 
                />
              )}
            </div>
          </div>

          {/* Section 2: Comparative Insights - Reimagined */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Usage Patterns & Trends</h2>
            
            {/* Chart Card - Shows patterns over time */}
            <Card className="shadow mb-6">
              <CardContent className="pt-6">
                <EnergyChart 
                  data={data}
                  deviceData={deviceData}
                  viewType={viewType}
                  viewLevel={selectedCategory === null ? 'category' : 'device'}
                  selectedCategory={selectedCategory}
                  isMobile={isMobile}
                  getUniqueDeviceColor={getUniqueDeviceColor}
                  getCategoryColor={getCategoryColor}
                />
              </CardContent>
            </Card>

            {/* Only show detailed cost insights if we're not already showing costs in categories */}
            <CostInsights 
              data={data}
              deviceData={deviceData}
              previousWeekData={previousWeekData}
              viewType={viewType}
              viewLevel={selectedCategory === null ? 'category' : 'device'}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </div>
    );
}