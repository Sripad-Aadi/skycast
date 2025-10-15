
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getCurrentWeatherByCity(city) {
  const url = `/weather?city=${city}`;
  return getJSON(url);
}

export async function get3DayForecast(city) {
  const url = `/forecast?city=${city}&days=3`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Forecast API error ${res.status}: ${text || res.statusText}`);
  }
  
  return res.json();
}