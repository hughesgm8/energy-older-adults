import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Tv, Coffee, Lamp } from 'lucide-react';

const MultiDeviceDashboard = () => {
  const [data, setData] = useState<{ timestamp: Date; tv: number; kettle: number; lamp: number }[]>([]);
  const [lampData, setLampData] = useState<{ energy: number }[]>([]);

  useEffect(() => {
    const fetchLampData = async () => {
      try {
        console.log("Fetching lamp data from /api/lamp-data..."); // Log Fetch Request
        const response = await fetch('/api/lamp-data');
        const result = await response.json();
        console.log("Data fetched from Flask server:", result);
        setLampData(result.hourly); // Assuming you want to use hourly data
      } catch (error) {
        console.error('Error fetching lamp data:', error);
      }
    };

    fetchLampData();
  }, []);

  useEffect(() => {
    const generateSampleData = () => {
      const now = new Date();
      const days = 7;
      const hoursPerDay = 24;
      const data = [];

      for (let day = 0; day < days; day++) {
        for (let hour = 0; hour < hoursPerDay; hour++) {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - (days - day));
          timestamp.setHours(hour);

          // TV: Higher usage in evenings
          const isEveningTV = hour >= 18 && hour <= 22;
          const tvEnergy = isEveningTV ? 0.15 + Math.random() * 0.05 : 0.002;

          // Kettle: Spikes in morning and afternoon
          const isMorningKettle = hour >= 6 && hour <= 9;
          const isAfternoonKettle = hour >= 14 && hour <= 16;
          const kettleEnergy = (isMorningKettle || isAfternoonKettle) ?
            (Math.random() > 0.7 ? 2.0 + Math.random() * 0.5 : 0.001) : 0.001;

          data.push({
            timestamp,
            tv: tvEnergy,
            kettle: kettleEnergy,
            lamp: 0 // Placeholder for lamp data
          });
        }
      }
      return data;
    };

    const sampleData = generateSampleData();
    setData(sampleData);
  }, []);

  useEffect(() => {
    if (lampData.length > 0) {
      const updatedData = data.map((entry, index) => {
        if (index < lampData.length) {
          return { ...entry, lamp: lampData[index].energy };
        }
        return entry;
      });
      console.log("Updated data with lamp data:", updatedData); // Log Updated Data with Lamp Data
      setData(updatedData);
    }
  }, [lampData]);

  const getDeviceInsights = (deviceData: { timestamp: Date; tv: number; kettle: number; lamp: number }[], type: 'tv' | 'kettle' | 'lamp') => {
    const activeThresholds = {
      tv: 0.01,
      kettle: 0.1,
      lamp: 0.005
    };

    const activeReadings = deviceData.filter(d => d[type] > activeThresholds[type]);
    const totalEnergy = activeReadings.reduce((sum, d) => sum + d[type], 0);
    const activeHours = activeReadings.length;

    return {
      totalEnergy,
      activeHours,
      peakHour: activeReadings.reduce((max, d) =>
        d[type] > max.value ? { hour: new Date(d.timestamp).getHours(), value: d[type] } : max, { hour: 0, value: 0 }
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-6 h-6" /> Kettle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Regular use in mornings</p>
              <p className="text-lg font-medium">
                Used {Math.floor(getDeviceInsights(data, 'kettle').activeHours)} times today
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lamp className="w-6 h-6" /> Reading Lamp
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
                  dataKey="tv"
                  stroke="#2563eb"
                  name="TV"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="kettle"
                  stroke="#dc2626"
                  name="Kettle"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lamp"
                  stroke="#2dd4bf"
                  name="Lamp"
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium">TV Usage</h3>
              <p>Your TV is most active between 6 PM and 10 PM</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium">Kettle Activity</h3>
              <p>You typically use your kettle 3-4 times each morning</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg">
              <h3 className="font-medium">Reading Light</h3>
              <p>Your evening reading sessions usually start around 5 PM</p>
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