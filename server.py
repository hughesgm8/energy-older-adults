from flask import Flask, request, jsonify
import pandas as pd
import os
from flask_cors import CORS

app = Flask(__name__)

CORS(app, 
     origins=["http://localhost:5173"],
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
                
                csv_path = os.path.join(device_path, 'Day-Table 1.csv')
                if os.path.exists(csv_path):
                    try:
                        # Skip the first row (header) and read timestamp and energy usage
                        df = pd.read_csv(csv_path, skiprows=1, 
                                       names=['timestamp', 'energy', 'unused1', 'unused2', 'unused3'],
                                       usecols=['timestamp', 'energy'])
                        
                        # Convert data to arrays for the response
                        device_data[device_name] = {
                            'name': device_name,
                            'hourly': {
                                'data': df['energy'].tolist(),
                                'timestamps': df['timestamp'].tolist()
                            }
                        }
                        
                    except Exception as e:
                        print(f"Error processing CSV for {device_folder}: {str(e)}")
                        continue

        return jsonify(device_data)
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    # Enable debug mode and allow all origins in development
    app.config['DEBUG'] = True
    app.run(host='0.0.0.0', port=5000)