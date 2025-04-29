/**
 * # CostEstimationService
 *
 * This service provides utility methods for estimating energy costs and calculating savings or overspending.
 * It is used throughout the application to provide cost-related insights based on energy usage data.
 *
 * ## Key Features
 * - **Cost Estimation**: Calculates the estimated cost of energy usage based on a default price per kWh.
 * - **Savings Calculation**: Compares energy usage between two periods (e.g., previous week vs. current week) and calculates:
 *   - Percentage change in energy usage.
 *   - Cost difference between the two periods.
 *   - Whether the user is saving or overspending.
 *
 * ## Constants
 * - `DEFAULT_PRICE_PER_KWH`: The default price of electricity per kWh, based on the UK price cap as of March 2025.
 *   - Value: `0.2703` (£/kWh).
 *   - This value should be updated periodically to reflect current electricity rates.
 *
 * ## Methods
 * - `estimateCost(energyUsageKwh: number): number`
 *   - Estimates the cost of energy usage based on the provided energy consumption in kWh.
 *   - **Parameters**:
 *     - `energyUsageKwh`: The total energy usage in kilowatt-hours (kWh).
 *   - **Returns**: The estimated cost in GBP (£).
 *   - **Example**:
 *     ```typescript
 *     const cost = CostEstimationService.estimateCost(50); // 50 kWh
 *     console.log(cost); // Output: 13.515 (£)
 *     ```
 *
 * - `calculateSavings(previousUsage: number, currentUsage: number): { percentChange: number; costDifference: number; isSaving: boolean }`
 *   - Compares energy usage between two periods and calculates the percentage change, cost difference, and whether the user is saving.
 *   - **Parameters**:
 *     - `previousUsage`: The energy usage (in kWh) for the previous period.
 *     - `currentUsage`: The energy usage (in kWh) for the current period.
 *   - **Returns**: An object containing:
 *     - `percentChange`: The percentage change in energy usage.
 *     - `costDifference`: The cost difference between the two periods (in GBP).
 *     - `isSaving`: A boolean indicating whether the user is saving (`true`) or overspending (`false`).
 *   - **Example**:
 *     ```typescript
 *     const savings = CostEstimationService.calculateSavings(100, 80); // Previous: 100 kWh, Current: 80 kWh
 *     console.log(savings);
 *     // Output:
 *     // {
 *     //   percentChange: 20,
 *     //   costDifference: 5.406,
 *     //   isSaving: true
 *     // }
 *     ```
 *
 * ## Usage
 * This service is typically used in components like `CostInsights` to calculate energy costs and savings:
 * ```typescript
 * import { CostEstimationService } from '@/services/CostEstimationService';
 *
 * const cost = CostEstimationService.estimateCost(75); // 75 kWh
 * console.log(`Estimated cost: £${cost}`);
 *
 * const savings = CostEstimationService.calculateSavings(120, 100);
 * console.log(`Savings: £${savings.costDifference}, Percent Change: ${savings.percentChange}%`);
 * ```
 *
 * ## Notes
 * - The `DEFAULT_PRICE_PER_KWH` value is based on the UK electricity price cap and should be updated as needed.
 * - The service assumes all energy usage is charged at the same rate. For tiered or variable pricing, additional logic would be required.
 * - The `calculateSavings` method handles cases where `previousUsage` is `0` to avoid division by zero errors.
 *
 * ## Dependencies
 * - This service is standalone and does not depend on other services or libraries.
 */

export class CostEstimationService {
  // UK price cap as of March 2025 (update with current value)
  private static readonly DEFAULT_PRICE_PER_KWH = 0.2703; // £/kWh
  
  static estimateCost(energyUsageKwh: number): number {
    return energyUsageKwh * this.DEFAULT_PRICE_PER_KWH;
  }
  
  static calculateSavings(previousUsage: number, currentUsage: number): {
    percentChange: number;
    costDifference: number;
    isSaving: boolean;
  } {
    const percentChange = previousUsage > 0 ? 
      ((currentUsage - previousUsage) / previousUsage) * 100 : 0;
    const costDifference = this.estimateCost(Math.abs(currentUsage - previousUsage));
    
    return {
      percentChange: Math.abs(percentChange),
      costDifference,
      isSaving: currentUsage < previousUsage
    };
  }
}