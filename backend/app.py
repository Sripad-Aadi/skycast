from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()


app = Flask(__name__)
CORS(app)

# API Keys 
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not WEATHER_API_KEY or not OPENWEATHER_API_KEY:
    
    print("❌ WARNING: API keys are not set!")
    




@app.route("/")
def index():
    return jsonify({"status": "API is operational"}), 200


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
        return jsonify({"error": f"Forecast API failed: {str(e)}"}), 500

# 3. Current Weather API
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
        return jsonify({"error": f"Weather API failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
