// src/services/ParticipantComparisonService.ts
import { DeviceDataResponse } from '../types/device';
import { TimeRange, ViewType } from '../types/views';

export interface ComparisonResult {
  deviceName: string;
  yourUsage: number;
  averageUsage: number;
  percentDifference: number;
  isLowerThanAverage: boolean;
}

class ParticipantComparisonService {
  private mockParticipantData: Record<string, DeviceDataResponse> = {
    // We'll populate this with mock data for testing
  };
  
  private async fetchAllParticipantsData(): Promise<Record<string, DeviceDataResponse>> {
    try {
      // In a real implementation, this would make API calls to get all participants' data
      // For now, use mock data
      if (Object.keys(this.mockParticipantData).length === 0) {
        this.initializeMockData();
      }
      
      return this.mockParticipantData;
    } catch (error) {
      console.error('Error fetching all participants data:', error);
      return {};
    }
  }
  
  private initializeMockData() {
    // Create mock data for participants P0, P1, P2, P3
    // For P0 we'll make some devices higher usage and some lower
    this.mockParticipantData = {
      'P0': {
        'TV': {
          name: 'TV',
          hourly: {
            data: this.generateMockHourlyData(0.12, 0.04), // Higher than average
            timestamps: this.generateTimestamps(168)
          }
        },
        'SonosLamp': {
          name: 'SonosLamp',
          hourly: {
            data: this.generateMockHourlyData(0.004, 0.002), // Lower than average
            timestamps: this.generateTimestamps(168)
          }
        },
        'Switch': {
          name: 'Switch',
          hourly: {
            data: this.generateMockHourlyData(0.008, 0.003), // Higher than average
            timestamps: this.generateTimestamps(168)
          }
        }
      },
      'P1': {
        'TV': {
          name: 'TV',
          hourly: {
            data: this.generateMockHourlyData(0.09, 0.03), // Lower TV usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'SonosLamp': {
          name: 'SonosLamp',
          hourly: {
            data: this.generateMockHourlyData(0.006, 0.002), // Higher lamp usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'Switch': {
          name: 'Switch',
          hourly: {
            data: this.generateMockHourlyData(0.005, 0.002), // Lower Switch usage
            timestamps: this.generateTimestamps(168)
          }
        }
      },
      'P2': {
        'TV': {
          name: 'TV',
          hourly: {
            data: this.generateMockHourlyData(0.08, 0.02), // Lower TV usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'SonosLamp': {
          name: 'SonosLamp',
          hourly: {
            data: this.generateMockHourlyData(0.007, 0.002), // Higher lamp usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'Switch': {
          name: 'Switch',
          hourly: {
            data: this.generateMockHourlyData(0.007, 0.003), // Similar Switch usage
            timestamps: this.generateTimestamps(168)
          }
        }
      },
      'P3': {
        'TV': {
          name: 'TV',
          hourly: {
            data: this.generateMockHourlyData(0.14, 0.05), // Higher TV usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'SonosLamp': {
          name: 'SonosLamp',
          hourly: {
            data: this.generateMockHourlyData(0.009, 0.003), // Highest lamp usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'Switch': {
          name: 'Switch',
          hourly: {
            data: this.generateMockHourlyData(0.006, 0.002), // Medium Switch usage
            timestamps: this.generateTimestamps(168)
          }
        }
      }
    };
  }
  
  // Helper to generate realistic looking timestamps for the last week
  private generateTimestamps(hours: number): string[] {
    const timestamps: string[] = [];
    const now = new Date();
    
    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - i);
      timestamps.push(timestamp.toISOString());
    }
    
    return timestamps;
  }
  
  // Helper to generate mock hourly data with some variation
  private generateMockHourlyData(baseValue: number, variance: number): number[] {
    const data: number[] = [];
    
    for (let i = 0; i < 168; i++) { // 168 hours in a week
      // Create usage patterns - higher in evenings, weekends, etc.
      const hour = i % 24;
      const day = Math.floor(i / 24);
      const isWeekend = day === 0 || day === 6; // Sunday or Saturday
      const isEvening = hour >= 18 && hour <= 22;
      
      let multiplier = 1.0;
      if (isWeekend) multiplier *= 1.5;
      if (isEvening) multiplier *= 1.8;
      
      // Add some randomness
      const value = baseValue * multiplier + (Math.random() * variance * 2 - variance);
      data.push(Math.max(0, value)); // Ensure no negative values
    }
    
    return data;
  }
  
  public async getComparisons(
    currentParticipantId: string, 
    currentDeviceData: DeviceDataResponse, 
    timeRange: TimeRange,
    viewType: ViewType
  ): Promise<ComparisonResult[]> {
    // For the study prototype, we'll use the mock data
    // Initialize mock data if it hasn't been done yet
    if (Object.keys(this.mockParticipantData).length === 0) {
      this.initializeMockData();
    }
    
    const results: ComparisonResult[] = [];
    
    // Calculate the total usage for the current participant
    // and compare it with the average of other participants
    for (const [deviceKey, deviceInfo] of Object.entries(currentDeviceData)) {
      // Get usage for the current device
      let yourUsage = 0;
      const hourlyData = deviceInfo.hourly.data;
      for (let i = 0; i < hourlyData.length; i++) {
        yourUsage += hourlyData[i];
      }
      
      // Scale down usage based on time range for more realistic numbers
      // (mock data is for a full week)
      if (viewType === 'day') {
        yourUsage = yourUsage / 7; // Approximate daily average
        
        // Add some random variation day to day (±20%)
        const dailyVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        yourUsage *= dailyVariation;
      }
      
      // Get usage for other participants with the same device
      const otherParticipantsWithDevice: Array<{id: string, usage: number}> = [];
      
      for (const [participantId, deviceData] of Object.entries(this.mockParticipantData)) {
        // Skip the current participant
        if (participantId === currentParticipantId) continue;
        
        // Check if this participant has the same device
        const deviceData2 = deviceData[deviceKey];
        if (deviceData2) {
          let usage = 0;
          const hourlyData = deviceData2.hourly.data;
          for (let i = 0; i < hourlyData.length; i++) {
            usage += hourlyData[i];
          }
          
          // Scale down for daily view
          if (viewType === 'day') {
            usage = usage / 7;
            const dailyVariation = 0.8 + Math.random() * 0.4;
            usage *= dailyVariation;
          }
          
          otherParticipantsWithDevice.push({
            id: participantId,
            usage
          });
        }
      }
      
      // Calculate average usage
      if (otherParticipantsWithDevice.length > 0) {
        const totalOtherUsage = otherParticipantsWithDevice.reduce(
          (sum, p) => sum + p.usage, 0
        );
        const averageUsage = totalOtherUsage / otherParticipantsWithDevice.length;
        
        // Calculate percentage difference
        let percentDifference = 0;
        if (averageUsage > 0) {
          percentDifference = ((yourUsage - averageUsage) / averageUsage) * 100;
        }
        
        results.push({
          deviceName: deviceInfo.name,
          yourUsage,
          averageUsage,
          percentDifference,
          isLowerThanAverage: yourUsage < averageUsage
        });
      }
    }
    
    return results;
  }
}

// Export as singleton
export const participantComparisonService = new ParticipantComparisonService();