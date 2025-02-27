import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';

// Define the props interface for the comparison chart
interface DeviceComparisonChartProps {
  deviceName: string;
  yourUsage: number;
  averageUsage: number;
  percentDifference: number;
  isLowerThanAverage: boolean;
  viewType: 'day' | 'week';
}

const DeviceComparisonChart: React.FC<DeviceComparisonChartProps> = ({
  deviceName,
  yourUsage,
  averageUsage,
  percentDifference,
  isLowerThanAverage,
  viewType
}) => {
  // Format the data for the horizontal bar chart - key structure is critical for proper rendering
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

  // Generate comparison text
  const comparisonText = `You used your ${deviceName} ${Math.abs(percentDifference).toFixed(0)}% ${isLowerThanAverage ? 'less' : 'more'} than other participants ${viewType === 'day' ? 'today' : 'this week'}.`;

  return (
    <div className="mt-3">
      {/* Simplified heading with integrated percentage comparison */}
      <h3 className="font-medium text-sm sm:text-base mb-2">
        {comparisonText}
      </h3>
      
      <div className="flex justify-between text-sm text-gray-700 mb-1 font-medium">
        <span>You: {yourUsage.toFixed(3)} kWh</span>
        <span>Others: {averageUsage.toFixed(3)} kWh</span>
      </div>
      
      <ResponsiveContainer width="100%" height={110}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          barGap={8} // Space between bars
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={false}
            width={1}
          />
          <Tooltip 
            formatter={(value) => [`${Number(value).toFixed(3)} kWh`, undefined]}
            separator=": "
            contentStyle={{ fontSize: '14px' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '8px' }} 
            iconSize={14}
            verticalAlign="bottom"
          />
          <Bar 
            dataKey="Your Usage" 
            name="Your Usage"
            fill={yourColor} 
            barSize={30} // Thicker bars for better visibility
          />
          <Bar 
            dataKey="Average Usage" 
            name="Others' Usage"
            fill={averageColor} 
            barSize={30} // Thicker bars for better visibility
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DeviceComparisonChart;