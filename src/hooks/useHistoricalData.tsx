/**
 * # useHistoricalData Hook
 *
 * The `useHistoricalData` hook is responsible for calculating historical averages and comparisons for energy usage data. 
 * It processes current and historical data to provide insights at both the category and device levels.
 *
 * ## Key Features
 * - **Historical Averages**:
 *   - Calculates historical averages for energy usage by category and device.
 * - **Comparison Data**:
 *   - Compares current energy usage with historical averages and calculates percentage changes.
 * - **Time Period Management**:
 *   - Dynamically determines the current time period (day or week) and excludes it from historical calculations.
 * - **Error Handling**:
 *   - Tracks loading and error states during data processing.
 *
 * ## Parameters
 * - `participantId: string | undefined`
 *   - The ID of the participant whose historical data is being processed.
 * - `deviceData: DeviceDataResponse`
 *   - The raw device data, including hourly readings and timestamps.
 * - `currentData: DeviceReading[]`
 *   - The processed energy usage data for the current time period.
 * - `viewType: ViewType`
 *   - Specifies whether the data is being viewed by "day" or "week".
 *
 * ## Returned Values
 * - `averages: Record<string, number>`
 *   - Historical averages for each category.
 * - `comparisonData: Record<string, { current: number; average: number; percentChange: number }>`
 *   - Comparison data for each category, including current usage, historical average, and percentage change.
 * - `deviceComparisonData: Record<string, { current: number; average: number; percentChange: number }>`
 *   - Comparison data for each device, including current usage, historical average, and percentage change.
 * - `isLoading: boolean`
 *   - Indicates whether the data is currently being processed.
 * - `error: string | null`
 *   - Contains an error message if data processing fails, otherwise `null`.
 *
 * ## Data Flow
 * - **Current Data Processing**:
 *   - Aggregates current energy usage data by category and device.
 * - **Historical Data Processing**:
 *   - Processes historical data from `deviceData` to calculate averages for categories and devices.
 *   - Excludes the current time period from historical calculations.
 * - **Comparison Data**:
 *   - Calculates percentage changes between current usage and historical averages for both categories and devices.
 *
 * ## Usage
 * This hook is typically used in components like `DeviceView` and `CategoryView` to provide historical insights:
 * ```typescript
 * const {
 *   averages,
 *   comparisonData,
 *   deviceComparisonData,
 *   isLoading,
 *   error
 * } = useHistoricalData(participantId, deviceData, currentData, viewType);
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 * 
 * return (
 *   <CategoryView comparisonData={comparisonData} />
 * );
 * ```
 *
 * ## Notes
 * - The hook dynamically calculates the current time period (day or week) using `useMemo` and excludes it from historical averages.
 * - The `calculateHistoricalAverages` function processes both current and historical data to generate insights.
 * - The hook uses `useEffect` to trigger calculations whenever the input parameters change.
 * - The `deviceCategorizationService` is used to group devices by category during data processing.
 *
 * ## Dependencies
 * - **DeviceCategorizationService**: Groups devices by category for historical and current data processing.
 * - **DeviceDataResponse**: Type definition for the raw device data structure.
 * - **DeviceReading**: Type definition for processed energy usage data.
 * - **ViewType**: Enum defining the possible view types (`"day"` or `"week"`).
 */

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
  deviceComparisonData: Record<string, {
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
  const [deviceComparisonData, setDeviceComparisonData] = useState<Record<string, {
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

  const calculateHistoricalAverages = useCallback(async () => {
    if (!participantId || Object.keys(deviceData).length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get current data by category and device
      const currentCategoryTotals: Record<string, number> = {};
      const currentDeviceTotals: Record<string, number> = {};
      
      // Process current data to get category and device totals
      currentData.forEach(reading => {
        Object.entries(reading).forEach(([key, value]) => {
          if (key === 'timestamp' || typeof value !== 'number') return;
          
          // Track by device
          if (!currentDeviceTotals[key]) {
            currentDeviceTotals[key] = 0;
          }
          currentDeviceTotals[key] += value;
          
          // Track by category
          const category = deviceCategorizationService.getDeviceCategory(key);
          if (!currentCategoryTotals[category]) {
            currentCategoryTotals[category] = 0;
          }
          currentCategoryTotals[category] += value;
        });
      });

      // Historical calculation preparation
      const categoryCounts: Record<string, number> = {};
      const categoryHistoricalTotals: Record<string, number> = {};
      const deviceCounts: Record<string, number> = {};
      const deviceHistoricalTotals: Record<string, number> = {};
      
      // Process all available data in deviceData
      Object.entries(deviceData).forEach(([deviceKey, device]) => {
        if (!device || !device.hourly || !device.hourly.data || !device.hourly.timestamps) return;
        
        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
        const category = deviceCategorizationService.getDeviceCategory(device.name);
        
        // Initialize tracking for this category and device
        if (!categoryCounts[category]) {
          categoryCounts[category] = 0;
          categoryHistoricalTotals[category] = 0;
        }
        
        if (!deviceCounts[deviceName]) {
          deviceCounts[deviceName] = 0;
          deviceHistoricalTotals[deviceName] = 0;
        }
        
        // Process each data point
        device.hourly.data.forEach((value, index) => {
          if (typeof value !== 'number') return;
          
          // Check if this reading is within the current period
          const timestamp = new Date(device.hourly.timestamps![index]);
          const isCurrentPeriod = timestamp >= currentPeriod.start && timestamp <= currentPeriod.end;
          
          // Only include in historical if not in current period
          if (!isCurrentPeriod) {
            // Add to category totals
            categoryHistoricalTotals[category] += value;
            categoryCounts[category]++;
            
            // Add to device totals
            deviceHistoricalTotals[deviceName] += value;
            deviceCounts[deviceName]++;
          }
        });
      });
      
      // Calculate category averages
      const calculatedAverages: Record<string, number> = {};
      Object.keys(categoryHistoricalTotals).forEach(category => {
        if (viewType === 'day') {
          const totalDays = 30 - 1; // Subtract 1 for current day
          calculatedAverages[category] = categoryHistoricalTotals[category] / totalDays;
        } else {
          const totalWeeks = (30 / 7) - 1; // ~4 weeks minus current week
          calculatedAverages[category] = categoryHistoricalTotals[category] / totalWeeks;
        }
      });

      // Calculate device-level averages
      const deviceAverages: Record<string, number> = {};
      Object.keys(deviceHistoricalTotals).forEach(deviceName => {
        if (viewType === 'day') {
          const totalDays = 30 - 1;
          deviceAverages[deviceName] = deviceHistoricalTotals[deviceName] / totalDays;
        } else {
          const totalWeeks = (30 / 7) - 1;
          deviceAverages[deviceName] = deviceHistoricalTotals[deviceName] / totalWeeks;
        }
      });

      // Calculate comparison data for categories
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
      
      // Calculate comparison data for individual devices
      const calculatedDeviceComparisonData: Record<string, {
        current: number;
        average: number;
        percentChange: number;
      }> = {};

      Object.keys(currentDeviceTotals).forEach(deviceName => {
        const currentValue = currentDeviceTotals[deviceName] || 0;
        const averageValue = deviceAverages[deviceName] || 0;
        
        const percentChange = averageValue > 0 
          ? ((currentValue - averageValue) / averageValue) * 100
          : 0;
          
        calculatedDeviceComparisonData[deviceName] = {
          current: currentValue,
          average: averageValue,
          percentChange: Math.round(percentChange)
        };
      });
      
      setAverages(calculatedAverages);
      setComparisonData(calculatedComparisonData);
      setDeviceComparisonData(calculatedDeviceComparisonData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error calculating historical averages:', err);
      setError('Failed to calculate historical data');
      setIsLoading(false);
    }
  }, [participantId, deviceData, currentData, viewType, currentPeriod]);

  // Simplified useEffect that just calls the memoized function
  useEffect(() => {
    calculateHistoricalAverages();
  }, [calculateHistoricalAverages]);

  return { averages, comparisonData, deviceComparisonData, isLoading, error };
};