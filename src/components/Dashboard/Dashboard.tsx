import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, ChevronLeft, ChevronRight, Tv, Gamepad, Lamp } from 'lucide-react';
import { DeviceDataResponse, DeviceInfo, DeviceReading, DeviceInsightsParams, DeviceInsights } from '../../types/device';
import { TimeRange, ViewControlsProps, ViewType } from '../../types/views';
import { ViewControls } from '../ViewControls/ViewControls';
import { useParams } from 'react-router-dom';

interface EnergyThresholds {
  TV: number;
  LAMP: number;
  SWITCH: number;
  ACTIVE: number; // general threshold as fallback
  [key: string]: number; // This allows for dynamic string indexing
}

const ENERGY_THRESHOLDS: EnergyThresholds = {
    TV: 0.01,        // Lowered from 0.06
    LAMP: 0.003,     // Lowered from 0.015
    SWITCH: 0.001,   // Lowered from 0.02
    ACTIVE: 0.001    // Lowered from 0.02
};

export function Dashboard() {
    const { participantId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deviceData, setDeviceData] = useState<DeviceDataResponse>({});
    const [data, setData] = useState<DeviceReading[]>([]);
    const [viewType, setViewType] = useState<ViewType>('day');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const getDataBoundaries = (deviceData: DeviceDataResponse) => {
        if (!deviceData || Object.keys(deviceData).length === 0) return null;
        
        const firstDevice = Object.values(deviceData)[0];
        const timestamps = firstDevice.hourly.timestamps;
        
        return {
            start: new Date(timestamps[0]),
            end: new Date(timestamps[timestamps.length - 1])
        };
    };

    useEffect(() => {
        console.log('State changed:', {
            isLoading,
            hasError: !!error,
            deviceDataCount: Object.keys(deviceData).length,
            dataCount: data.length,
            viewType,
            currentDate: currentDate.toISOString()
        });
    }, [isLoading, error, deviceData, data, viewType, currentDate]);

    const getTimeRange = (date: Date, type: ViewType): TimeRange => {
        const boundaries = getDataBoundaries(deviceData);
        if (!boundaries) {
            return { start: date, end: date };
        }

        let end = new Date(date);
        end.setHours(23, 59, 59, 999);
        
        // Don't allow end date beyond data boundaries
        if (end > boundaries.end) {
            end = new Date(boundaries.end);
        }
        
        let start = new Date(end);
        if (type === 'week') {
            // Find the previous Sunday
            const day = start.getDay();
            start.setDate(start.getDate() - day);
        }
        start.setHours(0, 0, 0, 0);
        
        // Don't allow start date before data boundaries
        if (start < boundaries.start) {
            start = new Date(boundaries.start);
        }
        
        return { start, end };
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        const boundaries = getDataBoundaries(deviceData);
        if (!boundaries) return;
    
        const newDate = new Date(currentDate);
        const days = viewType === 'week' ? 7 : 1;
        
        if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - days);
            // Don't go before first available date
            if (newDate < boundaries.start) {
                newDate.setTime(boundaries.start.getTime());
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            // Don't go beyond last available date
            if (newDate > boundaries.end) {
                newDate.setTime(boundaries.end.getTime());
            }
        }
        
        setCurrentDate(newDate);
    };

    const getDeviceInsights = ({ deviceData, deviceKey, deviceInfo }: DeviceInsightsParams): DeviceInsights => {
        if (!deviceData?.length || !deviceKey || !deviceInfo) {
            throw new Error('Missing required parameters for device insights');
        }
    
        const deviceName = deviceInfo.name.toLowerCase().replace(/\s+/g, '_');
        const activeThreshold = deviceName.includes('tv') 
            ? ENERGY_THRESHOLDS.TV
            : deviceName.includes('lamp')
            ? ENERGY_THRESHOLDS.LAMP
            : ENERGY_THRESHOLDS.SWITCH;
    
        // Add debug logging
        console.log(`Processing insights for ${deviceName}:`, {
            threshold: activeThreshold,
            dataPoints: deviceData.length,
            sampleValue: deviceData[0]?.[deviceName]
        });
    
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
    
        // Debug logging
        console.log(`Device ${deviceName} insights:`, {
            dataPoints: deviceData.length,
            activeReadings: activeReadings.length,
            totalEnergy,
            activeHours,
            sampleActiveReading: activeReadings[0]
        });
    
        return {
            totalEnergy,
            activeHours,
            peakHour: activeReadings.reduce((max, reading) => {
                const value = reading[deviceName];
                if (typeof value !== 'number') return max;
                return value > max.value 
                    ? { hour: reading.timestamp.getHours(), value } 
                    : max;
            }, { hour: 0, value: 0 })
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
                const response = await fetch(`http://localhost:5000/api/device-data/${participantId}`, {
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
    
                const rawData = await response.text();
                console.log('Raw API response:', rawData);
                
                const data = JSON.parse(rawData);
                console.log('Parsed device data:', data);
                setDeviceData(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Fetch error:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch data');
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
    
            console.log('Processed data:', {
                timeRange,
                boundaries,
                readings: updatedData.length,
                sample: updatedData.slice(0, 3)
            });
            
            setData(updatedData);
        } catch (error) {
            console.error('Error processing data:', error);
        }
    }, [deviceData, currentDate, viewType]);

    if (isLoading) {
        console.log('Rendering loading state');
        return <div className="p-4">Loading dashboard data...</div>;
    }
    
    if (error) {
        console.log('Rendering error state:', error);
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }
    
    if (!deviceData || Object.keys(deviceData).length === 0) {
        console.log('Rendering no data state:', { deviceData });
        return <div className="p-4">No device data available for this participant.</div>;
    }
    
    console.log('Rendering dashboard with data:', {
        deviceCount: Object.keys(deviceData).length,
        firstDevice: Object.values(deviceData)[0]
    });

    return (
        <div className="space-y-6 p-4">
            <h1 className="text-2xl font-bold mb-6">Your Energy Usage ({participantId})</h1>
                {/* View Controls */}<ViewControls
                    viewType={viewType}
                    onViewTypeChange={setViewType}
                    onNavigate={handleNavigate}
                    currentDate={currentDate}
                />

                {/* Dynamic Device Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(deviceData).map(([deviceKey, device]) => (
                        <Card key={deviceKey}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-6 h-6" />
                                    {device.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                            <div className="space-y-2">
                                <p>Device activity</p>
                                <p className="text-lg font-medium">
                                {(() => {
                                    if (!data || data.length === 0) {
                                    return 'Loading...';
                                    }
                                    
                                    try {
                                        const insights = getDeviceInsights({
                                            deviceData: data,
                                            deviceKey,
                                            deviceInfo: device,
                                            viewType // Add this
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
                <Card>
                    <CardContent className="pt-6">
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 15, right: 30, left: 30, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                if (viewType === 'week') {
                                return date.toLocaleDateString('en-AU', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit'
                                }).replace(/\//g, '/');
                                }
                                return `${date.getHours().toString().padStart(2, '0')}:00`;
                            }}
                            label={{ 
                                value: viewType === 'week' ? 'Date' : 'Time of Day', 
                                position: 'insideBottom',
                                offset: -10
                            }}
                            />
                            <YAxis 
                            label={{ 
                                value: 'Energy Usage (kW)', 
                                angle: -90, 
                                position: 'insideLeft',
                                offset: -15
                            }}
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
                                if (viewType === 'week') {
                                return date.toLocaleDateString('en-AU', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                }
                                return `${date.getHours().toString().padStart(2, '0')}:00`;
                            }}
                            />
                            <Legend 
                            verticalAlign="top" 
                            height={36}
                            />
                            {Object.entries(deviceData).map(([deviceKey, device], index) => {
                                const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                                const colors = ['#2dd4bf', '#dc2626', '#2563eb'];
                                return (
                                    <Line
                                        key={deviceKey}
                                        type="monotone"
                                        dataKey={deviceName} // This should match the property name in the reading object
                                        stroke={colors[index % colors.length]}
                                        name={device.name} // Use original name for display
                                        dot={false}
                                    />
                                );
                            })}
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </CardContent>
                </Card>

                {/* Dynamic Insights Section */}
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-6 h-6" />
                        Daily Insights
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-4">
                        {Object.entries(deviceData).map(([deviceKey, device], index) => (
                            <div
                                key={deviceKey}
                                className={`p-4 ${
                                    index === 0 ? 'bg-teal-50' : index === 1 ? 'bg-red-50' : 'bg-blue-50'
                                } rounded-lg`}
                            >
                                <h3 className="font-medium">{device.name} Usage</h3>
                                <p>Activity patterns will be analyzed based on usage data</p>
                            </div>
                        ))}
                    </div>
                    </CardContent>
                </Card>
        </div>
    );
}