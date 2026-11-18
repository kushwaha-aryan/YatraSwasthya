/* Curated climate and air data (manual). No live APIs. Values are only included when manually recorded with an "as of" date and source.
   If a destination is missing or a field is null, treat it as "not available" and use existing rule-based advice. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CLIMATE = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
    asOf: "2026-11-13",
    sourceNote: "Manual curated snapshot. Update by editing climate.js with dated, sourced values. No live AQI or weather APIs are used.",
    cpcb: {
      name: "CPCB National Air Quality Index (India)",
      source: "Central Pollution Control Board, National Air Quality Index",
      url: "https://cpcb.nic.in/National-Air-Quality-Index/",
      categories: [
        { name: "Good", range: "0-50", pm25: "0-30" },
        { name: "Satisfactory", range: "51-100", pm25: "31-60" },
        { name: "Moderate", range: "101-200", pm25: "61-90" },
        { name: "Poor", range: "201-300", pm25: "91-120" },
        { name: "Very Poor", range: "301-400", pm25: "121-250" },
        { name: "Severe", range: "401-500", pm25: "250+" }
      ]
    },
    /* Keyed by country id (from data.js) or city key. Each entry: { label, scale, aqi, aqiCategory, pm25, tempC, humidityPct, heatCategory, asOf, source, note } */
    places: {
      "india": { label: "India (general)", scale: "CPCB AQI", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "No single national value; use city-specific manual entry if available.", note: "Not available as a single value." },
      "delhi": { label: "Delhi, India", scale: "CPCB AQI", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "CPCB (manual entry not recorded in this snapshot).", note: "Not available in this curated snapshot. Enter values manually if known." },
      "mumbai": { label: "Mumbai, India", scale: "CPCB AQI", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "CPCB (manual entry not recorded in this snapshot).", note: "Not available in this curated snapshot. Enter values manually if known." },
      "kenya": { label: "Kenya", scale: "Scale/source not verified in this app", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "Not verified.", note: "Not available. Use local official sources if needed." },
      "thailand": { label: "Thailand", scale: "Scale/source not verified in this app", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "Not verified.", note: "Not available. Use local official sources if needed." },
      "united-arab-emirates": { label: "United Arab Emirates", scale: "Scale/source not verified in this app", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "Not verified.", note: "Not available. Use local official sources if needed." },
      "saudi-arabia": { label: "Saudi Arabia", scale: "Scale/source not verified in this app", aqi: null, aqiCategory: null, pm25: null, tempC: null, humidityPct: null, heatCategory: null, asOf: "2026-11-13", source: "Not verified.", note: "Not available. Use local official sources if needed." }
    }
  };
}));
