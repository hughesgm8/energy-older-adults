import { ViewType } from './views';

export interface DeviceInfo {
  device_id: string;
  name: string;
  type: string;
  model: string;
  device_info: {
    name: string;
  };
  hourly: {
    data: number[];
  };
}

export interface DeviceData {
  device_info: DeviceInfo;
  hourly: {
    data: number[];
    time_stamp: string;
  };
  daily: {
    data: number[];
    time_stamp: string;
  };
}

export interface DeviceDataResponse {
  [deviceKey: string]: DeviceInfo;
}

export interface DeviceReading {
    timestamp: Date;
    [deviceName: string]: number | Date;
  }

  export interface DeviceInsightsParams {
    deviceData: DeviceReading[];
    deviceKey: string;
    deviceInfo: DeviceInfo;
    viewType: ViewType;
  }

export interface DeviceInsights {
    totalEnergy: number;
    activeHours: number;
    peakHour: { 
        hour: number; 
        value: number };
}