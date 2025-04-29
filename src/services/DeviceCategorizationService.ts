// src/services/DeviceCategorizationService.ts

/**
 * # DeviceCategorizationService
 *
 * This service provides methods to categorize devices based on their names, assign them to standardized categories, 
 * and retrieve additional metadata such as consumption type and energy thresholds. It is used throughout the app 
 * to ensure consistent categorization and insights for energy usage data.
 *
 * ## Key Features
 * - **Device Categorization**: Categorizes devices into standardized categories such as `Entertainment`, `Lighting`, and `Kitchen`.
 * - **Thresholds**: Provides default energy consumption thresholds for each category.
 * - **Consumption Type**: Identifies whether a device has `continuous` or `intermittent` energy usage.
 * - **Insight Templates**: Generates category-specific insight messages for devices.
 * - **Fallback Logic**: Attempts to guess the category of unknown devices based on name patterns.
 *
 * ## Standard Categories
 * - `Entertainment`
 * - `Lighting`
 * - `Kitchen`
 * - `Smart Home`
 * - `Heating & Cooling`
 * - `Home Office`
 * - `Unknown`
 *
 * ## Methods
 * - `categorizeDevice(deviceName: string): DeviceInfo`
 *   - Categorizes a device based on its name and returns detailed metadata, including category, consumption type, and threshold.
 * - `getDeviceCategory(deviceName: string): StandardCategory`
 *   - Returns the standardized category for a given device.
 * - `getThresholdForDevice(deviceName: string): number`
 *   - Returns the energy consumption threshold for a given device.
 * - `getConsumptionType(deviceName: string): ConsumptionType`
 *   - Returns whether the device has `continuous` or `intermittent` energy usage.
 * - `getInsightTemplate(deviceName: string): string`
 *   - Returns a pre-defined insight message template for the device's category.
 *
 * ## Data Flow
 * - **Direct Mapping**: Known devices are mapped directly to their categories and metadata using the `deviceMapping` object.
 * - **Fallback Logic**: For unknown devices, the service attempts to guess the category based on name patterns.
 * - **Thresholds**: Default thresholds are defined for each category and applied to devices accordingly.
 *
 * ## Usage
 * ```typescript
 * import { deviceCategorizationService } from '@/services/DeviceCategorizationService';
 *
 * const deviceInfo = deviceCategorizationService.categorizeDevice('TV');
 * console.log(deviceInfo.category); // Output: 'Entertainment'
 *
 * const category = deviceCategorizationService.getDeviceCategory('Microwave');
 * console.log(category); // Output: 'Kitchen'
 *
 * const threshold = deviceCategorizationService.getThresholdForDevice('Fridge');
 * console.log(threshold); // Output: 0.005
 * ```
 *
 * ## Notes
 * - The `deviceMapping` object contains a predefined list of known devices and their metadata.
 * - For unknown devices, the `guessDeviceCategory` method uses name patterns to assign a category.
 * - This service is critical for ensuring consistent categorization and insights across the app.
 *
 * ## Dependencies
 * - **EnergyChart.tsx**: Uses this service to categorize devices and retrieve category-specific colors.
 */

// Define types for device categorization
export type ConsumptionType = 'continuous' | 'intermittent';

// Our standardized categories
export type StandardCategory = 
  | 'Entertainment' 
  | 'Lighting' 
  | 'Kitchen' 
  | 'Smart Home' 
  | 'Heating & Cooling' 
  | 'Home Office' 
  | 'Unknown';

export interface DeviceInfo {
  name: string;
  category: StandardCategory;
  consumptionType: ConsumptionType;
  threshold: number;
}

// Default thresholds based on category
const THRESHOLDS = {
  'Entertainment': 0.004,
  'Lighting': 0.003,
  'Kitchen': 0.005,
  'Smart Home': 0.003,
  'Heating & Cooling': 0.006,
  'Home Office': 0.004,
  'Unknown': 0.005
};

class DeviceCategorizationService {
  // Direct mapping for known devices
  private deviceMapping: Record<string, DeviceInfo> = {
    // Entertainment devices
    'tv': { 
      name: 'TV', 
      category: 'Entertainment', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Entertainment']
    },
    'television': { 
      name: 'Television', 
      category: 'Entertainment', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Entertainment']
    },
    'sonosspeaker': { 
      name: 'Sonos Speaker', 
      category: 'Entertainment', 
      consumptionType: 'continuous',
      threshold: THRESHOLDS['Entertainment']
    },
    'nintendoswitch': { 
      name: 'Nintendo Switch', 
      category: 'Entertainment', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Entertainment']
    },
    // Lighting devices
    'sonoslamp': { 
      name: 'Sonos Lamp', 
      category: 'Lighting', 
      consumptionType: 'continuous',
      threshold: THRESHOLDS['Lighting']
    },
    'bedroomlight': { 
      name: 'Bedroom Light', 
      category: 'Lighting', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Lighting']
    },
    // Kitchen devices
    'microwave': { 
      name: 'Microwave', 
      category: 'Kitchen', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Kitchen']
    },
    'fridge': { 
      name: 'Fridge', 
      category: 'Kitchen', 
      consumptionType: 'continuous',
      threshold: THRESHOLDS['Kitchen']
    },
    // Smart Home devices
    'googlehome': { 
      name: 'Google Home', 
      category: 'Smart Home', 
      consumptionType: 'continuous',
      threshold: THRESHOLDS['Smart Home']
    },
    'alexa': { 
      name: 'Amazon Alexa', 
      category: 'Smart Home', 
      consumptionType: 'continuous',
      threshold: THRESHOLDS['Smart Home']
    },
    // Heating & Cooling devices
    'aircon': { 
      name: 'Air Conditioner', 
      category: 'Heating & Cooling', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Heating & Cooling']
    },
    'heater': { 
      name: 'Heater', 
      category: 'Heating & Cooling', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Heating & Cooling']
    },
    // Home Office devices
    'computer': { 
      name: 'Computer', 
      category: 'Home Office', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Home Office']
    },
    'laptop': { 
      name: 'Laptop', 
      category: 'Home Office', 
      consumptionType: 'intermittent',
      threshold: THRESHOLDS['Home Office']
    }
  };

  constructor() {
    console.log('Device categorization service initialized');
    console.log(`Known devices: ${Object.keys(this.deviceMapping).length}`);
  }

  /**
   * Categorizes a device based on its name
   */
  public categorizeDevice(deviceName: string): DeviceInfo {
    // Normalize device name for lookup
    const normalizedName = deviceName.toLowerCase().replace(/\s+/g, '');
    
    // Try exact match first
    if (this.deviceMapping[normalizedName]) {
      return this.deviceMapping[normalizedName];
    }
    
    // Try partial matches
    for (const [key, device] of Object.entries(this.deviceMapping)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return device;
      }
    }
    
    // Guess based on name patterns
    return this.guessDeviceCategory(deviceName, normalizedName);
  }

  /**
   * Try to guess the device category based on its name
   */
  private guessDeviceCategory(deviceName: string, normalizedName: string): DeviceInfo {
    let category: StandardCategory = 'Unknown';
    let consumptionType: ConsumptionType = 'intermittent';
    
    // Entertainment devices
    if (normalizedName.includes('tv') || 
        normalizedName.includes('television') || 
        normalizedName.includes('console') ||
        normalizedName.includes('gaming') ||
        normalizedName.includes('sound') ||
        normalizedName.includes('speaker') ||
        normalizedName.includes('audio')) {
      category = 'Entertainment';
    }
    
    // Lighting devices
    else if (normalizedName.includes('lamp') || 
             normalizedName.includes('light') || 
             normalizedName.includes('bulb')) {
      category = 'Lighting';
    }
    
    // Kitchen devices
    else if (normalizedName.includes('fridge') || 
             normalizedName.includes('microwave') || 
             normalizedName.includes('oven') ||
             normalizedName.includes('toaster') ||
             normalizedName.includes('kettle') ||
             normalizedName.includes('coffee')) {
      category = 'Kitchen';
    }
    
    // Smart Home devices
    else if (normalizedName.includes('smart') || 
             normalizedName.includes('wifi') || 
             normalizedName.includes('connected') ||
             normalizedName.includes('alexa') ||
             normalizedName.includes('google') ||
             normalizedName.includes('voice') ||
             normalizedName.includes('assistant')) {
      category = 'Smart Home';
      consumptionType = 'continuous';
    }
    
    // Heating & Cooling devices
    else if (normalizedName.includes('heat') || 
             normalizedName.includes('cool') || 
             normalizedName.includes('air') ||
             normalizedName.includes('fan') ||
             normalizedName.includes('thermostat') ||
             normalizedName.includes('climate')) {
      category = 'Heating & Cooling';
    }
    
    // Home Office devices
    else if (normalizedName.includes('computer') || 
             normalizedName.includes('laptop') || 
             normalizedName.includes('monitor') ||
             normalizedName.includes('printer') ||
             normalizedName.includes('router') ||
             normalizedName.includes('modem')) {
      category = 'Home Office';
    }
    
    // Create an info object
    return {
      name: deviceName,
      category: category,
      consumptionType: consumptionType,
      threshold: THRESHOLDS[category]
    };
  }

  /**
   * Get the standardized category for a device
   */
  public getDeviceCategory(deviceName: string): StandardCategory {
    return this.categorizeDevice(deviceName).category;
  }
  
  /**
   * Get the threshold value for a device
   */
  public getThresholdForDevice(deviceName: string): number {
    return this.categorizeDevice(deviceName).threshold;
  }
  
  /**
   * Get the consumption type for a device
   */
  public getConsumptionType(deviceName: string): ConsumptionType {
    return this.categorizeDevice(deviceName).consumptionType;
  }
  
  /**
   * Get insight message template for a device
   * Now simplified to use standardized category-based templates
   */
  public getInsightTemplate(deviceName: string): string {
    const deviceInfo = this.categorizeDevice(deviceName);
    
    const templates: Record<StandardCategory, string> = {
      'Entertainment': `Your ${deviceName} was used for {duration}, consuming {totalEnergy} kWh.`,
      'Lighting': `Your ${deviceName} was on for {duration}, using {totalEnergy} kWh.`,
      'Kitchen': `Your ${deviceName} was active for {duration}, using {totalEnergy} kWh.`,
      'Smart Home': `Your ${deviceName} used {totalEnergy} kWh over {duration}.`,
      'Heating & Cooling': `Your ${deviceName} ran for {duration}, using {totalEnergy} kWh.`,
      'Home Office': `Your ${deviceName} was powered for {duration}, consuming {totalEnergy} kWh.`,
      'Unknown': `This device was used for {duration}, consuming {totalEnergy} kWh.`
    };
    
    return templates[deviceInfo.category];
  }
}

// Export as singleton
export const deviceCategorizationService = new DeviceCategorizationService();