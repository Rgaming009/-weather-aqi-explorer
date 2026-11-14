# ATMOS — Weather & Air Quality Explorer

A responsive, static web app for current weather, modeled air quality, 7-day forecast and historical daily temperature analysis.

## Features
- Search worldwide locations using Open-Meteo geocoding.
- Current conditions and 7-day forecast.
- US AQI estimate and PM2.5 / PM10 / O3 / NO2 values.
- Historical daily minimum, mean and maximum temperature for a selected date range.
- Coldest day, hottest day and period mean within the selected range.
- Celsius / Fahrenheit toggle and mobile-responsive dark premium UI.
- Nandurbar, Maharashtra is the default location.

## Run locally
No build step or API key is required for the default Open-Meteo endpoints.

1. Unzip the project.
2. Open a terminal in this folder.
3. Run a local static server:
   - Python: `python -m http.server 8000`
   - or Node: `npx serve .`
4. Open `http://localhost:8000`.

Opening `index.html` directly may work, but a local server is recommended.

## Deploy to Vercel (recommended)
1. Create a GitHub repository and upload `index.html`, `styles.css`, and `app.js`.
2. Sign in to https://vercel.com and choose **Add New → Project**.
3. Import the repository.
4. Framework preset: **Other**.
5. Build command: leave blank.
6. Output directory: `.` (project root).
7. Deploy. Vercel will provide a public HTTPS URL.
8. To use a custom domain, open the project **Settings → Domains**, add your domain, then apply the DNS records Vercel displays.

## Deploy to Netlify
1. Sign in at https://app.netlify.com.
2. Choose **Add new site → Deploy manually**.
3. Drag the unzipped project folder into the deploy area, or connect the GitHub repository.
4. For Git-based deployment, use no build command and publish directory `.`.
5. Netlify will provide a public URL. Add a domain under **Domain management** if desired.

## Data sources and limitations
This project uses Open-Meteo:
- Geocoding: `https://geocoding-api.open-meteo.com`
- Forecast/current weather: `https://api.open-meteo.com`
- Historical weather archive: `https://archive-api.open-meteo.com`
- Air quality: `https://air-quality-api.open-meteo.com`

The app currently makes browser-side requests and requires an internet connection. The default Open-Meteo endpoints do not require an API key for typical non-commercial use; review the provider's current terms, attribution requirements, rate limits and commercial-use rules before public/commercial deployment: https://open-meteo.com/en/terms

Important:
- AQI and pollutant values are model/grid estimates, not guaranteed readings from a local government monitoring station.
- Historical weather values are gridded archive/reanalysis estimates. They are not necessarily official station observations and should not be presented as the all-time official city record.
- The archive's available years vary by location and dataset. The UI analyzes the date range the user selects; it does not claim to establish an all-time official record.
- This version does not provide historical AQI charts. It shows current modeled AQI and historical weather temperatures.
- Weather and air quality data can be delayed, revised, or unavailable for some coordinates.
- Chart.js is loaded from jsDelivr CDN; Google Fonts are loaded from Google Fonts. A network connection is required.

## Project structure
```
weather-aqi-explorer/
  index.html
  styles.css
  app.js
  README.md
```

## Before going live
- Test the site on mobile and desktop.
- Review Open-Meteo terms for your intended usage.
- If you add analytics, accounts, or a backend later, publish a privacy policy.
- Do not use the app as an emergency warning system or for medical decisions.
