import { useState, useEffect, useMemo, useCallback } from 'react';
import { DeviceDataResponse, DeviceReading } from '../types/device';
import { ViewType } from '../types/views';
import { deviceCategorizationService } from '../services/DeviceCategorizationService';

export interface CategoryAveragesResult {
  averages: Record<string, number>;
  comparisonData: Record<string, {
    current: number;
    average: number;
    percentChange: number;
  }>;
  isLoading: boolean;
  error: string | null;
}

export const useHistoricalData = (
  participantId: string | undefined,
  deviceData: DeviceDataResponse,
  currentData: DeviceReading[],
  viewType: ViewType
): CategoryAveragesResult => {
  const [averages, setAverages] = useState<Record<string, number>>({});
  const [comparisonData, setComparisonData] = useState<Record<string, {
    current: number;
    average: number;
    percentChange: number;
  }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize current period calculation
  const currentPeriod = useMemo(() => {
    const period = {
      start: new Date(), 
      end: new Date()
    };

    if (viewType === 'day') {
      // Set to start of current day
      period.start.setHours(0, 0, 0, 0);
      // Set to end of current day
      period.end.setHours(23, 59, 59, 999);
    } else if (viewType === 'week') {
      // Set to start of current week (Sunday)
      const day = period.start.getDay();
      period.start.setDate(period.start.getDate() - day);
      period.start.setHours(0, 0, 0, 0);
      // Set to end of current week (Saturday)
      period.end.setDate(period.end.getDate() + (6 - day));
      period.end.setHours(23, 59, 59, 999);
    }

    return period;
  }, [viewType]); // Only recalculate when viewType changes

  // Move calculation function outside useEffect and memoize it
  const calculateHistoricalAverages = useCallback(async () => {
    if (!participantId || Object.keys(deviceData).length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get current data by category
      const currentCategoryTotals: Record<string, number> = {};
      
      // Process current data to get category totals
      // We need to process each device reading and organize by category
      currentData.forEach(reading => {
        // Process each device in the reading
        Object.entries(reading).forEach(([key, value]) => {
          // Skip the timestamp key
          if (key === 'timestamp') return;
          
          // Skip if value isn't a number
          if (typeof value !== 'number') return;
          
          // Get device category for this device name
          const category = deviceCategorizationService.getDeviceCategory(key);
          
          // Initialize or add to category total
          if (!currentCategoryTotals[category]) {
            currentCategoryTotals[category] = 0;
          }
          currentCategoryTotals[category] += value;
        });
      });

      // Historical calculation would ideally come from an API
      // For now, let's create a simple mock calculation from the device data
      const categoryCounts: Record<string, number> = {};
      const categoryHistoricalTotals: Record<string, number> = {};
      
      // Process all available data in deviceData
      Object.entries(deviceData).forEach(([deviceKey, device]) => {
        if (!device || !device.hourly || !device.hourly.data || !device.hourly.timestamps) return;
        
        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
        const category = deviceCategorizationService.getDeviceCategory(device.name);
        
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
          categoryHistoricalTotals[category] = 0;
        }
        
        // Process each data point
        device.hourly.data.forEach((value, index) => {
          if (typeof value !== 'number') return;
          
          // Check if this reading is within the current period using the memoized currentPeriod
          const timestamp = new Date(device.hourly.timestamps![index]);
          const isCurrentPeriod = timestamp >= currentPeriod.start && timestamp <= currentPeriod.end;
          
          // Only include in historical if not in current period
          if (!isCurrentPeriod) {
            categoryHistoricalTotals[category] += value;
            categoryCounts[category]++;
          }
        });
      });
      
      // Calculate the average
      const calculatedAverages: Record<string, number> = {};
      Object.keys(categoryHistoricalTotals).forEach(category => {
        // When using 30 days:
        // For day view, we want average per day
        // For week view, we want average per week
        if (viewType === 'day') {
          // Calculate daily average from all historical data except current day
          const totalDays = 30 - 1; // Subtract 1 for current day
          calculatedAverages[category] = categoryHistoricalTotals[category] / totalDays;
        } else {
          // Calculate weekly average - assuming 4 weeks of data 
          // And excluding current week
          const totalWeeks = (30 / 7) - 1; // ~4 weeks minus current week
          calculatedAverages[category] = categoryHistoricalTotals[category] / totalWeeks;
        }
      });

      // Calculate comparison data
      const calculatedComparisonData: Record<string, {
        current: number;
        average: number;
        percentChange: number;
      }> = {};

      Object.keys(currentCategoryTotals).forEach(category => {
        const currentValue = currentCategoryTotals[category] || 0;
        const averageValue = calculatedAverages[category] || 0;
        
        const percentChange = averageValue > 0 
          ? ((currentValue - averageValue) / averageValue) * 100
          : 0;
          
        calculatedComparisonData[category] = {
          current: currentValue,
          average: averageValue,
          percentChange: Math.round(percentChange)
        };
      });
      
      setAverages(calculatedAverages);
      setComparisonData(calculatedComparisonData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error calculating historical averages:', err);
      setError('Failed to calculate historical data');
      setIsLoading(false);
    }
  }, [participantId, deviceData, currentData, viewType, currentPeriod]); // Include currentPeriod in dependencies

  // Simplified useEffect that just calls the memoized function
  useEffect(() => {
    calculateHistoricalAverages();
  }, [calculateHistoricalAverages]); // This will only trigger when calculateHistoricalAverages changes

  return { averages, comparisonData, isLoading, error };
};