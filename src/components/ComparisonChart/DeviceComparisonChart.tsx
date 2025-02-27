import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine,
  Label
} from 'recharts';

// Define the props interface for the comparison chart
interface DeviceComparisonChartProps {
  deviceName: string;
  yourUsage: number;
  averageUsage: number;
  percentDifference: number;
  isLowerThanAverage: boolean;
}

const DeviceComparisonChart: React.FC<DeviceComparisonChartProps> = ({
  deviceName,
  yourUsage,
  averageUsage,
  percentDifference,
  isLowerThanAverage
}) => {
  // Format the data for the horizontal bar chart
  const data = [
    {
      name: 'Usage',
      'Your Usage': yourUsage,
      'Average Usage': averageUsage
    }
  ];

  // Choose colors that make sense for the comparison
  const yourColor = isLowerThanAverage ? '#10b981' : '#ef4444'; // Green if lower, red if higher
  const averageColor = '#3b82f6'; // Blue for average

  return (
    <div className="mt-3 bg-white p-3 rounded-md">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>You: {yourUsage.toFixed(3)} kWh</span>
        <span>Others: {averageUsage.toFixed(3)} kWh</span>
      </div>
      
      <ResponsiveContainer width="100%" height={90}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={false} 
            width={0}
          />
          <Tooltip 
            formatter={(value) => [`${Number(value).toFixed(3)} kWh`, undefined]}
            separator=": "
          />
          <Legend 
            wrapperStyle={{ fontSize: '0.75rem' }} 
            verticalAlign="top"
            height={36}
          />
          <Bar 
            dataKey="Your Usage" 
            fill={yourColor} 
            barSize={20}
            name="Your Usage"
          />
          <Bar 
            dataKey="Average Usage" 
            fill={averageColor} 
            barSize={20}
            name="Average Usage"
          />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="text-xs text-center mt-1 text-gray-600">
        {isLowerThanAverage 
          ? `You used ${Math.abs(percentDifference).toFixed(0)}% less than average` 
          : `You used ${Math.abs(percentDifference).toFixed(0)}% more than average`}
      </div>
    </div>
  );
};

export default DeviceComparisonChart;