import React, { useState } from 'react';
import { Search, MapPin, Droplets, Wind, Eye, Gauge, Calendar } from 'lucide-react';

const API_KEY = '4808c3d2d8ed226290b643bba9e540ae';

const WeatherDashboard = () => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('C'); // 'C' or 'F'

  const convertTemp = (tempF) => {
    return unit === 'F' ? tempF : Math.round((tempF - 32) * 5/9);
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'F' ? 'C' : 'F');
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
    // Group forecast data by day
    const dailyForecasts = {};
    
    forecastList.forEach(item => {
      // Extract date from timestamp (YYYY-MM-DD format)
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      const hour = new Date(item.dt * 1000).getHours();
      
      // Initialize the day's data if not already present
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = [];
      }
      
      // Add this forecast to the day's array
      dailyForecasts[date].push({
        time: hour,
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        icon: getWeatherIcon(item.weather[0].main),
      });
    });
    
    // Convert the grouped data to an array and sort by date
    const result = Object.keys(dailyForecasts).map(date => {
      // Find the forecast closest to noon for each day
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
      
      // Format the date for display
      const displayDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      return {
        date: displayDate,
        temp: midDayForecast.temp,
        condition: midDayForecast.condition,
        icon: midDayForecast.icon,
      };
    });
    
    // Return only the next 5 days (excluding today if we have enough data)
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

  const searchWeather = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch both current weather and forecast data
      const weatherData = await fetchWeatherData(location);
      const forecastData = await fetchForecastData(location);
      
      setWeatherData(weatherData);
      setForecastData(forecastData);
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">

            {/* Header */}
            <div className="text-center mb-5">
              <h1 className="display-4 text-black fw-bold mb-4">Weather Dashboard</h1>
              <p className="text-black-50 fs-5">Get real-time weather information for any location</p>
            </div>

            {/* Search Form */}
            <div className="card shadow-lg mb-4 mt-5">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-primary text-white border-primary">
                      <MapPin size={20} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-primary"
                      placeholder="Enter city name"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={loading}
                    />
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <Search size={20} className="me-2" />
                      )}
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError('')}
                ></button>
              </div>
            )}

            {/* Current Weather */}
            {weatherData && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card shadow-lg">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <h2 className="card-title text-primary mb-1">
                            <MapPin size={24} className="me-2" />
                            {weatherData.location}
                          </h2>
                          <div className="d-flex align-items-center mb-3">
                            <span className="display-1 me-3">{weatherData.icon}</span>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="display-3 fw-bold text-primary">
                                  {convertTemp(weatherData.temperature)}°{unit}
                                </span>
                                <button 
                                  onClick={toggleUnit}
                                  className="btn btn-sm btn-outline-primary"
                                  style={{ height: '38px' }}
                                >
                                  °{unit === 'F' ? 'C' : 'F'}
                                </button>
                              </div>
                              <div className="fs-4 text-muted">{weatherData.condition}</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="row g-3">
                            <div className="col-6">
                              <div className="d-flex align-items-center p-3 bg-light rounded">
                                <Droplets className="text-info me-2" size={24} />
                                <div>
                                  <div className="fw-bold">{weatherData.humidity}%</div>
                                  <div className="small text-muted">Humidity</div>
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex align-items-center p-3 bg-light rounded">
                                <Wind className="text-success me-2" size={24} />
                                <div>
                                  <div className="fw-bold">{weatherData.windSpeed} mph</div>
                                  <div className="small text-muted">Wind Speed</div>
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex align-items-center p-3 bg-light rounded">
                                <Eye className="text-warning me-2" size={24} />
                                <div>
                                  <div className="fw-bold">{weatherData.visibility} mi</div>
                                  <div className="small text-muted">Visibility</div>
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex align-items-center p-3 bg-light rounded">
                                <Gauge className="text-danger me-2" size={24} />
                                <div>
                                  <div className="fw-bold">{weatherData.pressure} hPa</div>
                                  <div className="small text-muted">Pressure</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5-Day Forecast */}
            {forecastData && forecastData.length > 0 && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card shadow-lg">
                    <div className="card-body">
                      <h5 className="text-primary mb-3">
                        <Calendar size={20} className="me-2" />
                        5-Day Forecast
                      </h5>
                      <div className="row g-3">
                        {forecastData.map((day, index) => (
                          <div className="col" key={index}>
                            <div className="card h-100 text-center">
                              <div className="card-body p-2">
                                <h6 className="card-title">{day.date}</h6>
                                <div className="my-2">
                                  <span className="display-6">{day.icon}</span>
                                </div>
                                <p className="mb-0 fw-bold">{convertTemp(day.temp)}°{unit}</p>
                                <p className="small text-muted mb-0">{day.condition}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Buttons */}
            <div className="mt-4 text-center">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="text-primary mb-3">Try searching for:</h5>
                  <div className="d-flex flex-wrap justify-content-center gap-2">
                    {['Delhi', 'London', 'Tokyo'].map(city => (
                      <button
                        key={city}
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setLocation(city);
                          // Use the city directly instead of relying on the state update
                          Promise.all([
                            fetchWeatherData(city),
                            fetchForecastData(city)
                          ])
                            .then(([weatherData, forecastData]) => {
                              setWeatherData(weatherData);
                              setForecastData(forecastData);
                              setError('');
                            })
                            .catch(err => {
                              setError('Unable to fetch weather data. Please check the location and try again.');
                              setWeatherData(null);
                              setForecastData(null);
                            })
                            .finally(() => {
                              setLoading(false);
                            });
                          setLoading(true);
                        }}
                        disabled={loading}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;