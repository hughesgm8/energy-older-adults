import {useState} from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { deviceCategorizationService } from '@/services/DeviceCategorizationService';
import { DeviceDataResponse, DeviceReading } from '@/types/device';
import { ViewType } from '@/types/views';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { CostEstimationService } from '@/services/CostEstimationService';

interface DeviceViewProps {
  deviceData: DeviceDataResponse;
  data: DeviceReading[];
  selectedCategory: string | null;
  participantId?: string;
  viewType: ViewType;
  showCost?: boolean;
}

export function DeviceView({ 
  deviceData, 
  data, 
  selectedCategory,
  participantId,
  viewType ,
  showCost = true
}: DeviceViewProps) {
  // Fetch historical comparison data
  const { deviceComparisonData, isLoading } = useHistoricalData(
    participantId,
    deviceData,
    data,
    viewType
  );

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (deviceKey: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [deviceKey]: !prev[deviceKey]
    }));
  };

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
          
          // Calculate total energy for this device
          const totalEnergy = data.reduce((sum, reading) => {
            return sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0);
          }, 0);
          
          // Calculate cost if showCost is true
          const totalCost = showCost ? CostEstimationService.estimateCost(totalEnergy) : 0;
          
          return (
            <Card key={deviceKey} className="shadow-sm">
              <CardContent className="p-4">
                {/* Primary information always visible */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-medium">{device.name}</h3>
                  </div>
                  <button 
                    onClick={() => toggleExpand(deviceKey)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={expandedCards[deviceKey] ? "Show less" : "Show more"}
                  >
                    {expandedCards[deviceKey] ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Essential metrics always visible */}
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-xl font-semibold">{totalEnergy.toFixed(1)} kWh</p>
                  </div>
                  {showCost && (
                    <div>
                      <p className="text-base font-medium">£{totalCost.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {/* Comparison indicator also always visible */}
                {viewType === 'week' && comparisonInfo && (
                  <div className={`mt-2 text-sm flex items-center ${
                    comparisonInfo.percentChange < 0 
                      ? 'text-green-600' 
                      : comparisonInfo.percentChange > 0 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {comparisonInfo.percentChange < 0 ? (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    )}
                    <span>{Math.abs(comparisonInfo.percentChange).toFixed(1)}% than average</span>
                  </div>
                )}
                
                {/* Additional details when expanded */}
                {expandedCards[deviceKey] && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="font-medium text-gray-700">{deviceCategorizationService.getDeviceCategory(device.name)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours active:</span>
                      <span className="font-medium text-gray-700">
                        {(() => {
                          if (!data || data.length === 0) return 'None';
                          try {
                            return data.filter(reading => {
                              const value = reading[deviceName];
                              return typeof value === 'number' && value > 0;
                            }).length + ' hours';
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </span>
                    </div>
                    {comparisonInfo && (
                      <>
                        <div className="flex justify-between">
                          <span>Current usage:</span>
                          <span className="font-medium text-gray-700">{comparisonInfo.current.toFixed(1)} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average usage:</span>
                          <span className="font-medium text-gray-700">{comparisonInfo.average.toFixed(1)} kWh</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}