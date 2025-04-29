/**
 * # UsageSummary Component
 *
 * The `UsageSummary` component provides a high-level summary of energy usage and costs for the selected time period (day or week).
 * It calculates and displays the total energy usage, historical averages, percentage changes, and estimated costs.
 *
 * ## Key Features
 * - **Energy Usage Summary**:
 *   - Displays the total energy usage (in kWh) for the selected time period.
 *   - Compares the current energy usage with the historical average and highlights the percentage change.
 * - **Cost Summary**:
 *   - Estimates the total cost of energy usage based on a fixed rate (`COST_PER_KWH`).
 *   - Compares the current cost with the historical average cost and highlights the percentage change.
 * - **Dynamic Labels**:
 *   - Adjusts labels and comparisons based on the selected view type (`day` or `week`).
 * - **Color Coding**:
 *   - Uses green for reductions in energy usage or cost, red for increases, and gray for no change.
 *
 * ## Props
 * - `data`: Array of energy usage readings for the current time period.
 * - `deviceData`: Metadata for devices, including their names and categories.
 * - `viewType`: Specifies whether the summary is for a "day" or "week" view.
 * - `comparisonData`: A record of comparison metrics for each category or device, including:
 *   - `current`: The current energy usage (in kWh).
 *   - `average`: The historical average energy usage (in kWh).
 *   - `percentChange`: The percentage change between the current and average usage.
 *
 * ## Data Flow
 * - **Energy Usage**:
 *   - Aggregates the current energy usage across all categories or devices using `comparisonData`.
 *   - Calculates the historical average energy usage and the percentage change.
 * - **Cost Estimation**:
 *   - Uses a fixed rate (`COST_PER_KWH`) to estimate the total cost for the current and average energy usage.
 *   - Calculates the percentage change in costs based on energy usage changes.
 * - **Dynamic Labels**:
 *   - Adjusts labels like "Today" or "This Week" based on the `viewType` prop.
 *   - Compares the current period with the "daily average" or "weekly average" as appropriate.
 *
 * ## Usage
 * ```tsx
 * <UsageSummary
 *   data={currentData}
 *   deviceData={deviceMetadata}
 *   viewType="week"
 *   comparisonData={{
 *     Entertainment: { current: 12.5, average: 10.0, percentChange: 25.0 },
 *     Kitchen: { current: 8.0, average: 9.0, percentChange: -11.1 },
 *   }}
 * />
 * ```
 *
 * ## Notes
 * - The `COST_PER_KWH` constant is set to `0.34` (£/kWh) as an example rate and should be updated to reflect current electricity prices.
 * - The component uses `React.useMemo` to optimize calculations for total energy, average energy, and percentage changes.
 * - If the historical average energy usage is `0`, the percentage change is set to `0` to avoid division by zero errors.
 * - The component is styled to display two cards side-by-side on larger screens and stacked on smaller screens.
 *
 * ## Dependencies
 * - **Card**: A reusable card component from the UI library for displaying energy and cost summaries.
 * - **DeviceDataResponse**: Type definition for device metadata.
 * - **ViewType**: Enum for specifying the view type (`day` or `week`).
 */

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