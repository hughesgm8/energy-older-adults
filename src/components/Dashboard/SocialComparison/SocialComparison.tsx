/**
 * # SocialComparison Component
 *
 * This component displays energy usage comparisons for a participant's devices.
 * It receives pre-processed comparison data (likely from `ParticipantComparisonService`) and renders a list of charts for each device using `DeviceComparisonChart`.
 *
 * ## Key Features
 * - Displays a title and summary of energy usage comparisons.
 * - Iterates over the `comparisons` array to render a chart for each device.
 * - Uses `DeviceComparisonChart` to visualize the comparison data for individual devices.
 *
 * ## Props
 * - `comparisons`: An array of `ComparisonResult` objects, each containing:
 *   - `deviceName`: The name of the device being compared.
 *   - `yourUsage`: The participant's energy usage for the device.
 *   - `averageUsage`: The average energy usage of other participants for the device.
 *   - `percentDifference`: The percentage difference between `yourUsage` and `averageUsage`.
 *   - `isLowerThanAverage`: A boolean indicating if the participant's usage is lower than average.
 * - `viewType`: The selected view type (e.g., daily or weekly), which is passed to `DeviceComparisonChart`.
 *
 * ## Usage
 * ```tsx
 * <SocialComparison
 *   comparisons={[
 *     {
 *       deviceName: 'TV',
 *       yourUsage: 12.5,
 *       averageUsage: 10.0,
 *       percentDifference: 25.0,
 *       isLowerThanAverage: false,
 *     },
 *     {
 *       deviceName: 'Lamp',
 *       yourUsage: 5.0,
 *       averageUsage: 7.0,
 *       percentDifference: -28.6,
 *       isLowerThanAverage: true,
 *     },
 *   ]}
 *   viewType="week"
 * />
 * ```
 *
 * ## Notes
 * - This component does not fetch or process data itself. It relies on the parent component or service to provide the `comparisons` array.
 * - If `comparisons` is empty, a message is displayed indicating that no data is available.
 * - Each device's comparison data is passed to `DeviceComparisonChart` for rendering.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { DeviceIcon } from '@/components/DeviceIcon/DeviceIcon';
import DeviceComparisonChart from '@/components/ComparisonChart/DeviceComparisonChart';
import { ComparisonResult } from '@/services/ParticipantComparisonService';
import { ViewType } from '@/types/views';

interface SocialComparisonProps {
  comparisons: ComparisonResult[];
  viewType: ViewType;
}

export function SocialComparison({ comparisons, viewType }: SocialComparisonProps) {
  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="w-5 h-5" />
          Energy Usage Comparisons
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comparisons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No comparison data available for this time period.
          </p>
        ) : (
          <div className="space-y-6">
            {comparisons.map((comparison) => (
              <div key={comparison.deviceName} className="p-4 bg-blue-50 rounded-lg">
                <div className="mb-3 flex items-center gap-2">
                  <DeviceIcon deviceName={comparison.deviceName} className="w-5 h-5" />
                  <h3 className="font-medium">{comparison.deviceName}</h3>
                </div>
                <DeviceComparisonChart
                  deviceName={comparison.deviceName}
                  yourUsage={comparison.yourUsage}
                  averageUsage={comparison.averageUsage}
                  percentDifference={comparison.percentDifference}
                  isLowerThanAverage={comparison.isLowerThanAverage}
                  viewType={viewType}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}