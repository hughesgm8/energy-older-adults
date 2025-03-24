import { DeviceDataResponse } from '../types/device';

/**
 * Generates realistic mock data for energy devices
 * @param days Number of days to generate data for (default: 7)
 * @returns Mock device data in the format expected by the dashboard
 */
export function generateMockDeviceData(days = 7): DeviceDataResponse {
  return {
    // Existing devices from your dataset
    // ... 
    
    // New fake devices
    'living_room_light': {
      name: 'Living Room Light',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateLightData(0.01, 'evening') // 10W bulb, evening pattern
      }
    },
    'bedroom_light': {
      name: 'Bedroom Light',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateLightData(0.01, 'evening') 
      }
    },
    'kitchen_light': {
      name: 'Kitchen Light',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateLightData(0.012, 'morning_evening') // 12W, morning and evening
      }
    },
    'bathroom_light': {
      name: 'Bathroom Light',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateLightData(0.009, 'intermittent') // 9W, intermittent use
      }
    },
    'hallway_light': {
      name: 'Hallway Light',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateLightData(0.008, 'evening') // 8W, evening use
      }
    },
    'space_heater': {
      name: 'Space Heater',
      hourly: {
        timestamps: generateTimestamps(days), 
        data: generateHeaterData(1.2) // 1.2kW heater
      }
    },
    'electric_kettle': {
      name: 'Electric Kettle',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateKettleData(2) // 2kW kettle
      }
    },
    'coffee_maker': {
      name: 'Coffee Maker',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateCoffeeMakerData(0.9) // 900W coffee maker
      }
    },
    'microwave': {
      name: 'Microwave',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateMicrowaveData(1) // 1kW microwave
      }
    },
    'toaster': {
      name: 'Toaster',
      hourly: {
        timestamps: generateTimestamps(days),
        data: generateToasterData(1.1) // 1.1kW toaster
      }
    }
  };
}

// Helper functions for generating data patterns

function generateTimestamps(days = 7): string[] {
  const timestamps = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h++) {
      const timestamp = new Date(startDate);
      timestamp.setDate(startDate.getDate() + d);
      timestamp.setHours(h);
      timestamps.push(timestamp.toISOString());
    }
  }
  
  return timestamps;
}

function generateLightData(power: number, pattern: 'evening' | 'morning_evening' | 'intermittent'): number[] {
  const data = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      let usage = 0;
      
      if (pattern === 'evening' && h >= 17 && h <= 23) {
        // Evening usage (5pm-11pm)
        usage = Math.random() > 0.3 ? power : 0;
      } else if (pattern === 'morning_evening' && (h >= 6 && h <= 9 || h >= 17 && h <= 22)) {
        // Morning (6am-9am) and evening (5pm-10pm)
        usage = Math.random() > 0.4 ? power : 0;
      } else if (pattern === 'intermittent') {
        // Random usage throughout the day with higher probability in evening
        if (h >= 17 && h <= 23) {
          usage = Math.random() > 0.6 ? power : 0;
        } else {
          usage = Math.random() > 0.85 ? power : 0;
        }
      } else {
        // Some random usage at other times
        usage = Math.random() > 0.95 ? power : 0;
      }
      
      // Add some randomness (±20%)
      if (usage > 0) {
        usage *= (0.8 + Math.random() * 0.4);
      }
      
      data.push(usage);
    }
  }
  return data;
}

function generateHeaterData(power: number): number[] {
  const data = [];
  for (let d = 0; d < 7; d++) {
    // Weekend vs weekday pattern
    const isWeekend = d % 7 >= 5;
    
    for (let h = 0; h < 24; h++) {
      let usage = 0;
      
      if (isWeekend) {
        // Weekend pattern: longer use throughout day
        if (h >= 9 && h <= 22) {
          usage = Math.random() > 0.7 ? power : 0;
        }
      } else {
        // Weekday pattern: morning and evening
        if ((h >= 6 && h <= 9) || (h >= 17 && h <= 22)) {
          usage = Math.random() > 0.6 ? power : 0;
        }
      }
      
      // Add some variation
      if (usage > 0) {
        // Heaters cycle on and off, so we'll simulate duty cycle
        usage *= (0.3 + Math.random() * 0.7);
      }
      
      data.push(usage);
    }
  }
  return data;
}

function generateKettleData(power: number): number[] {
  const data = [];
  for (let d = 0; d < 7; d++) {
    const isWeekend = d % 7 >= 5;
    
    for (let h = 0; h < 24; h++) {
      let usage = 0;
      
      // Kettle is used briefly a few times per day
      // Morning peak (7-9am)
      if (h >= 7 && h <= 9) {
        // 50% chance of use in morning hours
        if (Math.random() > 0.5) {
          // Active for ~3 minutes = 0.05 hours
          usage = power * 0.05;
        }
      } 
      // Afternoon use (2-5pm)
      else if (h >= 14 && h <= 17) {
        // 30% chance of use in afternoon
        if (Math.random() > 0.7) {
          usage = power * 0.05;
        }
      }
      // Evening use (7-9pm)
      else if (h >= 19 && h <= 21) {
        // 40% chance of evening use
        if (Math.random() > 0.6) {
          usage = power * 0.05;
        }
      }
      
      data.push(usage);
    }
  }
  return data;
}

function generateCoffeeMakerData(power: number): number[] {
  const data = [];
  for (let d = 0; d < 7; d++) {
    const isWeekend = d % 7 >= 5;
    
    for (let h = 0; h < 24; h++) {
      let usage = 0;
      
      // Coffee maker primarily used in morning
      if (isWeekend && h >= 8 && h <= 11) {
        // Weekend mornings - 60% chance of use
        if (Math.random() > 0.4) {
          // Active for ~10 minutes = 0.17 hours
          usage = power * 0.17;
        }
      } else if (!isWeekend && h >= 6 && h <= 8) {
        // Weekday mornings - 80% chance of use (earlier)
        if (Math.random() > 0.2) {
          usage = power * 0.17;
        }
      } else if (h >= 14 && h <= 15) {
        // Afternoon coffee - 20% chance
        if (Math.random() > 0.8) {
          usage = power * 0.17;
        }
      }
      
      data.push(usage);
    }
  }
  return data;
}

function generateMicrowaveData(power: number): number[] {
  const data = [];
  for (let d = 0; d < 7; d++) {
    const isWeekend = d % 7 >= 5;
    
    for (let h = 0; h < 24; h++) {
      let usage = 0;
      
      // Microwave usage around meal times
      // Breakfast (7-9am)
      if (h >= 7 && h <= 9) {
        if (Math.random() > 0.7) {
          // Active for ~2 minutes = 0.033 hours
          usage = power * 0.033;
        }
      } 
      // Lunch (12-2pm)
      else if (h >= 12 && h <= 14) {
        if (Math.random() > 0.5) {
          // Active for ~3 minutes = 0.05 hours
          usage = power * 0.05;
        }
      }
      // Dinner (6-8pm)
      else if (h >= 18 && h <= 20) {
        if (Math.random() > 0.4) {
          // Active for ~4 minutes = 0.067 hours
          usage = power * 0.067;
        }
      }
      // Late night snack (10-11pm)
      else if (h >= 22 && h <= 23) {
        if (Math.random() > 0.8) {
          usage = power * 0.033;
        }
      }
      
      data.push(usage);
    }
  }
  return data;
}

function generateToasterData(power: number): number[] {
  const data = [];
  for (let d = 0; d < 7; d++) {
    const isWeekend = d % 7 >= 5;
    
    for (let h = 0; h < 24; h++) {
      let usage = 0;
      
      // Toaster primarily used for breakfast
      if (isWeekend && h >= 8 && h <= 11) {
        // Weekend breakfast - later and more likely
        if (Math.random() > 0.4) {
          // Active for ~3 minutes = 0.05 hours
          usage = power * 0.05;
        }
      } else if (!isWeekend && h >= 6 && h <= 8) {
        // Weekday breakfast - earlier
        if (Math.random() > 0.5) {
          usage = power * 0.05;
        }
      }
      
      data.push(usage);
    }
  }
  return data;
}