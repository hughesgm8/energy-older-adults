/**
 * # DeviceIcon Component
 *
 * The `DeviceIcon` component dynamically renders an appropriate icon based on the provided device name. 
 * It uses icons from the `lucide-react` library to visually represent different types of devices.
 *
 * ## Key Features
 * - **Dynamic Icon Matching**:
 *   - Matches the `deviceName` prop to a corresponding icon (e.g., TV, Lightbulb, Refrigerator).
 *   - Performs case-insensitive matching for flexibility.
 * - **Default Icon**:
 *   - Displays a generic plug icon if no specific match is found.
 * - **Customizable Props**:
 *   - Extends `LucideProps` to allow customization of icon properties (e.g., size, color).
 *
 * ## Props
 * - `deviceName: string`
 *   - The name of the device to determine which icon to display.
 * - `...props: LucideProps`
 *   - Additional properties passed to the rendered icon (e.g., `size`, `color`).
 *
 * ## Usage
 * ```tsx
 * <DeviceIcon deviceName="Television" size={24} color="blue" />
 * <DeviceIcon deviceName="Refrigerator" size={32} />
 * <DeviceIcon deviceName="Unknown Device" />
 * ```
 *
 * ## Notes
 * - This component is used throughout the application to provide consistent visual representations of devices.
 * - The default icon (`Plug`) ensures that all devices are represented, even if they don't match a predefined category.
 *
 * ## Dependencies
 * - **lucide-react**: Provides the icons used in this component.
 */

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