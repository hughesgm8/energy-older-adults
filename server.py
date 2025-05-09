"""
# Energy Dashboard Backend API

This file serves as the backend API for the Energy Usage Dashboard. It provides endpoints to fetch energy usage data for devices associated with a participant.

## Historical Context

1. **Original Design with Tapo Smart Plugs**:
   - Initially, the app was designed to work with **Tapo smart plugs**.
   - The `tapo_pull.py` script fetched real-time energy data using the Tapo API.
   - `.env` variables were required for Tapo credentials and device IPs:
     ```
     TAPO_USERNAME=<your-tapo-username>
     TAPO_PASSWORD=<your-tapo-password>
     IP_ADDRESS_SONOS=<device-ip>
     IP_ADDRESS_NINTENDO=<device-ip>
     IP_ADDRESS_TV=<device-ip>
     ```
   - This approach required the server to be on the same network as the smart plugs.

2. **Transition to CSV-Based Data**:
   - To remove the network dependency, the app was updated to use **exported energy data from CSV files**.
   - The `server.py` file reads these CSV files from a directory structure:
     ```
     all-data/
       └── <participant_id>/
           └── <device_name>_<device_id>/
               └── <date>/
                   └── Day-Table 1.csv
     ```

3. **Current Implementation with Mock Data**:
   - For testing and design purposes, the app now uses **mock data** generated by `mockDeviceGenerator.ts`.
   - This allows developers to test the app without requiring real data or CSV files.

## Future Considerations

If you want to work with **real data** in the future:
1. **Add Real Data for the Current API**:
   - Populate the `all-data` directory with real energy usage data in the expected CSV format.

2. **Revisit the Tapo API Integration**:
   - Re-enable the `tapo_pull.py` script and update it as needed.
   - Ensure the `.env` file contains the correct credentials and IP addresses for the Tapo devices.

## Endpoints

- `/api/test` (GET): Test endpoint to verify the API is working.
- `/api/device-data/<participant_id>` (GET): Fetches energy usage data for a specific participant.

## Notes for Developers

- Mock data is useful for testing but does not reflect real-world energy usage patterns.
- If transitioning back to real data, ensure the backend logic is compatible with the data source (CSV or Tapo API).
- The `tapo_pull.py` script may require updates to work with newer versions of the Tapo API or device firmware.
"""

from flask import Flask, request, jsonify
import pandas as pd
import os
from flask_cors import CORS

app = Flask(__name__)

CORS(app, 
     origins=["http://localhost:5173", "http://192.168.1.104:5173"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working"})

@app.route('/api/device-data/<participant_id>', methods=['GET'])
def get_device_data(participant_id):
    try:
        print(f"Received request for participant: {participant_id}")
        participant_dir = f'all-data/{participant_id}'
        
        if not os.path.exists(participant_dir):
            return jsonify({"error": "Participant not found"}), 404

        device_data = {}
        for device_folder in os.listdir(participant_dir):
            device_path = os.path.join(participant_dir, device_folder)
            
            if os.path.isdir(device_path):
                # Extract device name from folder (everything before the '_')
                device_name = device_folder.split('_')[0]
                
                device_data[device_name] = {
                    'name': device_name,
                    'hourly': {
                        'data': [],
                        'timestamps': []
                    }
                }
                
                for date_folder in os.listdir(device_path):
                    date_path = os.path.join(device_path, date_folder)
                    
                    if os.path.isdir(date_path):
                        csv_path = os.path.join(date_path, 'Day-Table 1.csv')
                        if os.path.exists(csv_path):
                            try:
                                # Skip the first row (header) and read timestamp and energy usage
                                df = pd.read_csv(csv_path, skiprows=1, 
                                               names=['timestamp', 'energy', 'unused1', 'unused2', 'unused3'],
                                               usecols=['timestamp', 'energy'])
                                
                                # Append data to the response
                                device_data[device_name]['hourly']['data'].extend(df['energy'].tolist())
                                device_data[device_name]['hourly']['timestamps'].extend(df['timestamp'].tolist())
                                
                            except Exception as e:
                                print(f"Error processing CSV for {device_folder} on {date_folder}: {str(e)}")
                                continue

        return jsonify(device_data)
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    # Enable debug mode and allow all origins in development
    app.config['DEBUG'] = True
    app.run(host='0.0.0.0', port=5000)