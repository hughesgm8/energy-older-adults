import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ComposedChart, Bar, BarChart,
  Cell
} from 'recharts';
import { DeviceDataResponse, DeviceReading } from '../../../types/device';
import { ViewType } from '../../../types/views';
import { deviceCategorizationService } from '../../../services/DeviceCategorizationService';

interface EnergyChartProps {
  data: DeviceReading[];
  deviceData: DeviceDataResponse;
  viewType: ViewType;
  viewLevel: 'category' | 'device';
  selectedCategory: string | null;
  isMobile: boolean;
  getUniqueDeviceColor: (deviceKey: string, index: number) => string;
  getCategoryColor: (category: string) => string;
}

export const EnergyChart: React.FC<EnergyChartProps> = ({
  data,
  deviceData,
  viewType,
  viewLevel,
  selectedCategory,
  isMobile,
  getUniqueDeviceColor,
  getCategoryColor
}) => {
  // Track device colors for consistency
  const [deviceColors, setDeviceColors] = useState<Record<string, string>>({});

  // Build category data structure for category view
  const getCategoryData = () => {
    if (!deviceData || data.length === 0) return [];
    
    // Aggregate device data by category
    const categoryTotals: Record<string, number> = {};
    
    Object.entries(deviceData).forEach(([deviceKey, device]) => {
      const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
      
      // Get normalized category
      let category = deviceCategorizationService.getDeviceCategory(device.name);
      
      // Skip devices from other categories if a category is selected
      if (selectedCategory && category !== selectedCategory) {
        return;
      }
      
      // Sum up the values for this device
      let deviceTotal = 0;
      data.forEach(reading => {
        if (typeof reading[deviceName] === 'number') {
          deviceTotal += reading[deviceName];
        }
      });
      
      // Add to category total
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += deviceTotal;
    });
    
    // Convert to chart format
    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      value: total
    }));
  };
  
  // Build device colors on mount
  useEffect(() => {
    if (!deviceData) return;

    const colors: Record<string, string> = {};

    // Define our color map for categories
    const categoryColorMap: Record<string, string> = {
      'Entertainment': '#2563eb', // blue
      'Lighting': '#2dd4bf', // teal
      'Kitchen': '#dc2626', // red
      'Smart Home': '#8b5cf6', // purple
      'Heating & Cooling': '#f59e0b', // amber
      'Home Office': '#10b981', // emerald
      'Unknown': '#6b7280', // gray
    };

    // Track devices per category for shade variations
    const categoryDeviceCounts: Record<string, number> = {};

    // First pass: count devices per category
    Object.entries(deviceData).forEach(([_, device]) => {
      const category = deviceCategorizationService.getDeviceCategory(device.name);
      categoryDeviceCounts[category] = (categoryDeviceCounts[category] || 0) + 1;
    });

    // Build color mapping for all devices
    Object.entries(deviceData).forEach(([deviceKey, device], index) => {
      try {
        const category = deviceCategorizationService.getDeviceCategory(device.name);
        console.log(`Device: ${device.name}, Category: ${category}`);
        
        let deviceColor;
        
        if (viewLevel === 'category' || !selectedCategory) {
          // In category view or when no category is selected,
          // use category color without modification
          deviceColor = categoryColorMap[category] || '#6b7280';
        } else {
          // In device view with a selected category, generate unique colors
          // for devices within the same category using variations of the base color
          
          // Track which number device this is in its category
          const deviceCount = categoryDeviceCounts[category] || 1;
          const deviceIndex = index % deviceCount;
          
          // If there's only one device in the category, use the category color
          if (deviceCount <= 1) {
            deviceColor = categoryColorMap[category] || '#6b7280';
          } else {
            // For multiple devices in a category, create variations
            // Slight lightness/darkness variations for better visual distinction
            // Using the getUniqueDeviceColor function to get unique variations
            deviceColor = getUniqueDeviceColor(deviceKey, index);
          }
        }
        
        colors[deviceKey] = deviceColor;
        console.log(`Assigned color for ${device.name}: ${colors[deviceKey]}`);
      } catch (e) {
        console.error(`Error getting color for ${device.name}:`, e);
        colors[deviceKey] = getUniqueDeviceColor(deviceKey, index);
      }
    });
    
    setDeviceColors(colors);
  }, [deviceData, selectedCategory, viewLevel, getUniqueDeviceColor]);

  const processDataForTimeBlocks = (
    data: DeviceReading[],
    deviceData: DeviceDataResponse,
    selectedCategory: string | null
  ) => {
    // Define time blocks
    const timeBlocks = [
      { name: 'Morning', start: 5, end: 11 },   // 5am-12pm
      { name: 'Afternoon', start: 12, end: 16 }, // 12pm-5pm
      { name: 'Evening', start: 17, end: 21 },  // 5pm-10pm
      { name: 'Night', start: 22, end: 4 }      // 10pm-5am
    ];
    
    // Define the type for our result objects
    type TimeBlockResult = {
      timeBlock: string;
      total: number;
      [key: string]: string | number; // Allow for dynamic device keys
    };
    
    // Initialize result structure
    const result = timeBlocks.map(block => {
      // Start with the base properties
      const blockData: TimeBlockResult = {
        timeBlock: block.name,
        total: 0
      };
      
      // Add device-specific properties
      Object.entries(deviceData)
        .filter(([_, device]) => {
          if (!selectedCategory) return true;
          const category = deviceCategorizationService.getDeviceCategory(device.name);
          return category === selectedCategory;
        })
        .forEach(([_, device]) => {
          const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
          blockData[`${deviceName}_energy`] = 0;
        });
      
      return blockData;
    });
    
    // Process data
    data.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      
      // Find which time block this hour belongs to
      const timeBlockIndex = timeBlocks.findIndex(block => {
        if (block.start <= block.end) {
          // Regular case (e.g., 5-11)
          return hour >= block.start && hour <= block.end;
        } else {
          // Overnight case (e.g., 22-4)
          return hour >= block.start || hour <= block.end;
        }
      });
      
      if (timeBlockIndex === -1) return;
      
      // Process each device's reading for this hour
      Object.entries(deviceData)
        .filter(([_, device]) => {
          if (!selectedCategory) return true;
          const category = deviceCategorizationService.getDeviceCategory(device.name);
          return category === selectedCategory;
        })
        .forEach(([_, device]) => {
          const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
          const value = reading[deviceName];
          
          if (typeof value === 'number') {
            // Now TypeScript knows we can index with string keys
            const energyKey = `${deviceName}_energy`;
            result[timeBlockIndex][energyKey] = (result[timeBlockIndex][energyKey] as number || 0) + value;
            result[timeBlockIndex].total += value;
          }
        });
    });
    
    return result;
  };

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 sm:h-80">
        <p>No data available for this time period</p>
      </div>
    );
  }

  // Render category view chart
  if (viewLevel === 'category') {
    const categoryData = getCategoryData();

    // Test the getCategoryColor function directly
    categoryData.forEach((item, index) => {
      const catString = String(item.category);
      try {
        const color = getCategoryColor(catString);
        console.warn(`Category "${catString}" -> Color "${color}"`);
      } catch (error) {
        console.error(`Error getting color for "${catString}":`, error);
      }
    });

    return (
      <div className="h-108 sm:h-132">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={categoryData}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category"
              tick={{ fontSize: 10 }}
              height={30}
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
              formatter={(value: number) => [`${value.toFixed(3)} kW`]}
              contentStyle={{ fontSize: '0.875rem' }}
            />
            <Bar 
              dataKey="value" 
              name="Energy Usage">
              {categoryData.map((entry, index) => {
                const catString = String(entry.category);
                let color = getCategoryColor(catString);
                
                return (
                  <Cell key={`cell-${index}`} fill={color} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Otherwise render device view chart
  return (
    <div className="h-108 sm:h-132">
      <ResponsiveContainer width="100%" height="100%">
      {viewType === 'day' ? (
        // Day view - Grouped Bar Chart by time periods
        <BarChart
          data={processDataForTimeBlocks(data, deviceData, selectedCategory)}
          margin={{ top: 10, right: 0, left: 10, bottom: 10 }}
          barCategoryGap={isMobile ? 5 : 10}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timeBlock"
            tick={{ fontSize: 10 }}
            height={35}
            label={{ 
              value: 'Time of Day', 
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: '0.75rem' }
            }}
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
              if (name === 'total') {
                return [`${value.toFixed(3)} kW`, "Total Energy"];
              }
              const deviceInfo = Object.values(deviceData).find(
                device => device.name.toLowerCase().replace(/\s+/g, '_') === name.replace('_energy', '')
              );
              return [`${value.toFixed(3)} kW`, deviceInfo?.name || name.replace('_energy', '')];
            }}
            contentStyle={{ fontSize: '0.875rem' }}
          />
          <Legend 
            verticalAlign="top" 
            height={70}
            wrapperStyle={{ 
              fontSize: '0.75rem',
              paddingBottom: '25px' 
            }}
            formatter={(value) => {
              if (value === 'total') return "Total Energy";
              const deviceName = value.replace('_energy', '');
              const deviceInfo = Object.values(deviceData).find(
                device => device.name.toLowerCase().replace(/\s+/g, '_') === deviceName
              );
              return deviceInfo?.name || deviceName;
            }}
          />
          
          {/* Bars for each device */}
          {Object.entries(deviceData)
            .filter(([_, device]) => {
              if (!selectedCategory) return true;
              const category = deviceCategorizationService.getDeviceCategory(device.name);
              return category === selectedCategory;
            })
            .map(([deviceKey, device], index) => {
              const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
              const color = deviceColors[deviceKey] || '#6b7280';
              
              return (
                <Bar
                  key={deviceKey}
                  dataKey={`${deviceName}_energy`}
                  name={deviceName}
                  fill={color}
                  barSize={isMobile ? 8 : 15}
                />
              );
            })
          }
          
          {/* Total line */}
          <Line
            type="monotone"
            dataKey="total"
            name="total"
            stroke="#696969"
            strokeWidth={2}
            dot={{ fill: '#696969', r: 3 }}
          />
        </BarChart>
      ) : (
          // Week view - ComposedChart 
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 5, left: 10, bottom: 10 }}
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
                offset: -5,
                style: { fontSize: '0.75rem' }
              }}
              tick={{ fontSize: 10 }}
              height={30}
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
              height={70}
              wrapperStyle={{ 
                fontSize: '0.75rem',
                paddingBottom: '25px'
              }}
            />
            
            {/* Filter devices by selected category if needed */}
            {Object.entries(deviceData)
              .filter(([_, device]) => {
                if (!selectedCategory) return true;
                const category = deviceCategorizationService.getDeviceCategory(device.name);
                return category === selectedCategory;
              })
              .map(([deviceKey, device], index) => {
                const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                // Use the color from our state, or a default if not yet computed
                const color = deviceColors[deviceKey] || '#6b7280';
                
                return (
                  <Bar
                    key={deviceKey}
                    dataKey={deviceName}
                    name={device.name}
                    fill={color}
                    barSize={window.innerWidth < 768 ? 30 : 20}
                  />
                );
              })
            }
            
            <Line
              type="linear"
              dataKey={(data) => {
                // Only include selected category devices in total if category is selected
                let total = 0;
                Object.values(deviceData)
                  .filter((device) => {
                    if (!selectedCategory) return true;
                    const category = deviceCategorizationService.getDeviceCategory(device.name);
                    return category === selectedCategory;
                  })
                  .forEach(device => {
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