"""P110 and P115 Example"""

import asyncio
import os
from datetime import datetime
import json

from tapo import ApiClient
from tapo.requests import EnergyDataInterval

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def fetch_device_data(client, ip_address):
    device = await client.p110(ip_address)
    today = datetime.today()
    energy_data_hourly = await device.get_energy_data(EnergyDataInterval.Hourly, today)
    energy_data_daily = await device.get_energy_data(
        EnergyDataInterval.Daily,
        datetime(today.year, get_quarter_start_month(today), 1),
    )
    return {
        "hourly": energy_data_hourly.to_dict(),
        "daily": energy_data_daily.to_dict(),
    }


async def main():
    tapo_username = os.getenv("TAPO_USERNAME")
    tapo_password = os.getenv("TAPO_PASSWORD")
    ip_address_device1 = os.getenv("IP_ADDRESS_SONOS")
    ip_address_device2 = os.getenv("IP_ADDRESS_NINTENDO")
    ip_address_device3 = os.getenv("IP_ADDRESS_TV")

    if not tapo_username or not tapo_password or not ip_address_device1 or not ip_address_device2 or not ip_address_device3:
        raise ValueError("Environment variables TAPO_USERNAME, TAPO_PASSWORD, and IP_ADDRESS must be set")

    client = ApiClient(tapo_username, tapo_password)

    # Fetch data for each device
    device1_data = await fetch_device_data(client, ip_address_device1)
    device2_data = await fetch_device_data(client, ip_address_device2)
    device3_data = await fetch_device_data(client, ip_address_device3)

    data = {
        "device1": device1_data,
        "device2": device2_data,
        "device3": device3_data,
    }

    return json.dumps(data, indent=4)


def get_quarter_start_month(today: datetime) -> int:
    return 3 * ((today.month - 1) // 3) + 1


if __name__ == "__main__":
    data = asyncio.run(main())
    print(data)