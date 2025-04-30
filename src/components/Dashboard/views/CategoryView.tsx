/**
 * # CategoryView Component
 *
 * The `CategoryView` component provides a high-level overview of energy usage and costs grouped by categories (e.g., Entertainment, Kitchen).
 * It displays a grid of cards, where each card represents a category and includes metrics such as total energy usage, estimated cost, 
 * device count, and comparisons with historical averages.
 *
 * ## Key Features
 * - **Category Overview**:
 *   - Displays total energy usage (in kWh) and estimated cost (£) for each category.
 *   - Shows the number of devices in each category.
 * - **Comparison with Historical Averages**:
 *   - Highlights percentage changes in energy usage compared to historical averages.
 *   - Uses color coding (green for reductions, red for increases, gray for no change).
 * - **Interactive Cards**:
 *   - Each category card is clickable and triggers the `onCategoryClick` callback to navigate to the device-level view for that category.
 * - **Dynamic Cost Display**:
 *   - Optionally displays estimated costs based on the `showCost` prop.
 *
 * ## Props
 * - `data`: Array of energy usage readings for the current time period.
 * - `deviceData`: Metadata for devices, including their names and categories.
 * - `onCategoryClick`: Callback function triggered when a category card is clicked. Typically used to navigate to the device-level view.
 * - `getCategoryColor`: Function to retrieve the color associated with a specific category.
 * - `comparisonData?`: Optional record of comparison metrics for each category, including:
 *   - `current`: The current energy usage (in kWh).
 *   - `average`: The historical average energy usage (in kWh).
 *   - `percentChange`: The percentage change between the current and average usage.
 * - `viewType?`: Specifies whether the data is for a "day" or "week" view (default: "day").
 * - `showCost?`: Boolean indicating whether to display estimated costs (default: `true`).
 *
 * ## Data Flow
 * - **Category Data Transformation**:
 *   - Groups devices by category using `DeviceCategorizationService`.
 *   - Aggregates energy usage and calculates total costs for each category.
 * - **Comparison Data**:
 *   - If `comparisonData` is provided, it is used to calculate percentage changes and highlight trends.
 * - **Card Interactions**:
 *   - Clicking a category card triggers the `onCategoryClick` callback, passing the category name.
 *
 * ## Usage
 * This component is used in `Dashboard.tsx` to display a summary of energy usage by category:
 * ```tsx
 * <CategoryView
 *   data={currentData}
 *   deviceData={deviceMetadata}
 *   onCategoryClick={(category) => setSelectedCategory(category)}
 *   getCategoryColor={(category) => categoryColorMap[category]}
 *   comparisonData={comparisonMetrics}
 *   viewType="week"
 *   showCost={true}
 * />
 * ```
 *
 * ## Integration with `Dashboard.tsx`
 * - The `CategoryView` component is rendered when no specific category is selected.
 * - When a category card is clicked, the `onCategoryClick` callback updates the state in `Dashboard.tsx` to display the device-level view for the selected category.
 * - Example:
 *   ```tsx
 *   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
 *
 *   return (
 *     <div>
 *       {selectedCategory ? (
 *         <DeviceView category={selectedCategory} />
 *       ) : (
 *         <CategoryView
 *           data={currentData}
 *           deviceData={deviceMetadata}
 *           onCategoryClick={(category) => setSelectedCategory(category)}
 *           getCategoryColor={(category) => categoryColorMap[category]}
 *           comparisonData={comparisonMetrics}
 *           viewType="week"
 *           showCost={true}
 *         />
 *       )}
 *     </div>
 *   );
 *   ```
 *
 * ## Notes
 * - The `CategoryView` component relies on `DeviceCategorizationService` to group devices by category.
 * - The `CostEstimationService` is used to calculate estimated costs for each category.
 * - The `getCategoryColor` function ensures consistent color coding across the dashboard.
 * - The `comparisonData` prop is optional but enhances the component by providing historical context.
 *
 * ## Dependencies
 * - **DeviceCategorizationService**: Groups devices by category.
 * - **CostEstimationService**: Calculates estimated costs for energy usage.
 * - **Card**: A reusable card component from the UI library for displaying category metrics.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, TrendingDown, FolderIcon, HomeIcon } from 'lucide-react';
import { DeviceDataResponse, DeviceReading } from '../../../types/device';
import { deviceCategorizationService } from '../../../services/DeviceCategorizationService';
import { CostEstimationService } from '@/services/CostEstimationService';

interface CategoryViewProps {
  data: DeviceReading[];
  deviceData: DeviceDataResponse;
  onCategoryClick: (category: string) => void;
  getCategoryColor: (deviceName: string) => string;
  comparisonData?: Record<string, {
    current: number;
    average: number;
    percentChange: number;
  }>;
  viewType?: 'day' | 'week';
  showCost?: boolean;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  data,
  deviceData,
  onCategoryClick,
  getCategoryColor,
  comparisonData = {},
  viewType = 'day',
  showCost = true 
}) => {
  // Get all unique categories
  const categories = [...new Set(Object.values(deviceData).map(device => 
    deviceCategorizationService.getDeviceCategory(device.name)
  ))];
  
  // Transform data to category format
  const categoryData = categories.map(category => {
    // Get all devices in this category
    const devicesInCategory = Object.entries(deviceData).filter(([_, device]) => 
      deviceCategorizationService.getDeviceCategory(device.name) === category
    );
    
    // Calculate total for this category
    const categoryTotal = data.reduce((total, reading) => {
      let dayTotal = 0;
      devicesInCategory.forEach(([_, device]) => {
        const deviceName = device.name.toLowerCase().replace(/\s+/g, '_');
        if (typeof reading[deviceName] === 'number') {
          dayTotal += reading[deviceName];
        }
      });
      return total + dayTotal;
    }, 0);

    // Calculate cost for this category using the existing service
    const categoryCost = showCost ? CostEstimationService.estimateCost(categoryTotal) : 0;

    // Get comparison data if available
    const comparison = comparisonData[category];
    
    return {
      category,
      value: categoryTotal,
      cost: categoryCost,
      deviceCount: devicesInCategory.length,
      comparison,
      // For onClick handling
      onClick: () => onCategoryClick(category)
    };
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryData.map(category => (
          <Card 
            key={category.category} 
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => category.onClick()}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getCategoryColor(category.category) }} 
                />
                {category.category}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* Primary metric - Large and prominent */}
              <div className="mb-3 flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold">{category.value.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">kilowatt hours</p>
                </div>
                
                {showCost && (
                  <div className="text-right">
                    <p className="text-lg font-medium">£{category.cost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">estimated cost</p>
                  </div>
                )}
              </div>
              
              {/* Secondary information with icons */}
              <div className="grid grid-cols-1 gap-2">
                {/* Device count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full p-1 bg-gray-100">
                      <HomeIcon className="h-3 w-3 text-gray-600" />
                    </span>
                    <span className="text-sm text-gray-600">Devices</span>
                  </div>
                  <span className="text-sm font-medium">
                    {category.deviceCount}
                  </span>
                </div>
                
                {/* Comparison with average if available */}
                {category.comparison && (
                  <div 
                    className={`flex items-center justify-between py-1 px-2 rounded-md ${
                      category.comparison.percentChange < 0 
                        ? 'bg-green-50' 
                        : category.comparison.percentChange > 0 
                          ? 'bg-red-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className={`${
                          category.comparison.percentChange < 0 
                            ? 'text-green-600'
                            : category.comparison.percentChange > 0 
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {category.comparison.percentChange < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </span>
                      <span className="text-sm text-gray-600">vs average</span>
                    </div>
                    
                    <span className={`text-sm font-medium ${
                      category.comparison.percentChange < 0 
                        ? 'text-green-600'
                        : category.comparison.percentChange > 0 
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}>
                      {category.comparison.percentChange > 0 ? '+' : ''}
                      {category.comparison.percentChange.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};