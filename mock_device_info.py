from dataclasses import dataclass
from typing import Dict, Any
import json

@dataclass
class MockDeviceInfo:
    device_id: str
    name: str
    type: str
    model: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "device_id": self.device_id,
            "name": self.name,
            "type": "SMART.TAPOPLUG",
            "model": "P110",
        }

async def get_mock_device_info():
    # Simulate what .get_device_info() would return
    mock_devices = [
        MockDeviceInfo("1", "Sonos Lamp", "SMART.TAPOPLUG", "P110"),
        MockDeviceInfo("2", "Nintendo Switch", "SMART.TAPOPLUG", "P110"),
        MockDeviceInfo("3", "Living Room TV", "SMART.TAPOPLUG", "P110")
    ]
    return mock_devices