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