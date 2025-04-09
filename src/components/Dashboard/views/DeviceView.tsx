import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { deviceCategorizationService } from '@/services/DeviceCategorizationService';
import { DeviceDataResponse, DeviceReading } from '@/types/device';
import { ViewType } from '@/types/views';
import { useHistoricalData } from '@/hooks/useHistoricalData';

interface DeviceViewProps {
  deviceData: DeviceDataResponse;
  data: DeviceReading[];
  selectedCategory: string | null;
  participantId?: string;
  viewType: ViewType;
}

export function DeviceView({ 
  deviceData, 
  data, 
  selectedCategory,
  participantId,
  viewType 
}: DeviceViewProps) {
  // Fetch historical comparison data
  const { deviceComparisonData, isLoading } = useHistoricalData(
    participantId,
    deviceData,
    data,
    viewType
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(deviceData)
        .filter(([_, device]) => 
          // Only show devices in the selected category, or all if no category selected
          !selectedCategory || deviceCategorizationService.getDeviceCategory(device.name) === selectedCategory
        )
        .map(([deviceKey, device]) => {
          // Create normalized device name to match with our comparison data keys
          const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
          const comparisonInfo = deviceComparisonData[deviceName];
          
          return (
            <Card key={deviceKey} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Activity className="w-5 h-5" />
                  {device.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {deviceCategorizationService.getDeviceCategory(device.name)}
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
                  
                  {/* Historical comparison section */}
                  {viewType === 'week' && comparisonInfo && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compared to average:</span>
                        <div className={`flex items-center gap-1 ${
                          comparisonInfo.percentChange < 0 
                            ? 'text-green-600' 
                            : comparisonInfo.percentChange > 0 
                              ? 'text-red-600' 
                              : 'text-gray-500'
                        }`}>
                          {comparisonInfo.percentChange < 0 ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : comparisonInfo.percentChange > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : null}
                          <span className="text-sm font-semibold">
                            {comparisonInfo.percentChange > 0 ? '+' : ''}
                            {comparisonInfo.percentChange}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                        <div>
                          <p>Current: {comparisonInfo.current.toFixed(1)} kWh</p>
                        </div>
                        <div>
                          <p>Average: {comparisonInfo.average.toFixed(1)} kWh</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}