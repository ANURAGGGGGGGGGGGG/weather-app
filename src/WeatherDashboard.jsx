import React, { useState, useRef, useEffect } from 'react';
import {
  Search, MapPin, Droplets, Wind, Eye, Gauge, Calendar, X, AlertCircle, Sparkles, ArrowUpRight
} from 'lucide-react';
import './WeatherDashboard.css';

const API_KEY = '4808c3d2d8ed226290b643bba9e540ae';

const WeatherDashboard = () => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('C');
  const [switching, setSwitching] = useState(false);
  const [weatherEnter, setWeatherEnter] = useState(false);
  const inputRef = useRef(null);

  const convertTemp = (tempF) => unit === 'F' ? tempF : Math.round((tempF - 32) * 5 / 9);

  const toggleUnit = () => {
    if (switching) return;
    setSwitching(true);
    setUnit(prev => prev === 'F' ? 'C' : 'F');
    window.setTimeout(() => setSwitching(false), 180);
  };

  const fetchWeatherData = async (city) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=imperial`
    );
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();
    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      visibility: (data.visibility / 1609.34).toFixed(1),
      pressure: data.main.pressure,
      icon: getWeatherIcon(data.weather[0].main),
    };
  };

  const fetchForecastData = async (city) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=imperial`
    );
    if (!response.ok) throw new Error('Forecast data not available');
    const data = await response.json();
    return processForecastData(data.list);
  };

  const processForecastData = (forecastList) => {
    const dailyForecasts = {};
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      const hour = new Date(item.dt * 1000).getHours();
      if (!dailyForecasts[date]) dailyForecasts[date] = [];
      dailyForecasts[date].push({
        time: hour,
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        icon: getWeatherIcon(item.weather[0].main),
      });
    });
    const result = Object.keys(dailyForecasts).map(date => {
      const dayForecasts = dailyForecasts[date];
      let midDayForecast = dayForecasts[0];
      let closestToNoon = Math.abs(midDayForecast.time - 12);
      dayForecasts.forEach(forecast => {
        const distanceToNoon = Math.abs(forecast.time - 12);
        if (distanceToNoon < closestToNoon) {
          closestToNoon = distanceToNoon;
          midDayForecast = forecast;
        }
      });
      const displayDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
      return {
        date: displayDate,
        temp: midDayForecast.temp,
        condition: midDayForecast.condition,
        icon: midDayForecast.icon,
      };
    });
    return result.slice(1, 6);
  };

  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'clear': return '☀️';
      case 'clouds': return '⛅';
      case 'rain': return '🌧️';
      case 'snow': return '❄️';
      case 'thunderstorm': return '🌩️';
      case 'drizzle': return '🌦️';
      case 'mist':
      case 'fog': return '🌫️';
      default: return '🌤️';
    }
  };

  // animate card on data change — GPU-only props
  useEffect(() => {
    if (weatherData || forecastData) {
      setWeatherEnter(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setWeatherEnter(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [weatherData, forecastData]);

  const quickSearch = (city) => {
    setLocation(city);
    setLoading(true);
    setError('');
    Promise.all([fetchWeatherData(city), fetchForecastData(city)])
      .then(([w, f]) => {
        setWeatherData(w);
        setForecastData(f);
      })
      .catch(() => {
        setError('Unable to fetch weather data. Please check the location and try again.');
        setWeatherData(null);
        setForecastData(null);
      })
      .finally(() => setLoading(false));
  };

  const searchWeather = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [w, f] = await Promise.all([fetchWeatherData(location), fetchForecastData(location)]);
      setWeatherData(w);
      setForecastData(f);
    } catch {
      setError('Unable to fetch weather data. Please check the location and try again.');
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchWeather();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && location) setLocation('');
  };

  return (
    <div className="wd-shell">
      <div className="container py-3 py-md-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-9">

            {/* Header */}
            <header className="wd-header">
              <div className="wd-kicker">
                <span className="wd-kicker-dot" aria-hidden />
                Live weather • OpenWeather
                <Sparkles size={12} style={{ opacity: 0.7 }} />
              </div>
              <h1 className="wd-title">Weather <em>Dashboard</em></h1>
              <p className="wd-subtitle">
                Search any city for real-time conditions and a 5-day outlook. Clean, fast, and precise.
              </p>
            </header>

            {/* Search */}
            <div className="wd-card wd-search-card mt-4">
              <form onSubmit={handleSubmit} noValidate>
                <div className="wd-search-form">
                  <label className="wd-search-field" htmlFor="wd-search-input">
                    <span className="wd-search-icon" aria-hidden>
                      <MapPin size={16} strokeWidth={2.1} />
                    </span>
                    <input
                      id="wd-search-input"
                      ref={inputRef}
                      type="text"
                      className="wd-search-input"
                      placeholder="Try “Kyoto” or “San Francisco”"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                      autoComplete="off"
                      spellCheck={false}
                      aria-label="City name"
                    />
                    <button
                      type="button"
                      className="wd-clear-btn"
                      data-visible={location.length > 0 ? 'true' : 'false'}
                      onClick={() => { setLocation(''); inputRef.current?.focus(); }}
                      aria-label="Clear search"
                      tabIndex={location.length ? 0 : -1}
                    >
                      <X size={14} strokeWidth={2.2} />
                    </button>
                  </label>

                  <button
                    className="wd-search-btn"
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? <span className="wd-spinner" aria-hidden /> : <Search size={16} strokeWidth={2.2} />}
                    <span>{loading ? 'Searching' : 'Search'}</span>
                  </button>
                </div>
              </form>

              <div className="wd-search-hint">
                <span>Press</span> <kbd>↵</kbd> <span>to search</span>
                <span style={{ opacity: 0.35 }}>•</span>
                <span><kbd>Esc</kbd> to clear</span>
              </div>
            </div>

            {/* Error — enter animation, interruptible transition */}
            {error && (
              <div className="wd-alert" role="alert">
                <span className="wd-alert-icon" aria-hidden><AlertCircle size={16} /></span>
                <div className="wd-alert-copy">
                  <div className="wd-alert-title">Something didn’t work</div>
                  <div className="wd-alert-msg">{error}</div>
                </div>
                <button type="button" className="wd-alert-close" onClick={() => setError('')} aria-label="Dismiss error">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Current weather — prevents jarring appearance with translate + blur */}
            {weatherData ? (
              <div className="wd-card wd-weather mt-3" data-enter={weatherEnter ? 'true' : 'false'}>
                <div className="wd-weather-top">
                  <div className="wd-location">
                    <span className="wd-location-badge" aria-hidden><MapPin size={14} /></span>
                    {weatherData.location}
                  </div>
                  <div className="wd-meta">
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} />
                    Updated just now
                    <span style={{ opacity: 0.4 }}>•</span>
                    {weatherData.condition}
                  </div>
                </div>

                <div className="wd-weather-main">
                  <div className="wd-hero">
                    <div className="wd-hero-icon" aria-hidden>{weatherData.icon}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="wd-temp-row">
                        <div className="wd-temp" data-switching={switching ? 'true' : 'false'}>
                          {convertTemp(weatherData.temperature)}°{unit}
                        </div>
                        <button onClick={toggleUnit} className="wd-unit-toggle" type="button" aria-label={`Switch to °${unit === 'F' ? 'C' : 'F'}`}>
                          <span className="wd-unit-dot" aria-hidden />
                          °{unit === 'F' ? 'C' : 'F'}
                        </button>
                      </div>
                      <div className="wd-condition">{weatherData.condition}</div>
                    </div>
                  </div>

                  <div className="wd-stats">
                    <div className="wd-stat wd-stat--humidity">
                      <span className="wd-stat-icon"><Droplets size={18} /></span>
                      <div>
                        <div className="wd-stat-value">{weatherData.humidity}%</div>
                        <div className="wd-stat-label">Humidity</div>
                      </div>
                    </div>
                    <div className="wd-stat wd-stat--wind">
                      <span className="wd-stat-icon"><Wind size={18} /></span>
                      <div>
                        <div className="wd-stat-value">{weatherData.windSpeed} mph</div>
                        <div className="wd-stat-label">Wind</div>
                      </div>
                    </div>
                    <div className="wd-stat wd-stat--vis">
                      <span className="wd-stat-icon"><Eye size={18} /></span>
                      <div>
                        <div className="wd-stat-value">{weatherData.visibility} mi</div>
                        <div className="wd-stat-label">Visibility</div>
                      </div>
                    </div>
                    <div className="wd-stat wd-stat--press">
                      <span className="wd-stat-icon"><Gauge size={18} /></span>
                      <div>
                        <div className="wd-stat-value">{weatherData.pressure} hPa</div>
                        <div className="wd-stat-label">Pressure</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : !error && !loading ? (
              <div className="wd-card mt-3" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="wd-empty">
                  <div className="wd-empty-ill" aria-hidden>🌦️</div>
                  <div className="wd-empty-title">No location yet</div>
                  <div className="wd-empty-copy">Search a city above or try one of the quick picks below. Your weather appears here with a soft, focused entrance.</div>
                </div>
              </div>
            ) : null}

            {/* Forecast — stagger 52ms, only when data exists (occasional) */}
            {forecastData && forecastData.length > 0 && (
              <div className="wd-card wd-forecast mt-3">
                <div className="wd-section-head">
                  <div className="wd-section-title">
                    <span className="wd-section-title-icon"><Calendar size={14} /></span>
                    5-day forecast
                  </div>
                  <span className="wd-section-hint">Midday • {unit === 'C' ? '°C' : '°F'}</span>
                </div>

                <div className="wd-forecast-grid">
                  {forecastData.map((day, index) => (
                    <div
                      className="wd-day"
                      key={`${day.date}-${index}`}
                      style={{ '--i': index }}
                    >
                      <div className="wd-day-date">{day.date}</div>
                      <div className="wd-day-icon" aria-hidden>{day.icon}</div>
                      <div className="wd-day-temp" data-switching={switching ? 'true' : 'false'}>
                        {convertTemp(day.temp)}°{unit}
                      </div>
                      <div className="wd-day-cond" title={day.condition}>{day.condition}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick picks — hover only on fine pointer, active scale */}
            <div className="wd-card wd-try mt-3">
              <div className="wd-try-head">
                <Sparkles size={14} style={{ color: '#2563eb' }} />
                Try searching for
              </div>
              <div className="wd-try-sub">Quick picks — instant, no page reload</div>
              <div className="wd-chips">
                {[
                  { city: 'Delhi', label: 'Delhi, IN' },
                  { city: 'London', label: 'London, UK' },
                  { city: 'Tokyo', label: 'Tokyo, JP' },
                  { city: 'New York', label: 'New York, US' },
                ].map(({ city, label }) => (
                  <button
                    key={city}
                    type="button"
                    className="wd-chip"
                    onClick={() => quickSearch(city)}
                    disabled={loading}
                  >
                    <span className="wd-chip-dot" aria-hidden />
                    {label}
                    <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="wd-footer">
              Data by <a href="https://openweathermap.org" target="_blank" rel="noreferrer">OpenWeather</a> • Built with care, no layout thrashing — only <code style={{ fontSize: 11, background: 'white', border: '1px solid #e2e8f0', padding: '1px 5px', borderRadius: 6 }}>transform</code> &amp; <code style={{ fontSize: 11, background: 'white', border: '1px solid #e2e8f0', padding: '1px 5px', borderRadius: 6 }}>opacity</code>.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
