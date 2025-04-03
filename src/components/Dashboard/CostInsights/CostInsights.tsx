import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PoundSterlingIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { CostEstimationService } from '@/services/CostEstimationService';
import { deviceCategorizationService } from '@/services/DeviceCategorizationService';
import { DeviceData, DeviceDataResponse, DeviceInsights, DeviceReading } from '@/types/device';
import { ViewType } from '@/types/views';
import { getDeviceInsights } from './utils';

interface CostInsightsProps {
  data: DeviceReading[];
  deviceData: DeviceDataResponse;
  previousWeekData: DeviceReading[];
  viewType: ViewType;
}

export function CostInsights({ 
  data, 
  deviceData, 
  previousWeekData, 
  viewType 
}: CostInsightsProps) {
  // Get background color for insight cards based on device category
  const getCategoryBgColor = (deviceName: string) => {
    const category = deviceCategorizationService.getDeviceCategory(deviceName);
    const bgColorMap: Record<string, string> = {
      'Entertainment': 'bg-blue-50',
      'Smart Lighting': 'bg-teal-50',
      'Kitchen': 'bg-red-50',
      'Smart Home': 'bg-purple-50',
      'Heating': 'bg-amber-50',
      'Cooling': 'bg-sky-50',
      'Home Office': 'bg-emerald-50'
    };
    
    return bgColorMap[category] || 'bg-gray-50';
  };

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <PoundSterlingIcon className="w-5 h-5" />
          Cost Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {Object.entries(deviceData).map(([deviceKey, device]) => {
            // Skip if no data for this time period
            if (data.length === 0) {
              return (
                <div key={deviceKey} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-sm sm:text-base">{device.name}</h3>
                  <p className="text-sm">No usage data available for this time period</p>
                </div>
              );
            }

            try {
              const insights = getDeviceInsights({
                deviceData: data,
                deviceKey,
                deviceInfo: device,
                viewType
              });

              // Use category-based background colors
              const bgColor = getCategoryBgColor(device.name);
              const costAmount = CostEstimationService.estimateCost(insights.totalEnergy);
  
              return (
                <div
                  key={deviceKey}
                  className={`p-4 ${bgColor} rounded-lg`}
                >
                  <h3 className="font-medium text-sm sm:text-base">{device.name}</h3>
                  <div className="mt-2">
                    <div className="flex items-baseline">
                      <span className="text-xl font-medium">£{costAmount.toFixed(2)}</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {viewType === 'day' ? 'today' : 'this week'}
                      </span>
                    </div>
                    
                    {/* For week view only - show comparison with previous week */}
                    {viewType === 'week' && previousWeekData.length > 0 && (
                      (() => {
                        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
                        const prevWeekDevice = previousWeekData.reduce((sum, reading) => 
                          sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0), 0);
                        
                        if (prevWeekDevice > 0) {
                          const savings = CostEstimationService.calculateSavings(prevWeekDevice, insights.totalEnergy);
                          return (
                            <div className="mt-1">
                              <span className={savings.isSaving ? "text-green-600" : "text-red-600"}>
                                {savings.isSaving ? (
                                  <>
                                    <span className="inline-flex items-center">
                                      <ArrowDownIcon className="w-3 h-3 mr-1" /> 
                                      Saved £{savings.costDifference.toFixed(2)} ({savings.percentChange.toFixed(1)}%)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center">
                                      <ArrowUpIcon className="w-3 h-3 mr-1" /> 
                                      Spent £{savings.costDifference.toFixed(2)} more ({savings.percentChange.toFixed(1)}%)
                                    </span>
                                  </>
                                )}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Compared to last week</p>
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Category: {insights.deviceCategory}
                    </p>
                  </div>
                </div>
              );
            } catch (error) {
              return (
                <div key={deviceKey} className={`p-4 bg-gray-50 rounded-lg`}>
                  <h3 className="font-medium text-sm sm:text-base">{device.name}</h3>
                  <p className="text-sm">Unable to calculate cost for this period</p>
                </div>
              );
            }
          })}
        </div>
        <div className="border-t pt-6 pb-2 mt-6">
          <p className="text-sm text-muted-foreground max-w-prose mx-auto sm:mx-0">
            These are estimates of the maximum amount you'd pay based on the standard UK electricity price cap. Source: Ofgem
          </p>
        </div>
      </CardContent>
    </Card>
  );
}