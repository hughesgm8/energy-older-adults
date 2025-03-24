import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ComposedChart, Bar 
} from 'recharts';
import { DeviceDataResponse, DeviceReading } from '../../../types/device';
import { ViewType } from '../../../types/views';

interface EnergyChartProps {
  data: DeviceReading[];
  deviceData: DeviceDataResponse;
  viewType: ViewType;
  isMobile: boolean;
  getUniqueDeviceColor: (deviceKey: string, index: number) => string;
}

export const EnergyChart: React.FC<EnergyChartProps> = ({
  data,
  deviceData,
  viewType,
  isMobile,
  getUniqueDeviceColor
}) => {
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 sm:h-80">
        <p>No data available for this time period</p>
      </div>
    );
  }

  return (
    <div className="h-60 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        {viewType === 'day' ? (
          // Day view - Line chart
          <LineChart
            data={data}
            margin={{ 
              top: 15, 
              right: 10, 
              left: 15, 
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
              width={45}
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
          // Week view
          <ComposedChart
            data={data}
            margin={{ 
              top: 15, 
              right: 10, 
              left: 15, 
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
              width={45}
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
        )}
      </ResponsiveContainer>
    </div>
  );
};