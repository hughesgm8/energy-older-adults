import { useState, useEffect } from 'react';
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
  // debugging
  useEffect(() => {
    // Log the entire data structure to see what's available
    console.log('DeviceView received data:', data);
    
    // Check structure of first reading if available
    if (data && data.length > 0) {
      console.log('First reading structure:', data[0]);
      console.log('First reading keys:', Object.keys(data[0]));
      
      // Check device names formatting
      const deviceNames = Object.entries(deviceData).map(([_, device]) => device.name.toLowerCase().replace(/\s+/g, '_'));
      console.log('Normalized device names:', deviceNames);
      
      // Check if active hours keys exist for any device
      deviceNames.forEach(name => {
        const activeHoursKey = `${name}_active_hours`;
        console.log(`Checking for ${activeHoursKey}:`, data[0][activeHoursKey]);
      });
    }
  }, [data, deviceData]);
  
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
            const value = typeof reading[deviceName] === 'number' ? reading[deviceName] : 0;
            // Only add values above a minimal threshold to match the "active hours" calculation
            return sum + value;
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
                    <p className="text-xl font-semibold">
                      {totalEnergy < 0.1 ? totalEnergy.toFixed(2) : totalEnergy.toFixed(1)} kWh
                    </p>
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
                            // First look for pre-calculated active hours
                            const activeHoursKey = `${deviceName}_active_hours`;
                            const preCalculatedHours = data.reduce((sum, reading) => {
                              return sum + (typeof reading[activeHoursKey] === 'number' ? reading[activeHoursKey] : 0);
                            }, 0);
                            
                            // If pre-calculated hours exist and are non-zero, use them
                            if (preCalculatedHours > 0) {
                              console.log(`Found pre-calculated hours for ${deviceName}: ${preCalculatedHours}`);
                              return preCalculatedHours + ' hours';
                            }
                            
                            // Otherwise calculate directly from energy readings
                            console.log(`Calculating hours directly for ${deviceName}`);
                            const calculatedHours = data.reduce((count, reading) => {
                              const value = typeof reading[deviceName] === 'number' ? reading[deviceName] : 0;
                              return count + (value > 0 ? 1 : 0);
                            }, 0);
                            
                            console.log(`Calculated ${calculatedHours} active hours for ${deviceName}`);
                            return calculatedHours + ' hours';
                          } catch (err) {
                            console.error('Error calculating active hours:', err);
                            return 'N/A';
                          }
                        })()}
                      </span>
                    </div>
                    {comparisonInfo && (
                      <>
                        <div className="flex justify-between">
                          <span>Current usage:</span>
                          <span className="font-medium text-gray-700">
                            {comparisonInfo.current < 0.1 ? comparisonInfo.current.toFixed(2) : comparisonInfo.current.toFixed(1)} kWh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average usage:</span>
                          <span className="font-medium text-gray-700">
                            {comparisonInfo.average < 0.1 ? comparisonInfo.average.toFixed(2) : comparisonInfo.average.toFixed(1)} kWh
                          </span>
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