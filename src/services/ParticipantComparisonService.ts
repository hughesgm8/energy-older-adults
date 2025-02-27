// src/services/ParticipantComparisonService.ts
import { DeviceDataResponse } from '../types/device';

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
    // Create mock data for participants P1, P2, P3
    this.mockParticipantData = {
      'P1': {
        'TV': {
          name: 'TV',
          hourly: {
            data: this.generateMockHourlyData(0.15, 0.05), // Higher TV usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'SonosLamp': {
          name: 'SonosLamp',
          hourly: {
            data: this.generateMockHourlyData(0.003, 0.001), // Lower lamp usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'Switch': {
          name: 'Switch',
          hourly: {
            data: this.generateMockHourlyData(0.006, 0.002), // Similar Switch usage
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
        }
        // No Switch for this participant
      },
      'P3': {
        'TV': {
          name: 'TV',
          hourly: {
            data: this.generateMockHourlyData(0.12, 0.04), // Medium TV usage
            timestamps: this.generateTimestamps(168)
          }
        },
        'Switch': {
          name: 'Switch',
          hourly: {
            data: this.generateMockHourlyData(0.012, 0.004), // Higher Switch usage
            timestamps: this.generateTimestamps(168)
          }
        }
        // No Sonos for this participant
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
  
  // This is the main method that will be called from the Dashboard component
  public async getComparisons(
    currentParticipantId: string, 
    currentDeviceData: DeviceDataResponse, 
    timeRange: { start: Date, end: Date },
    viewType: 'day' | 'week'
  ): Promise<ComparisonResult[]> {
    // Get all participants' data
    const allParticipantsData = await this.fetchAllParticipantsData();
    
    // Initialize results array
    const results: ComparisonResult[] = [];
    
    // Process each device for the current participant
    for (const [deviceKey, deviceInfo] of Object.entries(currentDeviceData)) {
      // Calculate current participant's total usage for this device
      const yourUsage = this.calculateTotalUsage(
        deviceInfo, 
        timeRange.start,
        timeRange.end
      );
      
      // Find all other participants who have the same device
      const otherParticipantsWithDevice: {id: string, usage: number}[] = [];
      
      for (const [participantId, participantData] of Object.entries(allParticipantsData)) {
        // Skip current participant
        if (participantId === currentParticipantId) continue;
        
        // Check if this participant has the same device
        if (participantData[deviceKey]) {
          const usage = this.calculateTotalUsage(
            participantData[deviceKey],
            timeRange.start,
            timeRange.end
          );
          
          otherParticipantsWithDevice.push({
            id: participantId,
            usage
          });
        }
      }
      
      // Only generate comparison if at least one other participant has this device
      if (otherParticipantsWithDevice.length > 0) {
        // Calculate average usage among other participants
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
  
  private calculateTotalUsage(
    deviceInfo: any, 
    startDate: Date, 
    endDate: Date
  ): number {
    // In a real implementation, we would filter by date range
    // For the mock implementation, we'll just sum everything
    return deviceInfo.hourly.data.reduce((sum: number, value: number) => sum + value, 0);
  }
}

// Export as singleton
export const participantComparisonService = new ParticipantComparisonService();