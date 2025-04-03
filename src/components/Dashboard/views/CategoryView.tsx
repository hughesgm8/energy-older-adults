import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DeviceDataResponse, DeviceReading, CategoryReading } from '../../../types/device';
import { deviceCategorizationService } from '../../../services/DeviceCategorizationService';

interface CategoryViewProps {
  data: DeviceReading[];
  deviceData: DeviceDataResponse;
  onCategoryClick: (category: string) => void;
  getCategoryColor: (deviceName: string) => string;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  data,
  deviceData,
  onCategoryClick,
  getCategoryColor
}) => {
  // Get all unique categories
  const categories = [...new Set(Object.values(deviceData).map(device => 
    deviceCategorizationService.getDeviceCategory(device.name)
  ))];
  
  // Transform data to category format
  const categoryData = categories.map(category => {
    // Get all devices in this category
    const devicesInCategory = Object.entries(deviceData).filter(([_, device]) => 
      deviceCategorizationService.getDeviceCategory(device.name) === category
    );
    
    // Calculate total for this category
    const categoryTotal = data.reduce((total, reading) => {
      let dayTotal = 0;
      devicesInCategory.forEach(([_, device]) => {
        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
        if (typeof reading[deviceName] === 'number') {
          dayTotal += reading[deviceName];
        }
      });
      return total + dayTotal;
    }, 0);
    
    return {
      category,
      value: categoryTotal,
      deviceCount: devicesInCategory.length,
      // For onClick handling
      onClick: () => onCategoryClick(category)
    };
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryData.map(category => (
          <Card 
            key={category.category} 
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => category.onClick()}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="w-5 h-5" style={{ color: getCategoryColor(category.category) }} />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {category.deviceCount} {category.deviceCount === 1 ? 'device' : 'devices'}
                </p>
                <p className="text-lg font-medium">
                  {category.value.toFixed(2)} kW
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};