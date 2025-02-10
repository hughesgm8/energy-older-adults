from flask import Flask, jsonify
import subprocess
import json

app = Flask(__name__)

@app.route('/api/lamp-data', methods=['GET'])
def get_lamp_data():
    # Run the tapo_test.py script and capture the output
    result = subprocess.run(['python3', 'tapo_test.py'], capture_output=True, text=True)
    # Parse the output as JSON
    try:
        data = json.loads(result.stdout)
        # Log the data
        print("Data fetched by tapo_test.py:", json.dumps(data, indent=4))
        return jsonify(data)
    except json.JSONDecodeError as e:
        print("Error decoding JSON:", e)
        print("Raw output:", result.stdout)
        return jsonify({"error": "Invalid JSON response from tapo_test.py"}), 500

if __name__ == '__main__':
    app.run(debug=True)