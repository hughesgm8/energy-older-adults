/**
 * # Device Types
 *
 * This file defines TypeScript interfaces and types used throughout the application to represent device-related data. 
 * These types ensure consistency and type safety when working with energy usage data, device metadata, and insights.
 *
 * ## Key Interfaces
 * - **DeviceInfo**:
 *   - Represents metadata and hourly energy readings for a single device.
 * - **DeviceData**:
 *   - Represents the structure of raw device data, including energy readings and timestamps.
 * - **DeviceDataResponse**:
 *   - A mapping of device keys to their corresponding `DeviceData`.
 * - **DeviceReading**:
 *   - Represents a single timestamped reading for one or more devices.
 * - **DeviceInsightsParams**:
 *   - Parameters required to calculate insights for a specific device.
 * - **DeviceInsights**:
 *   - Represents calculated insights for a device, such as total energy, active hours, and peak usage.
 * - **CategoryReading**:
 *   - Represents aggregated energy usage data for a category of devices.
 * - **TimeRange**:
 *   - Represents a start and end date for a time range.
 * - **CategoryComparison**:
 *   - Represents comparison metrics for a category, including current usage, historical average, and percentage change.
 *
 * ## How Types Work in TypeScript
 * - **Interfaces**:
 *   - Define the shape of an object, specifying its properties and their types.
 *   - Example: 
 *     ```typescript
 *     interface DeviceInfo {
 *       name: string;
 *       hourly: {
 *         data: number[];
 *         timestamps: string[];
 *       };
 *     }
 *     ```
 * - **Type Safety**:
 *   - TypeScript ensures that variables and function parameters conform to the defined types, reducing runtime errors.
 * - **Dynamic Keys**:
 *   - Interfaces like `DeviceDataResponse` and `DeviceReading` use dynamic keys (`[key: string]`) to allow flexibility in representing data.
 *
 * ## Usage
 * These types are used throughout the application to ensure consistency when working with device data and insights. 
 * For example:
 * ```typescript
 * const deviceInfo: DeviceInfo = {
 *   name: "Refrigerator",
 *   hourly: {
 *     data: [0.5, 0.6, 0.7],
 *     timestamps: ["2025-04-29T00:00:00Z", "2025-04-29T01:00:00Z", "2025-04-29T02:00:00Z"]
 *   }
 * };
 * ```
 *
 * ## Notes
 * - These types are critical for maintaining type safety and consistency across the application.
 * - TypeScript's type system helps catch errors during development, improving code reliability and maintainability.
 */

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

export interface CategoryComparison {
    current: number;
    average: number;
    percentChange: number;
  }