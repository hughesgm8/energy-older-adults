import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { deviceCategorizationService } from '@/services/DashboardCategorizationService';
import { DeviceDataResponse, DeviceReading } from '@/types/device';

interface DeviceViewProps {
  deviceData: DeviceDataResponse;
  data: DeviceReading[];
  selectedCategory: string | null;
}

export function DeviceView({ deviceData, data, selectedCategory }: DeviceViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(deviceData)
        .filter(([_, device]) => 
          // Only show devices in the selected category, or all if no category selected
          !selectedCategory || deviceCategorizationService.getDeviceCategory2(device.name) === selectedCategory
        )
        .map(([deviceKey, device]) => (
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
                      const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                      const totalEnergy = data.reduce((sum, reading) => {
                        return sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0);
                      }, 0);
                      
                      const activeHours = data.filter(reading => {
                        const value = reading[deviceName];
                        return typeof value === 'number' && value > 0;
                      }).length;
                      
                      return `${activeHours} hours of use`;
                    } catch (error) {
                      return 'Data unavailable';
                    }
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      }
    </div>
  );
}