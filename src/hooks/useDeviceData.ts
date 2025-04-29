import { useState, useEffect, useMemo } from 'react';
import { DeviceDataResponse, DeviceReading, TimeRange } from '../types/device';
import { ViewType } from '../types/views';
import { generateMockDeviceData } from '../mocks/mockDeviceGenerator';

export function useDeviceData(participantId: string | undefined, currentDate: Date, viewType: ViewType) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceDataResponse>({});
  const [data, setData] = useState<DeviceReading[]>([]);
  const [previousWeekData, setPreviousWeekData] = useState<DeviceReading[]>([]);
  const [availableDateRange, setAvailableDateRange] = useState<{ start: Date, end: Date } | null>(null);

  // Get the boundaries of data available from all devices
  const getDataBoundaries = (deviceData: DeviceDataResponse) => {
    if (!deviceData || Object.keys(deviceData).length === 0) return null;
    
    const firstDevice = Object.values(deviceData)[0];
    if (!firstDevice?.hourly?.timestamps?.length) return null;
    
    // Create Date objects from all timestamps
    const timestampDates = firstDevice.hourly.timestamps.map(ts => new Date(ts));
    
    // Sort to find actual min and max dates (regardless of order in the array)
    const sortedDates = [...timestampDates].sort((a, b) => a.getTime() - b.getTime());
    
    console.log('Date range:', {
      start: sortedDates[0].toISOString(),
      end: sortedDates[sortedDates.length - 1].toISOString()
    });

    return {
      start: sortedDates[0],
      end: sortedDates[sortedDates.length - 1]
    };
  };

  // Get the time range for data display based on the current date and view type
  const getTimeRange = (date: Date, type: ViewType): TimeRange => {
    if (!availableDateRange) {
      return { start: date, end: date };
    }

    if (type === 'week') {
      // Find the Sunday at or before the current date
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay()); // Go back to Sunday
      start.setHours(0, 0, 0, 0);
      
      // End date is Saturday (6 days after Sunday)
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    } else {
      // Day view (unchanged)
      let end = new Date(date);
      end.setHours(23, 59, 59, 999);
      let start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      return { start, end };
    }
  };

  const aggregateDataByDay = (hourlyData: DeviceReading[]): DeviceReading[] => {
    if (!hourlyData.length) return [];
    
    const dailyData: DeviceReading[] = [];
    const dailyMap: { [dateStr: string]: DeviceReading } = {};
    const activeHoursMap: { [dateStr: string]: { [deviceKey: string]: number } } = {};
    
    // Extract all device keys (except timestamp)
    const deviceKeys = Object.keys(hourlyData[0]).filter(key => key !== 'timestamp');
    
    // Debug
    console.log('Device keys for aggregation:', deviceKeys);
    
    hourlyData.forEach(reading => {
      const date = new Date(reading.timestamp);
      // Use YYYY-MM-DD as the key
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dailyMap[dateStr]) {
        // Initialize the daily entry with 0 for all devices
        const dailyReading: DeviceReading = {
          timestamp: new Date(dateStr), // Use the date at midnight
        };
        
        // Initialize all device values to 0
        deviceKeys.forEach(key => {
          dailyReading[key] = 0;
        });
        
        dailyMap[dateStr] = dailyReading;
        activeHoursMap[dateStr] = {};
        deviceKeys.forEach(key => {
          activeHoursMap[dateStr][key] = 0;
        });
      }
      
      // Add current hour's values to daily sum
      deviceKeys.forEach(key => {
        if (typeof reading[key] === 'number') {
          const value = reading[key] as number;
          
          // Add to total energy
          dailyMap[dateStr][key] = (dailyMap[dateStr][key] as number || 0) + value;
          
          // Count active hours for any non-zero usage
          if (value > 0) {
            activeHoursMap[dateStr][key] = (activeHoursMap[dateStr][key] || 0) + 1;
            // Debug
            console.log(`Adding active hour for ${key} on ${dateStr}, value: ${value}, total: ${activeHoursMap[dateStr][key]}`);
          }
        }
      });
    });
    
    // Convert map to array and add active hours data
    Object.entries(dailyMap).forEach(([dateStr, day]) => {
      // Add active hours data to the reading object
      deviceKeys.forEach(key => {
        const activeHoursKey = `${key}_active_hours`;
        day[activeHoursKey] = activeHoursMap[dateStr][key] || 0;
        
        // Debug
        console.log(`Setting ${activeHoursKey} = ${day[activeHoursKey]} for ${dateStr}`);
      });
      
      dailyData.push(day);
    });
    
    // Debug the final data
    console.log('Aggregated daily data with active hours:', dailyData);
    
    // Sort by date
    return dailyData.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  };

  // Use useMemo to generate mock data only once
  const mockDeviceData = useMemo(() => {
    console.log('Generating mock device data (should happen only once)');
    return generateMockDeviceData(30); // Generate a full month of data
  }, []);

  // Fetch the device data
  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!participantId) {
        console.log('No participant ID');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching data for participant:', participantId);
        
        // For development/testing - use fake data
        const useFakeData = true; // Toggle this when needed
        
        if (useFakeData) {
          // Use the mock data generator
          console.log('Using mock device data');
          setDeviceData(mockDeviceData);
          setIsLoading(false);
          return;
        }
        
        // Original API fetch logic
        const response = await fetch(`/api/device-data/${participantId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Parsed device data:', data);
        setDeviceData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
        setIsLoading(false);
      }
    };

    fetchDeviceData();
  }, [participantId, mockDeviceData]);

  // Process data when device data or date/view changes
  useEffect(() => {
    if (Object.keys(deviceData).length === 0) return;
  
    const timeRange = getTimeRange(currentDate, viewType);
    const boundaries = getDataBoundaries(deviceData);
    
    if (!boundaries) return;
    
    console.log('Processing data for time range:', {
      requestedRange: timeRange,
      dataBoundaries: boundaries
    });
  
    try {
      // Process current time period data
      const updatedData: DeviceReading[] = [];
      const firstDevice = Object.values(deviceData)[0];
      
      firstDevice.hourly.timestamps.forEach((timestamp, index) => {
        const date = new Date(timestamp);
        
        // Only include data within both the time range AND data boundaries
        if (date >= timeRange.start && 
            date <= timeRange.end && 
            date >= boundaries.start && 
            date <= boundaries.end) {
            
          const reading: DeviceReading = {
            timestamp: date
          };
          
          Object.entries(deviceData).forEach(([deviceKey, device]) => {
            const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
            reading[deviceName] = device.hourly.data[index];
          });
          
          updatedData.push(reading);
        }
      });
  
      // Sort data by timestamp
      updatedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // For week view, aggregate the hourly data into daily data
      if (viewType === 'week') {
        const aggregatedData = aggregateDataByDay(updatedData);
        const processedData = ensureActiveHoursExist(aggregatedData);
        setData(processedData);
        
        // Process previous week data (only in week view)
        const prevWeekStart = new Date(timeRange.start);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        
        const prevWeekEnd = new Date(timeRange.end);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
        
        // Gather previous week data using same logic as current week
        const prevWeekData: DeviceReading[] = [];
        
        firstDevice.hourly.timestamps.forEach((timestamp, index) => {
          const date = new Date(timestamp);
          
          if (date >= prevWeekStart && 
              date <= prevWeekEnd && 
              date >= boundaries.start && 
              date <= boundaries.end) {
              
            const reading: DeviceReading = {
              timestamp: date
            };
            
            Object.entries(deviceData).forEach(([deviceKey, device]) => {
              const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
              reading[deviceName] = device.hourly.data[index];
            });
            
            prevWeekData.push(reading);
          }
        });
        
        // Sort and aggregate previous week data
        prevWeekData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const aggregatedPrevData = aggregateDataByDay(prevWeekData);
        const processedPrevData = ensureActiveHoursExist(aggregatedPrevData);  // Apply the function
        setPreviousWeekData(processedPrevData);  // Set state with processed data
      } else {
        const processedData = ensureActiveHoursExist(updatedData);  // Apply the function
        setData(processedData);
        // For day view, clear previous week data
        setPreviousWeekData([]);
      }
    } catch (error) {
      console.error('Error processing data:', error);
    }
  }, [deviceData, currentDate, viewType]);

  // Set available date range when device data changes
  useEffect(() => {
    if (Object.keys(deviceData).length > 0) {
      const boundaries = getDataBoundaries(deviceData);
      if (boundaries) {
        console.log('Setting available date range:', boundaries);
        setAvailableDateRange(boundaries);
      }
    }
  }, [deviceData]);

  // Process data for active hours if missing
  const ensureActiveHoursExist = (readings: DeviceReading[]) => {
    if (!readings || readings.length === 0) return readings;
    
    // Get device keys from the first reading
    const deviceKeys = Object.keys(readings[0]).filter(key => 
      key !== 'timestamp' && !key.endsWith('_active_hours')
    );
    
    console.log('Ensuring active hours exist for devices:', deviceKeys);
    
    // Create a deep copy to avoid modifying the original
    return readings.map(reading => {
      const newReading = {...reading};
      
      deviceKeys.forEach(key => {
        const activeHoursKey = `${key}_active_hours`;
        
        // Only add if not already present
        if (typeof newReading[activeHoursKey] !== 'number') {
          const value = typeof reading[key] === 'number' ? reading[key] : 0;
          newReading[activeHoursKey] = value > 0 ? 1 : 0;
          console.log(`Added missing active hours for ${key}: ${newReading[activeHoursKey]}`);
        }
      });
      
      return newReading;
    });
  };

  return {
    isLoading,
    error,
    deviceData,
    data,
    previousWeekData,
    availableDateRange,
    getTimeRange
  };
}