import { useState, useEffect } from 'react';
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
    
    // Extract all device keys (except timestamp)
    const deviceKeys = Object.keys(hourlyData[0]).filter(key => key !== 'timestamp');
    
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
      }
      
      // Add current hour's values to daily sum
      deviceKeys.forEach(key => {
        if (typeof reading[key] === 'number') {
          if (typeof dailyMap[dateStr][key] === 'number' && typeof reading[key] === 'number') {
            dailyMap[dateStr][key] += reading[key];
          }
        }
      });
    });
    
    // Convert map to array
    Object.values(dailyMap).forEach(day => {
      dailyData.push(day);
    });
    
    // Sort by date
    return dailyData.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  };

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
          const fakeData = generateMockDeviceData();
          setDeviceData(fakeData);
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
  }, [participantId]);

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
        setData(aggregatedData);
        
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
        setPreviousWeekData(aggregatedPrevData);
      } else {
        setData(updatedData);
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