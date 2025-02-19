import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, ChevronLeft, ChevronRight, Tv, Gamepad, Lamp } from 'lucide-react';
import { DeviceDataResponse, DeviceInfo, DeviceReading, DeviceInsightsParams, DeviceInsights } from './types/device';
import { TimeRange, ViewControlsProps, ViewType } from './types/views';
import { ViewControls } from './components/ViewControls/ViewControls';

interface EnergyThresholds {
  TV: number;
  LAMP: number;
  SWITCH: number;
  ACTIVE: number; // general threshold as fallback
  [key: string]: number; // This allows for dynamic string indexing
}

const ENERGY_THRESHOLDS: EnergyThresholds = {
  TV: 0.06,
  LAMP: 0.015,
  SWITCH: 0.02,
  ACTIVE: 0.02 // General threshold as fallback
};

const MultiDeviceDashboard = () => {
  const [deviceData, setDeviceData] = useState<DeviceDataResponse>({});
  const [data, setData] = useState<DeviceReading[]>([]);
  const [viewType, setViewType] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const getTimeRange = (date: Date, type: ViewType): TimeRange => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    if (type === 'week') {
      end.setDate(end.getDate() + 6);
    }
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = viewType === 'week' ? 7 : 1;
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - days);
    } else {
      newDate.setDate(newDate.getDate() + days);
    }
    
    setCurrentDate(newDate);
  };

  useEffect(() => {
    const timeRange = getTimeRange(currentDate, viewType);
    const fetchDeviceData = async () => {
      try {
        console.log(`Fetching ${viewType} data for ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`);
        const response = await fetch(`/api/device-data?start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}&view=${viewType}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const text = await response.text();
        console.log("Raw response:", text); // Debug log
        
        try {
          const result = JSON.parse(text);
          console.log("Parsed data:", result);
          setDeviceData(result);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Received text:", text);
          if (parseError instanceof Error) {
            throw new Error(`Failed to parse JSON: ${parseError.message}`);
          } else {
            throw new Error('Failed to parse JSON');
          }
        }
      } catch (error) {
        console.error('Error fetching device data:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        } else {
          console.error('Error details:', error);
        }
      }
    };

    fetchDeviceData();
  }, [currentDate, viewType]);

  useEffect(() => {
    if (Object.keys(deviceData).length > 0) {
      if (!deviceData.device1?.hourly?.data) {
        console.error('Invalid device data structure');
        return;
      }
  
      let updatedData: DeviceReading[] = [];
      
      if (viewType === 'week') {
        // For week view, create 7 days worth of data
        for (let day = 0; day < 7; day++) {
          const dayDate = new Date(currentDate);
          dayDate.setDate(dayDate.getDate() + day);
          
          const dayData = deviceData.device1.hourly.data.map((_: any, index: number) => {
            const timestamp = new Date(dayDate);
            timestamp.setHours(index, 0, 0, 0);
            
            const readings: DeviceReading = { timestamp };
            Object.keys(deviceData).forEach(deviceKey => {
              const deviceName = deviceData[deviceKey].device_info.name.toLowerCase().replace(/\s+/g, '_');
              const value = deviceData[deviceKey].hourly.data[index] || 0;
              readings[deviceName] = value;
            });
            
            return readings;
          });
          
          updatedData = [...updatedData, ...dayData];
        }
      } else {
        // Original day view logic
        updatedData = deviceData.device1.hourly.data.map((_: any, index: number) => {
          const timestamp = new Date(currentDate);
          timestamp.setHours(index, 0, 0, 0);
          
          const readings: DeviceReading = { timestamp };
          Object.keys(deviceData).forEach(deviceKey => {
            const deviceName = deviceData[deviceKey].device_info.name.toLowerCase().replace(/\s+/g, '_');
            const value = deviceData[deviceKey].hourly.data[index] || 0;
            readings[deviceName] = value;
          });
          
          return readings;
        });
      }
  
      console.log(`${viewType} view data:`, {
        dataPoints: updatedData.length,
        sampleData: updatedData.slice(0, 3)
      });
      
      setData(updatedData);
    }
  }, [deviceData, currentDate, viewType]);

  // Updated getDeviceInsights to work with dynamic device names
  const getDeviceInsights = ({ deviceData, deviceKey, deviceInfo }: DeviceInsightsParams): DeviceInsights => {
    console.log('getDeviceInsights parameters:', {
      hasDeviceData: Boolean(deviceData?.length),
      deviceDataLength: deviceData?.length,
      deviceKey,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : 'missing'
    });
    
    if (!deviceData?.length || !deviceKey || !deviceInfo) {
      throw new Error(`Missing required parameters for device insights:
        deviceData: ${Boolean(deviceData?.length)},
        deviceKey: ${Boolean(deviceKey)},
        deviceInfo: ${Boolean(deviceInfo)}`
      );
    }

    const deviceName = deviceInfo.device_info.name.toLowerCase().replace(/\s+/g, '_');
    const activeThreshold = deviceName.includes('tv') 
    ? ENERGY_THRESHOLDS.TV
    : deviceName.includes('lamp')
    ? ENERGY_THRESHOLDS.LAMP
    : ENERGY_THRESHOLDS.SWITCH;
    
    const activeReadings = deviceData.filter(reading => {
      const value = reading[deviceName];
      return typeof value === 'number' && value > activeThreshold;
    });
  
    const totalEnergy = activeReadings.reduce((sum, reading) => {
      const value = reading[deviceName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  
    let activeHours = 0;

    if (viewType === 'week') {
      // Group readings by day and sum them up
      const dailyHours = activeReadings.reduce((acc, reading) => {
        const day = reading.timestamp.toDateString();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  
      // Sum up all daily hours
      activeHours = Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);
      
      console.log(`Week view for ${deviceName}:`, {
        dailyBreakdown: dailyHours,
        totalHours: activeHours
      });
    } else {
      // For day view, just count the active readings
      activeHours = activeReadings.length;
    }
  
    const result = {
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
  
    console.log(`Final insights for ${deviceName} (${viewType}):`, result);
    return result;
  };

  // Device cards are now generated dynamically
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-6">Your Energy Usage</h1>
    
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
                {device.device_info.name}
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
                      console.error(`Error getting insights for ${device.device_info.name}:`, error);
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
                      device => device.device_info.name.toLowerCase().replace(/\s+/g, '_') === name
                    );
                    return [`${value.toFixed(3)} kW`, deviceInfo?.device_info.name || name];
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
                  const deviceName = device.device_info.name.toLowerCase().replace(/\s+/g, '_');
                  const colors = ['#2dd4bf', '#dc2626', '#2563eb'];
                  return (
                    <Line
                      key={deviceKey}
                      type="monotone"
                      dataKey={deviceName}
                      stroke={colors[index % colors.length]}
                      name={deviceName}
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
                <h3 className="font-medium">{device.device_info.name} Usage</h3>
                <p>Activity patterns will be analyzed based on usage data</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <MultiDeviceDashboard />
    </div>
  );
}

export default App;