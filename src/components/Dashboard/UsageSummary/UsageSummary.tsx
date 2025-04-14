import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DeviceDataResponse, DeviceReading } from '@/types/device';
import { ViewType } from '@/types/views';

interface UsageSummaryProps {
  data: DeviceReading[];
  deviceData: DeviceDataResponse;
  viewType: ViewType;
  comparisonData: Record<string, {
    current: number;
    average: number;
    percentChange: number;
  }>;
}

export function UsageSummary({
  data,
  comparisonData,
  viewType
}: UsageSummaryProps) {
  // Calculate total energy across all categories
  const totalEnergy = React.useMemo(() => {
    return Object.values(comparisonData).reduce((total, item) => total + item.current, 0);
  }, [comparisonData]);
  
  // Calculate historical average energy across all categories
  const averageEnergy = React.useMemo(() => {
    return Object.values(comparisonData).reduce((total, item) => total + item.average, 0);
  }, [comparisonData]);
  
  // Calculate percentage change
  const energyChange = React.useMemo(() => {
    if (averageEnergy === 0) return 0;
    return ((totalEnergy - averageEnergy) / averageEnergy) * 100;
  }, [totalEnergy, averageEnergy]);
  
  // Cost calculations (using a fixed rate)
  const COST_PER_KWH = 0.34; // Example rate
  const totalCost = totalEnergy * COST_PER_KWH;
  const averageCost = averageEnergy * COST_PER_KWH;
  const costChange = energyChange; // Same percentage change

  const periodLabel = viewType === 'day' ? 'Today' : 'This Week';
  const comparisonLabel = viewType === 'day' ? 'daily average' : 'weekly average';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Energy Usage Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-2">Energy Usage</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{totalEnergy.toFixed(2)} kWh</p>
              <p className="text-sm text-gray-500">{periodLabel}</p>
            </div>
            
            <div className={`text-sm ${energyChange < 0 ? 'text-green-600' : energyChange > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              <span className="font-medium">
                {energyChange > 0 ? '↑' : energyChange < 0 ? '↓' : ''}
                {Math.abs(energyChange).toFixed(1)}%
              </span>
              <span className="block text-xs">vs {comparisonLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-2">Cost</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">£{totalCost.toFixed(2)}</p>
              <p className="text-sm text-gray-500">{periodLabel}</p>
            </div>
            
            <div className={`text-sm ${costChange < 0 ? 'text-green-600' : costChange > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              <span className="font-medium">
                {costChange > 0 ? '↑' : costChange < 0 ? '↓' : ''}
                {Math.abs(costChange).toFixed(1)}%
              </span>
              <span className="block text-xs">vs {comparisonLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}