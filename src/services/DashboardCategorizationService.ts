// src/services/DeviceCategorizationService.ts
import Papa from 'papaparse';
import { DeviceInfo } from '../types/device';

// Define types for device categorization
export type ConsumptionType = 'continuous' | 'intermittent';

export interface DeviceCategory {
  name: string;
  category: string;
  consumptionType: ConsumptionType;
  insightTemplate: string;
}

interface CategorizedDevice extends DeviceCategory {
  thresholdValue: number;
}

interface DeviceCategorization {
  [deviceIdentifier: string]: CategorizedDevice;
}

// Default thresholds based on consumption type
const DEFAULT_THRESHOLDS = {
  continuous: 0.003, // For always-on smart devices (like Sonos)
  intermittent: 0.01, // For devices that only use energy when active (like toasters)
  entertainment: 0.01, // For TVs, game consoles, etc.
  lighting: 0.003, // For lamps and lights
  kitchen: 0.02, // For kitchen appliances (higher power)
  default: 0.005 // Fallback
};

class DeviceCategorizationService {
  private categorizations: DeviceCategorization = {};
  private isInitialized = false;

  // Initialize with hardcoded defaults in case CSV loading fails
  private defaultCategorizations: DeviceCategorization = {
    'tv': {
      name: 'TV',
      category: 'Entertainment',
      consumptionType: 'intermittent',
      insightTemplate: 'Your TV was active for {duration}, consuming {totalEnergy} kWh.',
      thresholdValue: DEFAULT_THRESHOLDS.entertainment
    },
    'sonoslamp': {
      name: 'Sonos Lamp',
      category: 'Smart Lighting',
      consumptionType: 'continuous',
      insightTemplate: 'Your Sonos lamp was used for {duration}, with standby power always present.',
      thresholdValue: DEFAULT_THRESHOLDS.lighting
    },
    'switch': {
      name: 'Nintendo Switch',
      category: 'Entertainment',
      consumptionType: 'intermittent',
      insightTemplate: 'Your gaming device was used for {duration}, with peak usage at {peakHour}.',
      thresholdValue: DEFAULT_THRESHOLDS.entertainment
    }
  };

  constructor() {
    this.initializeDefaultCategorizations();
    this.loadCategorizationsFromCSV();
  }

  private initializeDefaultCategorizations() {
    this.categorizations = {...this.defaultCategorizations};
    this.isInitialized = true;
  }

  public async loadCategorizationsFromCSV() {
    try {
      const response = await fetch('/src/services/Energy Device Categorizations.csv');
      if (!response.ok) {
        console.warn('Failed to fetch device categorizations CSV, using defaults');
        return;
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const categories: DeviceCategorization = {};
          
          results.data.forEach((row: any) => {
            if (row.Device) {
              const deviceKey = row.Device.toLowerCase().replace(/\s+/g, '');
              const consumptionType = row['Consumption Type']?.toLowerCase() as ConsumptionType;
              
              // Determine threshold based on category and consumption type
              let threshold = DEFAULT_THRESHOLDS.default;
              if (consumptionType === 'continuous') {
                threshold = DEFAULT_THRESHOLDS.continuous;
              } else if (consumptionType === 'intermittent') {
                if (row.Category?.toLowerCase().includes('entertainment')) {
                  threshold = DEFAULT_THRESHOLDS.entertainment;
                } else if (row.Category?.toLowerCase().includes('kitchen')) {
                  threshold = DEFAULT_THRESHOLDS.kitchen;
                } else if (row.Category?.toLowerCase().includes('light')) {
                  threshold = DEFAULT_THRESHOLDS.lighting;
                } else {
                  threshold = DEFAULT_THRESHOLDS.intermittent;
                }
              }
              
              categories[deviceKey] = {
                name: row.Device,
                category: row.Category || 'Unknown',
                consumptionType: consumptionType || 'intermittent',
                insightTemplate: row['Insight Template'] || `Your ${row.Device} was used for {duration}.`,
                thresholdValue: threshold
              };
            }
          });
          
          // Merge with defaults, giving priority to CSV data
          this.categorizations = { ...this.defaultCategorizations, ...categories };
          console.log('Device categorizations loaded:', Object.keys(this.categorizations).length);
        },
        error: (error: any) => {
          console.error('Error parsing device categorizations CSV:', error);
        }
      });
    } catch (error) {
      console.error('Failed to load device categorizations:', error);
    }
  }

  public getDeviceCategory(deviceName: string): CategorizedDevice {
    if (!this.isInitialized) {
      this.initializeDefaultCategorizations();
    }
    
    // Normalize device name for lookup
    const normalizedName = deviceName.toLowerCase().replace(/\s+/g, '');
    
    // Try exact match first
    if (this.categorizations[normalizedName]) {
      return this.categorizations[normalizedName];
    }
    
    // Try partial matches
    for (const [key, category] of Object.entries(this.categorizations)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return category;
      }
    }
    
    // Apply heuristics to guess the device type if no match
    let category = 'Appliance';
    let consumptionType: ConsumptionType = 'intermittent';
    let threshold = DEFAULT_THRESHOLDS.default;
    
    // Check for common device type indicators in the name
    if (normalizedName.includes('tv') || 
        normalizedName.includes('television') || 
        normalizedName.includes('console') ||
        normalizedName.includes('gaming')) {
      category = 'Entertainment';
      threshold = DEFAULT_THRESHOLDS.entertainment;
    } else if (normalizedName.includes('lamp') || 
               normalizedName.includes('light') || 
               normalizedName.includes('bulb')) {
      category = 'Lighting';
      threshold = DEFAULT_THRESHOLDS.lighting;
    } else if (normalizedName.includes('fridge') || 
               normalizedName.includes('microwave') || 
               normalizedName.includes('oven') ||
               normalizedName.includes('toaster')) {
      category = 'Kitchen';
      threshold = DEFAULT_THRESHOLDS.kitchen;
    }
    
    // Check if it might be a smart device by name
    if (normalizedName.includes('smart') || 
        normalizedName.includes('wifi') || 
        normalizedName.includes('connected') ||
        normalizedName.includes('sonos') ||
        normalizedName.includes('alexa') ||
        normalizedName.includes('google')) {
      category = 'Smart Home';
      consumptionType = 'continuous';
      threshold = DEFAULT_THRESHOLDS.continuous;
    }
    
    // Create a fallback category
    return {
      name: deviceName,
      category: category,
      consumptionType: consumptionType,
      insightTemplate: `Your ${deviceName} was used for {duration}, consuming {totalEnergy} kWh.`,
      thresholdValue: threshold
    };
  }

  public getThresholdForDevice(deviceName: string): number {
    return this.getDeviceCategory(deviceName).thresholdValue;
  }
  
  public getInsightTemplate(deviceName: string): string {
    return this.getDeviceCategory(deviceName).insightTemplate;
  }
  
  public getConsumptionType(deviceName: string): ConsumptionType {
    return this.getDeviceCategory(deviceName).consumptionType;
  }
  
  public getDeviceCategory2(deviceName: string): string {
    return this.getDeviceCategory(deviceName).category;
  }
}

// Export as singleton
export const deviceCategorizationService = new DeviceCategorizationService();