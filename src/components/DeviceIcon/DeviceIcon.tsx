import React from 'react';
import { 
  Tv, 
  Lightbulb, 
  Refrigerator, 
  AirVent, 
  Thermometer, 
  Coffee, 
  Monitor, 
  Speaker, 
  Plug, 
  LucideProps 
} from 'lucide-react';

interface DeviceIconProps extends LucideProps {
  deviceName: string;
}

export function DeviceIcon({ deviceName, ...props }: DeviceIconProps) {
  // Convert deviceName to lowercase for case-insensitive matching
  const name = deviceName.toLowerCase();
  
  if (name.includes('tv') || name.includes('television')) {
    return <Tv {...props} />;
  } else if (name.includes('light') || name.includes('lamp')) {
    return <Lightbulb {...props} />;
  } else if (name.includes('fridge') || name.includes('refrigerator')) {
    return <Refrigerator {...props} />;
  } else if (name.includes('air') || name.includes('fan')) {
    return <AirVent {...props} />;
  } else if (name.includes('heat') || name.includes('radiator')) {
    return <Thermometer {...props} />;
  } else if (name.includes('coffee') || name.includes('kettle')) {
    return <Coffee {...props} />;
  } else if (name.includes('monitor') || name.includes('computer') || name.includes('pc')) {
    return <Monitor {...props} />;
  } else if (name.includes('speaker') || name.includes('audio') || name.includes('stereo')) {
    return <Speaker {...props} />;
  }
  
  // Default icon for other devices
  return <Plug {...props} />;
}