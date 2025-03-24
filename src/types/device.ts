import { ViewType } from './views';

export interface DeviceInfo {
    name: string;      // Extracted from folder name before '_'
    hourly: {
        data: number[];  // Array of hourly energy readings
        timestamps: string[];  // Array of corresponding timestamps
    };
}

export interface DeviceData {
    name: string;
    hourly: {
        data: number[];
        timestamps: string[];
    };
}

export interface DeviceDataResponse {
    [deviceKey: string]: DeviceData;
}

export interface DeviceReading {
    timestamp: Date;
    [deviceKey: string]: Date | number;  // Allow for dynamic device readings
}

export interface DeviceInsightsParams {
    deviceData: DeviceReading[];
    deviceKey: string;
    deviceInfo: DeviceData;
    viewType: ViewType;
}

export interface DeviceInsights {
    totalEnergy: number;
    activeHours: number;
    peakHour: { 
        hour: number; 
        value: number 
    };
    deviceCategory: string;
    consumptionType: string;
    insightTemplate: string;
}

export interface CategoryReading {
    category: string;
    value: number;
    deviceCount: number;
  }

export interface TimeRange {
    start: Date;
    end: Date;
}