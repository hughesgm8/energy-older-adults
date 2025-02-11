import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Tv, Gamepad, Lamp } from 'lucide-react';

const MultiDeviceDashboard = () => {
  const [data, setData] = useState<{ timestamp: Date; lamp: number; nintendo: number; tv: number }[]>([]);
  const [deviceData, setDeviceData] = useState<any>({});

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        console.log("Fetching device data from /api/device-data..."); // Log Fetch Request
        const response = await fetch('/api/device-data');
        const text = await response.text(); // Get raw text response
        console.log("Raw text response from Flask server:", text); // Log Raw Text Response
        const result = JSON.parse(text); // Parse JSON response
        console.log("Data fetched from Flask server:", result); // Log Fetched Data
        setDeviceData(result);
      } catch (error) {
        console.error('Error fetching device data:', error);
      }
    };

    fetchDeviceData();
  }, []);

  useEffect(() => {
    if (Object.keys(deviceData).length > 0) {
      const updatedData = deviceData.device1.hourly.data.map((_: any, index: number) => {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - (deviceData.device1.hourly.data.length - index));
        return {
          timestamp,
          lamp: (deviceData.device1.hourly.data[index] || 0) / 1000, // Convert to kWh
          nintendo: (deviceData.device2.hourly.data[index] || 0) / 1000,
          tv: (deviceData.device3.hourly.data[index] || 0) / 1000,
        };
      });
      console.log("Updated data with device data:", updatedData); // Log Updated Data with Device Data
      setData(updatedData);
    }
  }, [deviceData]);

  const getDeviceInsights = (deviceData: { timestamp: Date; lamp: number; nintendo: number; tv: number }[], type: 'lamp' | 'nintendo' | 'tv') => {
    const activeThresholds = {
      lamp: 0.005,
      nintendo: 0.1,
      tv: 0.01
    };

    const activeReadings = deviceData.filter(d => d[type as 'lamp' | 'nintendo' | 'tv'] > activeThresholds[type]);
    const totalEnergy = activeReadings.reduce((sum, d) => sum + d[type], 0);
    const activeHours = activeReadings.length;

    return {
      totalEnergy,
      activeHours,
      peakHour: activeReadings.reduce((max, d) =>
        d[type] > (max?.value || 0) ? { hour: new Date(d.timestamp).getHours(), value: d[type] } : max, { hour: 0, value: 0 }
      )
    };
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-6">Your Energy Usage Dashboard</h1>

      {/* Device Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lamp className="w-6 h-6" /> Lamp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Evening reading patterns</p>
              <p className="text-lg font-medium">
                {getDeviceInsights(data, 'lamp').activeHours} hours of use
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad className="w-6 h-6" /> Nintendo Switch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Regular gaming sessions</p>
              <p className="text-lg font-medium">
                {getDeviceInsights(data, 'nintendo').activeHours} hours of gaming
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="w-6 h-6" /> Television
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Most active in the evening</p>
              <p className="text-lg font-medium">
                {getDeviceInsights(data, 'tv').activeHours} hours of viewing time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Energy Usage Patterns</CardTitle>
          <p className="text-sm text-gray-500">Last 7 days of activity</p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.toLocaleDateString()} ${date.getHours()}:00`;
                  }}
                  label={{
                    value: 'Date and Time',
                    position: 'bottom',
                    offset: 0
                  }}
                />
                <YAxis
                  label={{
                    value: 'Energy Usage (kWh)',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                  }}
                  formatter={(value, name) => [
                    `${typeof value === 'number' ? value.toFixed(3) : value} kWh`,
                    typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="lamp"
                  stroke="#2dd4bf"
                  name="Lamp"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="nintendo"
                  stroke="#dc2626"
                  name="Nintendo Switch"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="tv"
                  stroke="#2563eb"
                  name="TV"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Daily Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 rounded-lg">
              <h3 className="font-medium">Lamp Usage</h3>
              <p>Your lamp is most active in the evening</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium">Nintendo Switch Activity</h3>
              <p>You typically play games for 2-3 hours each day</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium">TV Usage</h3>
              <p>Your TV is most active between 6 PM and 10 PM</p>
            </div>
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