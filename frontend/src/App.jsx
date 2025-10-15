import React from "react";
import { useState, useEffect } from "react";
import { getCurrentWeatherByCity } from "./api/weather";
import { get3DayForecast } from "./api/weather";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to handle map recentering
function MapRecenter({ lat, lon }) {
  const map = useMap();

  useEffect(() => {
    if (lat != null && lon != null) {
      map.setView([lat, lon], 10, {
        animate: true,
        duration: 1.5, // Smooth animation over 1.5 seconds
      });
    }
  }, [lat, lon, map]);

  return null; // This component doesn't render anything
}

function App() {
  const [show, setShow] = useState(false);
  const [city, setCity] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);

  let date = new Date().toLocaleTimeString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
  let time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "numeric", hour12: true });
  };

  const filteredData = forecast?.[0]?.hour
    ? forecast[0].hour.filter((d) => {
        const hour = new Date(d.time).getHours();
        return hour % 3 === 0;
      })
    : [];

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!city.trim()) {
        alert("⚠️ Please enter a city name");
        return;
      }

      setLoading(true);
      setShow(true);

      Promise.all([getCurrentWeatherByCity(city), get3DayForecast(city)])
        .then(([currentData, forecastData]) => {
          // FIXED: Add validation
          if (
            !forecastData ||
            !forecastData.forecast ||
            !forecastData.forecast.forecastday
          ) {
            throw new Error("Invalid forecast data received");
          }

          setReport(currentData);
          setForecast(forecastData.forecast.forecastday);
          console.log("Current:", currentData);
          console.log("Forecast:", forecastData.forecast.forecastday);

          const newEntry = {
            icon: `https://openweathermap.org/img/wn/${currentData?.weather?.[0]?.icon}@2x.png`,
            city: currentData?.name || city,
            condition: currentData?.weather?.[0]?.description || "N/A",
          };

          // Update the history list (keep only 4 latest)
          setHistory((prev) => {
            const updated = [
              newEntry,
              ...prev.filter((h) => h.city !== newEntry.city),
            ];
            return updated.slice(0, 4);
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error details:", err);
          setLoading(false);
          setShow(false);

          // FIXED: Better error messages
          if (
            err.message.includes("Failed to fetch") ||
            err.message.includes("ERR_CONNECTION_REFUSED")
          ) {
            alert(
              "⚠️ Backend server is not running!\n\nPlease start Flask:\npython app.py"
            );
          } else if (
            err.message.includes("404") ||
            err.message.includes("not found")
          ) {
            alert("❌ City not found! Please check spelling.");
          } else {
            alert(`⚠️ Error: ${err.message}`);
          }
        });

      e.target.value = "";
      e.target.blur();
    }
  };

  const handleHistoryClick = (cityName) => {
    setCity(cityName);
    setLoading(true);
    setShow(true);

    Promise.all([getCurrentWeatherByCity(cityName), get3DayForecast(cityName)])
      .then(([currentData, forecastData]) => {
        if (
          !forecastData ||
          !forecastData.forecast ||
          !forecastData.forecast.forecastday
        ) {
          throw new Error("Invalid forecast data received");
        }

        setReport(currentData);

        setForecast(forecastData.forecast.forecastday);
        console.log("Forecast array:", forecastData.forecast.forecastday);

        // Update history again (ensure unique, latest-first)
        const newEntry = {
          icon: `https://openweathermap.org/img/wn/${currentData?.weather?.[0]?.icon}@2x.png`,
          city: currentData?.name || cityName,
          condition: currentData?.weather?.[0]?.description || "N/A",
        };
        setHistory((prev) => {
          const updated = [
            newEntry,
            ...prev.filter((h) => h.city !== newEntry.city),
          ];
          return updated.slice(0, 4);
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching history item:", err);
        setLoading(false);
        alert(`⚠️ Error: ${err.message}`);
      });
  };

  return (
    <div
      id="app"
      className="min-h-screen flex justify-center items-center w-full bg-[url('/home-background.avif')] bg-cover p-2 sm:p-4"
    >
      <div
        className="w-11/12 sm:w-9/10 min-h-[85vh] sm:h-9/10 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg flex flex-col items-center justify-center px-2 sm:px-4"
        id="container"
      >
        <div className="w-full flex flex-col items-center pt-3 sm:pt-5">
          {/* Hero Section */}
          {!show && (
            <div className="flex justify-center items-center w-full min-h-screen bg-[url('./assets/home-background.avif')] bg-cover bg-center px-4">
              <div className="max-w-3xl w-11/12 text-center rounded-3xl bg-white/20 backdrop-blur-2xl border border-white/40 shadow-lg p-6 sm:p-8 md:p-10 transition hover:bg-white/25">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black/90 mb-4 drop-shadow-md flex flex-wrap justify-center items-center gap-2">
                  Welcome to <span className="text-blue-600">SkyCast</span> ☁️
                </h1>
                <p className="text-base sm:text-lg text-gray-700 mb-6 md:mb-8">
                  Get real-time weather updates and forecasts for any city
                  worldwide.
                </p>
                {/* Sample City Buttons */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
                  {["Hyderabad", "Delhi", "Mumbai", "New York"].map(
                    (sample) => (
                      <button
                        key={sample}
                        onClick={() => handleHistoryClick(sample)}
                        className="bg-blue-100/40 hover:bg-blue-300/50 text-blue-800 font-semibold rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm transition transform hover:scale-105 shadow-sm"
                      >
                        {sample}
                      </button>
                    )
                  )}
                </div>
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="🔍 Search for a city"
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full md:w-3/5 h-12 px-5 text-black/80 bg-white/60 focus:bg-white focus:outline-none rounded-full shadow-lg placeholder:text-gray-600 transition transform duration-300 focus:scale-105"
                />
              </div>
            </div>
          )}

          {show && (
            <div className="w-full flex flex-col sm:flex-row justify-around items-center gap-3 sm:gap-4 mt-3 sm:mt-5">
              {/* City Name on the left */}
              <div className="py-2 px-5 rounded-lg bg-black/5 backdrop-blur-lg border border-white/30 shadow-lg">
                {city && !loading && (
                  <h1 className="text-base sm:text-lg font-bold text-black/75">
                    {report ? report.name : city}
                  </h1>
                )}
              </div>

              {/* Search Input on the right */}
              {!loading && (
                <div>
                  <input
                    type="text"
                    placeholder="🔍 Search for location"
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full sm:w-[160px] md:w-[200px] h-10 px-3 text-sm text-gray-700 
                 bg-white/60 border border-white/50 rounded-md shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-white/40 
                 hover:bg-white/70 placeholder:text-gray-500 transition"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <p className="shadow-lg text-2xl sm:text-3xl font-semibold font-serif text-white/60 drop-shadow-lg mt-10">
            Loading...
          </p>
        )}

        {!loading && report && (
          <div
            id="weather-container"
            className="w-full sm:w-19/20 mt-3 sm:mt-5 flex flex-col justify-center text-xs sm:text-sm font-serif text-black/60 px-2 sm:px-0"
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-3 sm:mb-5">
              {/* Current Weather */}
              <div
                className="p-3 sm:p-2 rounded-2xl bg-black/5 backdrop-blur-lg border border-white/30 shadow-lg"
                id="current-weather"
              >
                <h2 className="text-base sm:text-lg font-semibold text-black/75">
                  Current Weather
                </h2>
                <div className="flex gap-3 sm:gap-5 items-center text-xs sm:text-sm">
                  <p>{time}</p>
                  <p>{date.slice(0, 5)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex flex-row justify-around items-center">
                    <div className="flex flex-col justify-center items-center">
                      <img
                        src={`https://openweathermap.org/img/wn/${report.weather[0].icon}@2x.png`}
                        alt={report.weather[0].description}
                        className="w-10 h-10 sm:w-12 sm:h-12"
                      />
                      <p className="text-xs sm:text-sm">
                        {report.weather[0].description}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg sm:text-xl">
                        {report.main.temp}&#8451;
                      </p>
                      <p className="text-xs sm:text-sm">Temperature</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-row justify-center items-start text-xs sm:text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{report.main.pressure}hPa</p>
                      <p>Pressure</p>
                    </div>
                    <div className="text-center mx-6 sm:mx-10">
                      <p className="font-semibold">{report.main.humidity}%</p>
                      <p>Humidity</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">
                        {(report.wind.speed * 3.6).toFixed(1)}kph
                      </p>
                      <p>Wind</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* City Map with Recentering */}
              <div
                className="p-3 sm:p-2 rounded-2xl bg-black/5 backdrop-blur-lg border border-white/30 shadow-lg"
                id="city-map"
              >
                <h2 className="text-base sm:text-lg font-semibold text-black/75 mb-2">
                  City Map
                </h2>
                <div className="h-48 sm:h-56 md:h-64 lg:h-42 w-full rounded-lg overflow-hidden">
                  {report && report.coord && report.coord.lat && report.coord.lon && (
                  <MapContainer
                    center={[report.coord.lat, report.coord.lon]}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false} // Prevents accidental zooming
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[report.coord.lat, report.coord.lon]}>
                      <Popup>{report.name}</Popup>
                    </Marker>
                    {/* This component handles recentering when coordinates change */}
                    <MapRecenter
                      lat={report.coord.lat}
                      lon={report.coord.lon}
                    />
                  </MapContainer>
                  )}
                </div>
              </div>

              {/* History */}
              <div
                className="p-3 sm:p-2 rounded-2xl bg-black/5 backdrop-blur-lg border border-white/30 shadow-lg md:col-span-2 lg:col-span-1"
                id="history-container"
              >
                <h2 className="text-base sm:text-lg font-semibold text-black/75 mb-2">
                  History
                </h2>
                {history.length === 0 ? (
                  <p className="text-center text-gray-700 text-xs sm:text-sm">
                    No recent searches
                  </p>
                ) : (
                  <ul>
                    {history.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => handleHistoryClick(item.city)}
                        className="flex justify-between items-center p-2 mb-1 rounded-lg bg-blue-100/20 hover:bg-blue-100/40 transition cursor-pointer text-xs sm:text-sm"
                      >
                        <img
                          src={item.icon}
                          alt={item.condition}
                          className="w-6 h-6"
                        />
                        <span className="font-semibold">{item.city}</span>
                        <span className="capitalize text-gray-700">
                          {item.condition}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Forecast and Graph sections remain the same */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
              <div
                className="p-3 sm:p-2 rounded-2xl bg-black/5 backdrop-blur-lg border border-white/30 shadow-lg lg:col-span-1"
                id="forecast-table"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-black/75">
                  Forecast
                </h2>
                {forecast && forecast.length > 0 && (
                  <div className="w-full mt-2 space-y-2">
                    {forecast.slice(1).map((day, index) => (
                      <div
                        key={index}
                        className="bg-white/10 rounded-lg text-center"
                      >
                        <div className="grid grid-cols-3 items-center">
                          <div className="px-2 font-medium text-xs sm:text-sm">
                            <p>{day.date}</p>
                          </div>
                          <div className="flex justify-center items-center">
                            <img
                              className="w-8 h-8 sm:w-10 sm:h-10"
                              src={day.day.condition.icon}
                              alt={day.day.condition.text}
                            />
                          </div>
                          <div className="px-2 sm:px-4 py-1 text-xs sm:text-sm">
                            <p>{day.day.condition.text}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="px-2 sm:px-4 py-1 text-xs sm:text-sm">
                            <div className="text-center">
                              <p className="font-semibold">
                                {day.day.avgtemp_c}&#8451;
                              </p>
                              <p>Temp</p>
                            </div>
                          </div>
                          <div className="px-2 sm:px-4 py-1 text-xs sm:text-sm">
                            <div className="text-center">
                              <p className="font-semibold">
                                {day.day.avghumidity}%
                              </p>
                              <p>Humidity</p>
                            </div>
                          </div>
                          <div className="px-2 sm:px-4 py-1 text-xs sm:text-sm">
                            <div className="text-center">
                              <p className="font-semibold">
                                {day.day.maxwind_kph}kph
                              </p>
                              <p>Wind</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="p-3 sm:p-4 rounded-2xl bg-black/5 backdrop-blur-lg border border-white/30 shadow-lg lg:col-span-2"
                id="summary-graph"
              >
                <div className="w-full h-full flex flex-col justify-center items-center text-black/75">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Summary Graph
                  </h2>
                  {forecast && forecast[0] && (
                    <div className="w-full h-64 sm:h-72 md:h-80 p-2 sm:p-4 rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        {forecast?.[0]?.hour ? (
                          <LineChart data={filteredData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#ddd"
                            />
                            <XAxis
                              dataKey="time"
                              tickFormatter={formatTime}
                              tick={{ fontSize: 10, fill: "black" }}
                              padding={{ left: 20 }}
                            />
                            <YAxis
                              hide
                              domain={["dataMin - 2", "dataMax + 2"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="temp_c"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={false}
                            >
                              <LabelList
                                dataKey="temp_c"
                                position="top"
                                formatter={(v) => `${v}°C`}
                                style={{ fill: "black", fontSize: 10 }}
                              />
                            </Line>
                          </LineChart>
                        ) : (
                          <p>Loading...</p>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
