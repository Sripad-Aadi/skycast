
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getCurrentWeatherByCity(city) {
  // Prepend the absolute base URL (e.g., https://weather-api-xxxx.onrender.com)
  const url = `${API_BASE_URL}/weather?city=${city}`; 
  return getJSON(url);
}

export async function get3DayForecast(city) {
  // Prepend the absolute base URL
  const url = `${API_BASE_URL}/forecast?city=${city}&days=3`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Forecast API error ${res.status}: ${text || res.statusText}`);
  }
  
  return res.json();
}