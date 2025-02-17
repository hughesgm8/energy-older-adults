from flask import Flask, Response
import subprocess

app = Flask(__name__)

@app.route('/api/device-data', methods=['GET'])
def get_device_data():
    try:
        # Run the tapo_pull.py script and capture the output
        result = subprocess.run(
            ['python3', 'tapo_pull.py'], 
            capture_output=True, 
            text=True,
            check=True  # This will raise an exception if the script fails
        )
        print("Output from tapo_pull.py:", result.stdout)
        return Response(result.stdout, mimetype='application/json')
    except subprocess.CalledProcessError as e:
        error_msg = f"Script failed with exit code {e.returncode}\nError: {e.stderr}"
        print(error_msg)
        return Response(
            '{"error": "' + error_msg.replace('"', '\\"') + '"}',
            status=500,
            mimetype='application/json'
        )
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return Response(
            '{"error": "' + error_msg.replace('"', '\\"') + '"}',
            status=500,
            mimetype='application/json'
        )
    
if __name__ == '__main__':
    app.run(debug=True)