"""P110 and P115 Example"""

import asyncio
import os
from datetime import datetime
import json
from typing import Dict, Any

from tapo import ApiClient
from tapo.requests import EnergyDataInterval
from dotenv import load_dotenv

import random
from datetime import datetime, timedelta
from async_timeout import timeout

load_dotenv()

USE_MOCK_DATA = os.getenv('USE_MOCK_DATA', 'false').lower() == 'true'

# Add mock data constants
MOCK_DEVICE_NAMES = {
    "device1": "Sonos Lamp",
    "device2": "Nintendo Switch",
    "device3": "Living Room TV"
}

DEVICE_PATTERNS = {
    "device1": {  # Sonos Lamp
        "base_load": 0.02,
        "peak_hours": [(18, 23)],  # Evening usage
        "peak_multiplier": 3,
        "weekend_multiplier": 1.2
    },
    "device2": {  # Nintendo Switch
        "base_load": 0.015,
        "peak_hours": [(14, 22)],  # Afternoon/evening gaming
        "peak_multiplier": 4,
        "weekend_multiplier": 1.5
    },
    "device3": {  # Living Room TV
        "base_load": 0.05,
        "peak_hours": [(7, 9), (18, 23)],  # Morning and evening TV
        "peak_multiplier": 2.5,
        "weekend_multiplier": 1.3
    }
}

def generate_mock_hourly_data(device_id: str, date: datetime) -> list:
    pattern = DEVICE_PATTERNS.get(device_id, {
        "base_load": 0.02,
        "peak_hours": [(9, 21)],
        "peak_multiplier": 2,
        "weekend_multiplier": 1.1
    })
    
    is_weekend = date.weekday() >= 5
    hourly_data = []
    
    for hour in range(24):
        # Base load with some randomness
        consumption = pattern["base_load"] * (0.8 + random.random() * 0.4)
        
        # Check if current hour is in peak hours
        for start, end in pattern["peak_hours"]:
            if start <= hour < end:
                consumption *= pattern["peak_multiplier"]
                # Add more variation during peak hours
                consumption *= (0.7 + random.random() * 0.6)
        
        # Weekend adjustment
        if is_weekend:
            consumption *= pattern["weekend_multiplier"]
        
        hourly_data.append(round(consumption, 3))
    
    return hourly_data

def generate_mock_daily_data(device_id: str, start_date: datetime, days: int = 30) -> list:
    daily_data = []
    current_date = start_date
    
    for _ in range(days):
        # Sum up hourly data for the day
        daily_sum = sum(generate_mock_hourly_data(device_id, current_date))
        # Add some day-to-day variation
        daily_sum *= (0.9 + random.random() * 0.2)
        daily_data.append(round(daily_sum, 3))
        current_date += timedelta(days=1)
    
    return daily_data

def get_mock_device_data(device_id: str) -> Dict[str, Any]:
    return {
        "device_info": {
            "device_id": device_id,
            "name": MOCK_DEVICE_NAMES.get(device_id, f"Device {device_id}"),
            "type": "SMART.TAPOPLUG",
            "model": "P110",
        },
        "hourly": {
            "data": generate_mock_hourly_data(device_id, datetime.now()),
            "time_stamp": datetime.now().isoformat(),
        },
        "daily": {
            "data": generate_mock_daily_data(device_id, datetime.now() - timedelta(days=29)),
            "time_stamp": datetime.now().isoformat(),
        },
    }

async def fetch_device_data(client, ip_address, device_id: str) -> Dict[str, Any]:
    
    if USE_MOCK_DATA:
        return get_mock_device_data(device_id)
    
    try:
        async with timeout (4):
            device = await client.p110(ip_address)
            today = datetime.today()
            
            # Try to get real device info
            device_info = await device.get_device_info()
            energy_data_hourly = await device.get_energy_data(EnergyDataInterval.Hourly, today)
            energy_data_daily = await device.get_energy_data(
                EnergyDataInterval.Daily,
                datetime(today.year, get_quarter_start_month(today), 1),
            )
            
            return {
                "device_info": device_info.to_dict(),
                "hourly": energy_data_hourly.to_dict(),
                "daily": energy_data_daily.to_dict(),
            }
    

    except (asyncio.TimeoutError, Exception) as e:
        # Log to stderr instead of stdout
        import sys
        print(f"Could not fetch real device data: {e}. Using mock data.", file=sys.stderr)
        return get_mock_device_data(device_id)

async def main():
    tapo_username = os.getenv("TAPO_USERNAME")
    tapo_password = os.getenv("TAPO_PASSWORD")
    ip_address_device1 = os.getenv("IP_ADDRESS_SONOS")
    ip_address_device2 = os.getenv("IP_ADDRESS_NINTENDO")
    ip_address_device3 = os.getenv("IP_ADDRESS_TV")

    if not all([tapo_username, tapo_password, ip_address_device1, ip_address_device2, ip_address_device3]):
        raise ValueError("Missing required environment variables")

    client = ApiClient(tapo_username, tapo_password)

    # Fetch data for each device
    data = {
        "device1": await fetch_device_data(client, ip_address_device1, "device1"),
        "device2": await fetch_device_data(client, ip_address_device2, "device2"),
        "device3": await fetch_device_data(client, ip_address_device3, "device3"),
    }

    return json.dumps(data, indent=4)


def get_quarter_start_month(today: datetime) -> int:
    return 3 * ((today.month - 1) // 3) + 1


if __name__ == "__main__":
    data = asyncio.run(main())
    print(data)