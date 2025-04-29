/**
 * # CostInsights Component
 *
 * This React component provides insights into the estimated energy costs for devices or categories.
 * It calculates and displays the total energy cost for the selected time period (day or week) and compares it with the previous week (if applicable).
 *
 * ## Key Features
 * - **Category-Level Insights**: Aggregates energy usage and costs by category (e.g., Entertainment, Kitchen).
 * - **Device-Level Insights**: Filters and calculates costs for devices within a selected category.
 * - **Cost Estimation**: Uses `CostEstimationService` to estimate energy costs based on total energy usage.
 * - **Savings Comparison**: For weekly views, compares the current week's costs with the previous week's costs and highlights savings or overspending.
 * - **Dynamic Background Colors**: Assigns category-specific background colors for better visual distinction.
 * - **Fallback Messages**: Displays appropriate messages when no data is available for the selected time period or category.
 *
 * ## Props
 * - `data`: Array of energy usage readings for the current time period.
 * - `deviceData`: Metadata for devices, including their names and categories.
 * - `previousWeekData`: Array of energy usage readings for the previous week (used for comparisons).
 * - `viewType`: Specifies whether the insights are for a "day" or "week" view.
 * - `viewLevel`: Determines whether the insights are displayed at the "category" or "device" level (default: "category").
 * - `selectedCategory`: The currently selected category (if any). Filters devices to show only those in the selected category.
 *
 * ## Data Flow
 * - **Category-Level Insights**:
 *   - Groups devices by category using `deviceCategorizationService`.
 *   - Aggregates energy usage and calculates total costs for each category.
 * - **Device-Level Insights**:
 *   - Filters devices by the selected category and calculates costs for each device.
 * - **Savings Comparison**:
 *   - For weekly views, compares the current week's energy usage with the previous week's usage.
 *   - Highlights savings or overspending using color-coded messages (green for savings, red for overspending).
 *
 * ## Usage
 * ```tsx
 * <CostInsights
 *   data={currentData}
 *   deviceData={deviceMetadata}
 *   previousWeekData={lastWeekData}
 *   viewType="week"
 *   viewLevel="category"
 *   selectedCategory="Kitchen"
 * />
 * ```
 *
 * ## Notes
 * - The component relies on `CostEstimationService` for cost calculations and savings comparisons.
 * - Background colors for categories are defined in the `getCategoryBgColor` function.
 * - If no data is available, the component displays fallback messages to inform the user.
 * - The cost estimates are based on the standard UK electricity price cap (source: Ofgem).
 *
 * ## Dependencies
 * - **CostEstimationService**: Provides methods for estimating energy costs and calculating savings.
 * - **DeviceCategorizationService**: Categorizes devices and provides category metadata.
 * - **getDeviceInsights**: Utility function for processing device-level insights.
 */

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
  viewLevel?: 'category' | 'device';
  selectedCategory?: string | null;
}

export function CostInsights({ 
  data, 
  deviceData, 
  previousWeekData, 
  viewType,
  viewLevel = 'category',
  selectedCategory = null
}: CostInsightsProps) {
  // Get background color for categories
  const getCategoryBgColor = (category: string) => {
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

  // Group devices by category and calculate totals
  const getCategoryData = () => {
    const categoryTotals: Record<string, {
      totalEnergy: number,
      previousEnergy: number,
      deviceCount: number,
      category: string
    }> = {};
    
    // Process current data by category
    Object.entries(deviceData).forEach(([deviceKey, device]) => {
      const category = deviceCategorizationService.getDeviceCategory(device.name);
      
      // Skip if we're filtering by category and this isn't the selected one
      if (selectedCategory && category !== selectedCategory) return;
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          totalEnergy: 0,
          previousEnergy: 0,
          deviceCount: 0,
          category
        };
      }
      
      try {
        // Add device insights to category total
        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
        
        // Calculate current energy usage
        const deviceEnergyTotal = data.reduce((sum, reading) => 
          sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0), 0);
        categoryTotals[category].totalEnergy += deviceEnergyTotal;
        
        // Calculate previous energy usage (for week view)
        if (viewType === 'week' && previousWeekData.length > 0) {
          const prevEnergyTotal = previousWeekData.reduce((sum, reading) => 
            sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0), 0);
          categoryTotals[category].previousEnergy += prevEnergyTotal;
        }
        
        categoryTotals[category].deviceCount++;
      } catch (error) {
        console.error(`Error calculating insights for ${device.name}:`, error);
      }
    });
    
    // Sort categories by energy usage (highest to lowest)
    return Object.values(categoryTotals).sort((a, b) => b.totalEnergy - a.totalEnergy);
  };
  
  const categoryData = getCategoryData();

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <PoundSterlingIcon className="w-5 h-5" />
          Cost Insights {selectedCategory ? `- ${selectedCategory}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm">No usage data available for this time period</p>
          </div>
        ) : categoryData.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm">No devices in this category</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {categoryData.map((category) => {
              const bgColor = getCategoryBgColor(category.category);
              const costAmount = CostEstimationService.estimateCost(category.totalEnergy);
              
              return (
                <div
                  key={category.category}
                  className={`p-4 ${bgColor} rounded-lg`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm sm:text-base">{category.category}</h3>
                    <span className="text-xs text-gray-500">
                      {category.deviceCount} {category.deviceCount === 1 ? 'device' : 'devices'}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-baseline">
                      <span className="text-xl font-medium">£{costAmount.toFixed(2)}</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {viewType === 'day' ? 'today' : 'this week'}
                      </span>
                    </div>
                    
                    {/* For week view only - show comparison with previous week */}
                    {viewType === 'week' && category.previousEnergy > 0 && (
                      (() => {
                        const savings = CostEstimationService.calculateSavings(
                          category.previousEnergy, 
                          category.totalEnergy
                        );
                        
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
                            <p className="text-xs text-gray-500 mt-1">Compared to previous week</p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="border-t pt-6 pb-2 mt-6">
          <p className="text-sm text-muted-foreground max-w-prose mx-auto sm:mx-0">
            These are estimates based on the standard UK electricity price cap. Source: Ofgem
          </p>
        </div>
      </CardContent>
    </Card>
  );
}