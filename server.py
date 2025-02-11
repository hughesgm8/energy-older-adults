from flask import Flask, Response
import subprocess

app = Flask(__name__)

@app.route('/api/device-data', methods=['GET'])
def get_device_data():
    # Run the tapo_test.py script and capture the output
    result = subprocess.run(['python3', 'tapo_test.py'], capture_output=True, text=True)
    # Directly return the output as JSON
    if result.returncode == 0:
        print("Output from tapo_test.py:", result.stdout) 
        return Response(result.stdout, mimetype='application/json')
    else:
        print("Error running tapo_test.py:", result.stderr)
        return Response('{"error": "Failed to fetch device data"}', status=500, mimetype='application/json')

if __name__ == '__main__':
    app.run(debug=True)