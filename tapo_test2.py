"""P110 and P115 Example"""

import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
import json
from typing import Dict, Any

from tapo import ApiClient
from tapo.requests import EnergyDataInterval
from mock_device_info import get_mock_device_info  # For testing when not at home

async def main():
    try:
        # Try to get real device info first
        tapo_username = os.getenv("TAPO_USERNAME")
        tapo_password = os.getenv("TAPO_PASSWORD")
        ip_address = os.getenv("IP_ADDRESS_TV")

        try:
            client = ApiClient(tapo_username, tapo_password)
            device = await client.p110(ip_address)
            device_info = await device.get_device_info()
            print("Real device info:", json.dumps(device_info.to_dict(), indent=2))
        except Exception as e:
            print(f"Couldn't connect to real device, using mock data: {e}")
            # Fall back to mock data when not at home
            mock_devices = await get_mock_device_info()
            for device in mock_devices:
                print(f"\nMock device info for {device.name}:")
                print(json.dumps(device.to_dict(), indent=2))

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())