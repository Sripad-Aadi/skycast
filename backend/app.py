from flask import Flask, request, jsonify, send_from_directory
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load .env
load_dotenv()

app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), '../frontend/dist'),
    static_url_path='/'
)
CORS(app)
# API Keys
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not WEATHER_API_KEY or not OPENWEATHER_API_KEY:
    raise ValueError("❌ WEATHER_API_KEY or OPENWEATHER_API_KEY not found!")

# ----------------------
# API Routes
# ----------------------

@app.route("/forecast")
def forecast():
    city = request.args.get("city")
    days = request.args.get("days", 3)

    if not city:
        return jsonify({"error": "City is required"}), 400

    url = f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}&q={city}&days={days}&aqi=no&alerts=no"

    try:
        res = requests.get(url)
        data = res.json()
        if "error" in data:
            return jsonify(data), 400
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/weather")
def weather():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "City is required"}), 400

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"

    try:
        res = requests.get(url)
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------
# Serve React
# ----------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    """Serve React build files. React Router paths fallback to index.html"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# ----------------------
# Run
# ----------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
