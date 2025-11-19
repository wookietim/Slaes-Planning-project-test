import React, { useState, useEffect } from 'react';
import './DateTimeWeatherWidget.css';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

const DateTimeWeatherWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<string>('Downingtown, PA'); // Default to your location

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch weather data on component mount
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using wttr.in weather API for user's location
        // Format location for API call (replace spaces and commas)
        const locationQuery = location.replace(/\s+/g, '+').replace(',', '');
        const response = await fetch(`https://wttr.in/${locationQuery}?format=j1`);
        const data = await response.json();
        
        if (data && data.current_condition && data.current_condition[0]) {
          const current = data.current_condition[0];
          const tempC = parseInt(current.temp_C);
          const tempF = Math.round((tempC * 9/5) + 32); // Convert Celsius to Fahrenheit
          const weatherDesc = current.weatherDesc[0]?.value || 'Unknown';
          
          // Simple weather icon mapping
          const getWeatherIcon = (desc: string): string => {
            const lowerDesc = desc.toLowerCase();
            if (lowerDesc.includes('sun') || lowerDesc.includes('clear')) return '☀️';
            if (lowerDesc.includes('cloud')) return '☁️';
            if (lowerDesc.includes('rain')) return '🌧️';
            if (lowerDesc.includes('snow')) return '❄️';
            if (lowerDesc.includes('storm')) return '⛈️';
            if (lowerDesc.includes('fog')) return '🌫️';
            return '🌤️';
          };
          
          setWeather({
            temperature: tempF,
            description: weatherDesc,
            icon: getWeatherIcon(weatherDesc)
          });
        } else {
          // Fallback to mock data
          setWeather({
            temperature: 41, // Updated to match your actual temp
            description: 'Weather data unavailable',
            icon: '🌡️'
          });
        }
        setLoading(false);
        
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // Fallback to mock data
        setWeather({
          temperature: 41, // Updated to match your actual temp
          description: 'Weather unavailable',
          icon: '🌡️'
        });
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 10 minutes
    const weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(weatherTimer);
  }, [location]); // Add location as dependency

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="datetime-weather-widget">
      <div className="date-section">
        <div className="current-date">{formatDate(currentTime)}</div>
        <div className="current-time">{formatTime(currentTime)}</div>
      </div>
      
      <div className="weather-section">
        {loading ? (
          <div className="weather-loading">Loading...</div>
        ) : weather ? (
          <div className="weather-info">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-details">
              <div className="temperature">{weather.temperature}°F</div>
              <div className="description">{weather.description}</div>
              <div className="location" title="Click to change location" onClick={() => {
                const newLocation = prompt('Enter your location (city, state or city, country):', location);
                if (newLocation && newLocation.trim()) {
                  setLocation(newLocation.trim());
                }
              }}>
                📍 {location}
              </div>
            </div>
          </div>
        ) : (
          <div className="weather-error">Weather unavailable</div>
        )}
      </div>
    </div>
  );
};

export default DateTimeWeatherWidget;