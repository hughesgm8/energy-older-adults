import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar } from 'recharts';
import { Activity, Users, PoundSterlingIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { DeviceDataResponse, DeviceInfo, DeviceReading, DeviceInsightsParams, DeviceInsights } from '../../types/device';
import { TimeRange, ViewType } from '../../types/views';
import { ViewControls } from '../ViewControls/ViewControls';
import { useParams } from 'react-router-dom';
import { deviceCategorizationService } from '../../services/DashboardCategorizationService';
import { ComparisonResult, participantComparisonService } from '@/services/ParticipantComparisonService';
import DeviceComparisonChart from '../ComparisonChart/DeviceComparisonChart';
import { DeviceIcon } from '../DeviceIcon/DeviceIcon';
import { CostEstimationService } from '../../services/CostEstimationService';

export function Dashboard() {
    const { participantId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deviceData, setDeviceData] = useState<DeviceDataResponse>({});
    const [data, setData] = useState<DeviceReading[]>([]);
    const [viewType, setViewType] = useState<ViewType>('day');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [availableDateRange, setAvailableDateRange] = useState<{ start: Date, end: Date } | null>(null);
    const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
    const [previousWeekData, setPreviousWeekData] = useState<DeviceReading[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    console.log('Full API response:', data);

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

    // Get the boundaries of data available from all devices
    const getDataBoundaries = (deviceData: DeviceDataResponse) => {
        if (!deviceData || Object.keys(deviceData).length === 0) return null;
        
        const firstDevice = Object.values(deviceData)[0];
        if (!firstDevice?.hourly?.timestamps?.length) return null;
        
        // Create Date objects from all timestamps
        const timestampDates = firstDevice.hourly.timestamps.map(ts => new Date(ts));
        
        // Sort to find actual min and max dates (regardless of order in the array)
        const sortedDates = [...timestampDates].sort((a, b) => a.getTime() - b.getTime());
        
        console.log('All available timestamps:', firstDevice.hourly.timestamps);
        console.log('Date range:', {
            start: sortedDates[0].toISOString(),
            end: sortedDates[sortedDates.length - 1].toISOString()
        });
    
        return {
            start: sortedDates[0],
            end: sortedDates[sortedDates.length - 1]
        };
    };

    const fetchComparisons = async () => {
        if (!participantId || !availableDateRange) return;
        
        try {
          const results = await participantComparisonService.getComparisons(
            participantId,
            deviceData,
            timeRange,
            viewType
          );
          
          setComparisons(results);
        } catch (error) {
          console.error('Error fetching comparisons:', error);
        }
      };

    useEffect(() => {
        if (Object.keys(deviceData).length > 0) {
            const boundaries = getDataBoundaries(deviceData);
            if (boundaries) {
                console.log('Setting available date range:', boundaries);
                setAvailableDateRange(boundaries);
                
                // Set current date to the latest available date when first loading data
                if (isLoading) {
                    setCurrentDate(new Date(boundaries.end));
                }
            }
        }
    }, [deviceData, isLoading]);

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
            
            // For display purposes we want to show the full week, even if some days are in the future
            // We only adjust data boundaries when actually fetching data
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
        
        console.log('All available dates for navigation:', 
            sortedUniqueDates.map(d => d.toISOString().split('T')[0]));
        
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

    const getDeviceInsights = ({ deviceData, deviceKey, deviceInfo }: DeviceInsightsParams): DeviceInsights => {
        if (!deviceData?.length || !deviceKey || !deviceInfo) {
            throw new Error('Missing required parameters for device insights');
        }
    
        const deviceName = deviceInfo.name.toLowerCase().replace(/\s+/g, '_');
        
        // Get threshold from the categorization service
        const activeThreshold = deviceCategorizationService.getThresholdForDevice(deviceInfo.name);
    
        // Filter active readings
        const activeReadings = deviceData.filter(reading => {
            const value = reading[deviceName];
            const isActive = typeof value === 'number' && value > activeThreshold;
            return isActive;
        });
    
        const totalEnergy = activeReadings.reduce((sum, reading) => {
            const value = reading[deviceName];
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
    
        // Calculate hours from hourly readings
        const activeHours = activeReadings.length;
    
        // Find peak hour
        const peakHour = activeReadings.reduce((max, reading) => {
            const value = reading[deviceName];
            if (typeof value !== 'number') return max;
            return value > max.value 
                ? { hour: reading.timestamp.getHours(), value } 
                : max;
        }, { hour: 0, value: 0 });

        return {
            totalEnergy,
            activeHours,
            peakHour,
            deviceCategory: deviceCategorizationService.getDeviceCategory2(deviceInfo.name),
            consumptionType: deviceCategorizationService.getConsumptionType(deviceInfo.name),
            insightTemplate: deviceCategorizationService.getInsightTemplate(deviceInfo.name)
        };
    };

    useEffect(() => {
        const fetchDeviceData = async () => {
            if (!participantId) {
                console.log('No participant ID');
                return;
            }
            
            setIsLoading(true);
            try {
                console.log('Fetching data for participant:', participantId);
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

                console.log('All available dates:');
                Object.entries(data).forEach(([deviceKey, device]) => {
                    const deviceData = device as any;
                    if (deviceData?.hourly?.timestamps) {
                        const uniqueDates = new Set(
                            deviceData.hourly.timestamps.map((timestamp: string) => 
                                new Date(timestamp).toISOString().split('T')[0]
                            )
                        );
                        console.log(`${deviceKey}: ${[...uniqueDates].join(', ')}`);
                    }
                });

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
            
            console.log('Previous week range:', {
              start: prevWeekStart.toISOString(),
              end: prevWeekEnd.toISOString()
            });
            
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
        
        fetchComparisons();
      }, [deviceData, currentDate, viewType]);

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

    // Format insight text using template and device data
    const formatInsightText = (insightTemplate: string, insights: DeviceInsights) => {
        let text = insightTemplate;
        
        // Replace placeholders with actual values
        text = text.replace('{duration}', `${insights.activeHours} hours`);
        text = text.replace('{totalEnergy}', insights.totalEnergy.toFixed(3));
        text = text.replace('<number>', `${insights.activeHours}`);
        
        // Handle the today/this week formatting
        text = text.replace('[today]/[this week]', viewType === 'day' ? 'today' : 'this week');
        
        if (insights.peakHour && insights.peakHour.value > 0) {
            const peakHourStr = `${insights.peakHour.hour}:00`;
            text = text.replace('{peakHour}', peakHourStr);
        } else {
            // Remove any reference to peak hour if there isn't one
            text = text.replace(/ with peak usage at {peakHour}\./, '.');
            text = text.replace(/, with peak usage at {peakHour}/, '');
        }
        
        return text;
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
        const deviceIndex = deviceKey.charCodeAt(0) % colorPalette.length;
        return colorPalette[index % colorPalette.length];
    };

    // Get background color for insight cards based on device category
    const getCategoryBgColor = (deviceName: string) => {
        const category = deviceCategorizationService.getDeviceCategory2(deviceName);
        const bgColorMap: Record<string, string> = {
            'Entertainment': 'bg-blue-50',
            'Smart Lighting': 'bg-teal-50',
            'Kitchen': 'bg-red-50',
            'Smart Home': 'bg-purple-50',
            'Heating': 'bg-amber-50',
            'Cooling': 'bg-sky-50',
            'Home Office': 'bg-emerald-50'
        };
        
        return bgColorMap[category] || 'bg-gray-50';
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left">
                    Your Energy Usage ({participantId})
                </h1>
                
                {/* View Controls */}
                <ViewControls
                    viewType={viewType}
                    onViewTypeChange={setViewType}
                    onNavigate={handleNavigate}
                    currentDate={currentDate}
                />

                {/* Date Range Info - To help users understand what data is being shown */}
                <div className="text-sm text-gray-600 mb-4 text-center sm:text-left">
                    Showing data from {formatDateRange(timeRange.start, timeRange.end, viewType)}
                    {data.length === 0 && " (No data available for this period)"}
                </div>

                {/* Dynamic Device Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(deviceData).map(([deviceKey, device]) => (
                        <Card key={deviceKey} className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Activity className="w-5 h-5" />
                                    {device.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    {deviceCategorizationService.getDeviceCategory2(device.name)}
                                </p>
                                <p className="text-lg font-medium">
                                {(() => {
                                    if (!data || data.length === 0) {
                                        return 'No active data for this period';
                                    }
                                    
                                    try {
                                        const insights = getDeviceInsights({
                                            deviceData: data,
                                            deviceKey,
                                            deviceInfo: device,
                                            viewType
                                        });
                                        
                                        return `${insights.activeHours} hours of use`;
                                    } catch (error) {
                                        return 'Data unavailable';
                                    }
                                })()}
                                </p>
                            </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chart Card */}
                <Card className="shadow">
                    <CardContent className="pt-6">
                    {data.length === 0 ? (
                        <div className="flex justify-center items-center h-60 sm:h-80">
                            <p>No data available for this time period</p>
                        </div>
                        ) : (
                        <div className="h-60 sm:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                            {viewType === 'day' ? (
                                // Keep the original LineChart for day view
                                <LineChart
                                data={data}
                                margin={{ 
                                    top: 15, 
                                    right: 10, 
                                    left: 0, 
                                    bottom: 20 
                                }}
                                >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getHours().toString().padStart(2, '0')}:00`;
                                    }}
                                    label={{ 
                                    value: 'Time of Day', 
                                    position: 'insideBottom',
                                    offset: -10,
                                    style: { fontSize: '0.75rem' }
                                    }}
                                    tick={{ fontSize: 10 }}
                                    height={35}
                                />
                                <YAxis 
                                    label={{ 
                                    value: 'Energy (kW)', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    offset: -5,
                                    style: { fontSize: '0.75rem' }
                                    }}
                                    tick={{ fontSize: 10 }}
                                    width={40}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                    const deviceInfo = Object.values(deviceData).find(
                                        device => device.name.toLowerCase().replace(/\s+/g, '_') === name
                                    );
                                    return [`${value.toFixed(3)} kW`, deviceInfo?.name || name];
                                    }}
                                    labelFormatter={(label) => {
                                    const date = new Date(label);
                                    return date.toLocaleDateString('en-AU', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    }}
                                    contentStyle={{ fontSize: '0.875rem' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={30}
                                    wrapperStyle={{ fontSize: '0.75rem' }}
                                />
                                {Object.entries(deviceData).map(([deviceKey, device], index) => {
                                    const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                    const color = getUniqueDeviceColor(deviceKey, index);
                                    
                                    return (
                                    <Line
                                        key={deviceKey}
                                        type="monotone"
                                        dataKey={deviceName}
                                        stroke={color}
                                        name={device.name}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    );
                                })}
                                </LineChart>
                            ) : (
                                // For week view, check if mobile
                                isMobile ? (
                                    // For mobile week view - consider a simpler visualization
                                    <BarChart
                                    data={data}
                                    margin={{ top: 15, right: 10, left: 0, bottom: 20 }}
                                    barGap={4}
                                    >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => {
                                        const date = new Date(value);
                                        // Very short labels on small screens
                                        return date.toLocaleDateString('en-AU', {
                                            weekday: 'narrow',
                                        });
                                        }}
                                        tick={{ fontSize: 12 }}
                                        height={35}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12 }}
                                        width={40}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => {
                                        if (name === "total") {
                                            return [`${value.toFixed(3)} kW`, "Total Energy"];
                                        }
                                        const deviceInfo = Object.values(deviceData).find(
                                            device => device.name.toLowerCase().replace(/\s+/g, '_') === name
                                        );
                                        return [`${value.toFixed(3)} kW`, deviceInfo?.name || name];
                                        }}
                                        labelFormatter={(label) => {
                                        const date = new Date(label);
                                        return date.toLocaleDateString('en-AU', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: 'short'
                                        });
                                        }}
                                    />
                                    <Legend layout="vertical" align="center" />
                                    {/* Show stacked bars for total with color-coded segments */}
                                    {Object.entries(deviceData).map(([deviceKey, device], index) => {
                                        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                        const color = getUniqueDeviceColor(deviceKey, index);
                                        
                                        return (
                                        <Bar
                                            key={deviceKey}
                                            dataKey={deviceName}
                                            name={device.name}
                                            stackId="a"
                                            fill={color}
                                        />
                                        );
                                    })}
                                    </BarChart>
                                ) : (
                                // For week view, use a ComposedChart with grouped bars and total line
                                <ComposedChart
                                data={data}
                                margin={{ 
                                    top: 15, 
                                    right: 10, 
                                    left: 0, 
                                    bottom: 20 
                                }}
                                >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-AU', {
                                        weekday: 'short',
                                        day: 'numeric'
                                    });
                                    }}
                                    label={{ 
                                    value: 'Date', 
                                    position: 'insideBottom',
                                    offset: -10,
                                    style: { fontSize: '0.75rem' }
                                    }}
                                    tick={{ fontSize: 10 }}
                                    height={35}
                                />
                                <YAxis 
                                    label={{ 
                                    value: 'Energy (kW)', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    offset: -5,
                                    style: { fontSize: '0.75rem' }
                                    }}
                                    tick={{ fontSize: 10 }}
                                    width={40}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                    if (name === "total") {
                                        return [`${value.toFixed(3)} kW`, "Total Energy"];
                                    }
                                    const deviceInfo = Object.values(deviceData).find(
                                        device => device.name.toLowerCase().replace(/\s+/g, '_') === name
                                    );
                                    return [`${value.toFixed(3)} kW`, deviceInfo?.name || name];
                                    }}
                                    labelFormatter={(label) => {
                                    const date = new Date(label);
                                    return date.toLocaleDateString('en-AU', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'short'
                                    });
                                    }}
                                    contentStyle={{ fontSize: '0.875rem' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={30}
                                    wrapperStyle={{ fontSize: '0.75rem' }}
                                />
                                {/* Add bars for each device */}
                                {Object.entries(deviceData).map(([deviceKey, device], index) => {
                                    const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                    const color = getUniqueDeviceColor(deviceKey, index);
                                    
                                    return (
                                    <Bar
                                        key={deviceKey}
                                        dataKey={deviceName}
                                        name={device.name}
                                        fill={color}
                                        // Larger bars on mobile for easier tapping
                                        barSize={window.innerWidth < 768 ? 30 : 20}
                                    />
                                    );
                                })}
                                
                                {/* Add line for total energy consumption */}
                                <Line
                                    type="linear"
                                    dataKey={(data) => {
                                    // Calculate total for each day from all devices
                                    let total = 0;
                                    Object.values(deviceData).forEach(device => {
                                        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                        if (typeof data[deviceName] === 'number') {
                                        total += data[deviceName];
                                        }
                                    });
                                    return total;
                                    }}
                                    name="total"
                                    stroke="#696969"
                                    strokeWidth={1.5}
                                    dot={{ fill: '#696969', r: 3 }}
                                    connectNulls={false}
                                />
                                </ComposedChart>
                            )
                            )}
                            </ResponsiveContainer>
                        </div>
                        )}
                        {isMobile && viewType === 'week' && (
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-medium text-blue-600 mb-2 p-2 bg-blue-50 rounded flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                                </svg>
                                Show data in table format
                                </summary>
                                <div className="overflow-x-auto mt-3 border border-gray-200 rounded-lg">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left p-3 border border-gray-300 font-medium">Day</th>
                                        {Object.values(deviceData).map((device, index) => (
                                        <th key={device.name} className="text-left p-3 border border-gray-300 font-medium" 
                                            style={{ color: getUniqueDeviceColor(device.name, index) }}>
                                            {device.name}
                                        </th>
                                        ))}
                                        <th className="text-left p-3 border border-gray-300 font-medium bg-gray-100">Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {data.map((reading, index) => (
                                        <tr key={reading.timestamp.toString()} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-3 border border-gray-300 font-medium">
                                            {new Date(reading.timestamp).toLocaleDateString('en-AU', {
                                            weekday: 'short',
                                            day: 'numeric'
                                            })}
                                        </td>
                                        {Object.values(deviceData).map((device, index) => {
                                            const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                            const color = getUniqueDeviceColor(device.name, index);
                                            return (
                                            <td key={device.name} className="p-3 border border-gray-300" style={{ borderLeftColor: color, borderLeftWidth: '2px' }}>
                                                {typeof reading[deviceName] === 'number' 
                                                ? `${reading[deviceName].toFixed(2)} kW` 
                                                : '-'}
                                            </td>
                                            );
                                        })}
                                        <td className="p-3 border border-gray-300 font-medium bg-gray-50">
                                            {(() => {
                                            let total = 0;
                                            Object.values(deviceData).forEach(device => {
                                                const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                                if (typeof reading[deviceName] === 'number') {
                                                total += reading[deviceName];
                                                }
                                            });
                                            return `${total.toFixed(2)} kW`;
                                            })()}
                                        </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    <tfoot>
                                    <tr className="bg-gray-100">
                                        <td className="p-3 border border-gray-300 font-medium">Weekly Avg</td>
                                        {Object.values(deviceData).map(device => {
                                        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                        // Calculate average for this device
                                        const avg = data.reduce((sum, reading) => {
                                            return sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0);
                                        }, 0) / (data.length || 1);
                                        
                                        return (
                                            <td key={device.name} className="p-3 border border-gray-300 font-medium">
                                            {avg.toFixed(2)} kW
                                            </td>
                                        );
                                        })}
                                        <td className="p-3 border border-gray-300 font-medium">
                                        {(() => {
                                            // Calculate total average across all days
                                            let totalSum = 0;
                                            data.forEach(reading => {
                                            let dayTotal = 0;
                                            Object.values(deviceData).forEach(device => {
                                                const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                                if (typeof reading[deviceName] === 'number') {
                                                dayTotal += reading[deviceName];
                                                }
                                            });
                                            totalSum += dayTotal;
                                            });
                                            const avg = totalSum / (data.length || 1);
                                            return `${avg.toFixed(2)} kW`;
                                        })()}
                                        </td>
                                    </tr>
                                    </tfoot>
                                </table>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                This table shows your daily energy consumption in kilowatts (kW) for each device.
                                </p>
                            </details>
                            )}
                    </CardContent>
                </Card>

                {/* Cost Insights Section */}
                <Card className="shadow">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <PoundSterlingIcon className="w-5 h-5" />
                        Cost Insights
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-4 mb-6">
                        {Object.entries(deviceData).map(([deviceKey, device]) => {
                            // Skip if no data for this time period
                            if (data.length === 0) {
                                return (
                                    <div key={deviceKey} className="p-4 bg-gray-50 rounded-lg">
                                        <h3 className="font-medium text-sm sm:text-base">{device.name}</h3>
                                        <p className="text-sm">No usage data available for this time period</p>
                                    </div>
                                );
                            }

                            try {
                                const insights = getDeviceInsights({
                                    deviceData: data,
                                    deviceKey,
                                    deviceInfo: device,
                                    viewType
                                });

                                // Use category-based background colors
                                const bgColor = getCategoryBgColor(device.name);
                                const costAmount = CostEstimationService.estimateCost(insights.totalEnergy);
                
                                return (
                                    <div
                                        key={deviceKey}
                                        className={`p-4 ${bgColor} rounded-lg`}
                                    >
                                        <h3 className="font-medium text-sm sm:text-base">{device.name}</h3>
                                        <div className="mt-2">
                                            <div className="flex items-baseline">
                                                <span className="text-xl font-medium">£{costAmount.toFixed(2)}</span>
                                                <span className="text-sm text-gray-600 ml-1">
                                                    {viewType === 'day' ? 'today' : 'this week'}
                                                </span>
                                            </div>
                                            
                                            {/* For week view only - show comparison with previous week */}
                                            {viewType === 'week' && previousWeekData.length > 0 && (
                                                (() => {
                                                    const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                                    const prevWeekDevice = previousWeekData.reduce((sum, reading) => 
                                                        sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0), 0);
                                                    
                                                    if (prevWeekDevice > 0) {
                                                        const savings = CostEstimationService.calculateSavings(prevWeekDevice, insights.totalEnergy);
                                                        return (
                                                            <div className="mt-1">
                                                                <span className={savings.isSaving ? "text-green-600" : "text-red-600"}>
                                                                    {savings.isSaving ? (
                                                                        <>
                                                                            <span className="inline-flex items-center">
                                                                                <ArrowDownIcon className="w-3 h-3 mr-1" /> 
                                                                                Saved £{savings.costDifference.toFixed(2)} ({savings.percentChange.toFixed(1)}%)
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className="inline-flex items-center">
                                                                                <ArrowUpIcon className="w-3 h-3 mr-1" /> 
                                                                                Spent £{savings.costDifference.toFixed(2)} more ({savings.percentChange.toFixed(1)}%)
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </span>
                                                                <p className="text-xs text-gray-500 mt-1">Compared to last week</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()
                                            )}

                                            <p className="text-xs text-gray-500 mt-2">
                                                Category: {insights.deviceCategory}
                                            </p>
                                        </div>
                                    </div>
                                );
                            } catch (error) {
                                return (
                                    <div key={deviceKey} className={`p-4 bg-gray-50 rounded-lg`}>
                                        <h3 className="font-medium text-sm sm:text-base">{device.name}</h3>
                                        <p className="text-sm">Unable to calculate cost for this period</p>
                                    </div>
                                );
                            }
                        })}
                    </div>
                    <div className="border-t pt-6 pb-2 mt-6">
                        <p className="text-sm text-muted-foreground max-w-prose mx-auto sm:mx-0">
                        These are estimates of the maximum amount you'd pay based on the standard UK electricity price cap. Source: Ofgem
                        </p>
                    </div>
                    </CardContent>
                </Card>

                {/* Social Comparison Section */}
                <Card className="shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="w-5 h-5" />
                    Energy Usage Comparisons
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {comparisons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No comparison data available for this time period.
                    </p>
                    ) : (
                    <div className="space-y-6">
                        {comparisons.map((comparison) => (
                        <div key={comparison.deviceName} className="p-4 bg-blue-50 rounded-lg">
                            <div className="mb-3 flex items-center gap-2">
                            <DeviceIcon deviceName={comparison.deviceName} className="w-5 h-5" />
                                <h3 className="font-medium">{comparison.deviceName}</h3>
                            </div>
                            <DeviceComparisonChart
                            deviceName={comparison.deviceName}
                            yourUsage={comparison.yourUsage}
                            averageUsage={comparison.averageUsage}
                            percentDifference={comparison.percentDifference}
                            isLowerThanAverage={comparison.isLowerThanAverage}
                            viewType={viewType}
                            />
                        </div>
                        ))}
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
        </div>
    );
}