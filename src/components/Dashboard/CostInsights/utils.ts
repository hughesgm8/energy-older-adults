import { DeviceData, DeviceReading, DeviceInsights, DeviceInsightsParams } from "@/types/device";
import { deviceCategorizationService } from "@/services/DeviceCategorizationService";

export function getDeviceInsights(params: DeviceInsightsParams): DeviceInsights {
  const { deviceData, deviceKey, deviceInfo, viewType } = params;
  
  if (deviceData.length === 0) {
    throw new Error('No data available for this time period');
  }
  
  // Get device name in the format used as a key in the readings
  const deviceName = deviceInfo.name.toLowerCase().replace(/\s+/g, '_');
  
  // Calculate total energy consumption
  const totalEnergy = deviceData.reduce((sum, reading) => 
    sum + (typeof reading[deviceName] === 'number' ? reading[deviceName] : 0), 0);
  
  // Count active hours (periods with non-zero consumption)
  const activeHours = deviceData.filter(reading => {
    const value = reading[deviceName];
    return typeof value === 'number' && value > 0;
  }).length;
  
  // Find peak usage hour
  const activeReadings = deviceData.filter(reading => 
    typeof reading[deviceName] === 'number' && reading[deviceName] > 0);
    
  const peakReading = activeReadings.reduce((max, reading) => {
    // Use type assertion or type guard to ensure we're working with a number
    const currentValue = reading[deviceName];
    // Ensure we only compare when it's definitely a number
    if (typeof currentValue === 'number' && currentValue > max.value) {
      return { hour: new Date(reading.timestamp).getHours(), value: currentValue };
    }
    return max;
  }, { hour: 0, value: 0 });
  
  // Get device category from the categorization service
  const deviceCategory = deviceCategorizationService.getDeviceCategory(deviceInfo.name);
  const consumptionType = deviceCategorizationService.getConsumptionType(deviceInfo.name);
  const insightTemplate = deviceCategorizationService.getInsightTemplate(deviceInfo.name);
  
  return {
    totalEnergy,
    activeHours,
    peakHour: peakReading,
    deviceCategory,
    consumptionType,
    insightTemplate
  };
}