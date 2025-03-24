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