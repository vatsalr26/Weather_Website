const apiKey = '3743c055bc60e7ee9efcb83269f92f16'; 
const apiKey2 = 'd454843963b7404092815609242210'; 
let units = 'metric'; 
let hourlyForecastChart = null;
let comparisonChart = null;

function searchCity() {
    const cityInput = document.getElementById('cityInput'); 
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    } else {
        alert("Please enter a city name.");
    }
}

async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Failed to fetch weather data. Please check the city name or try again later.");
    }
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoordinates(lat, lon);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

async function getWeatherByCoordinates(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url);
    const data = await response.json();
    displayWeather(data);
}

function displayWeather(data) {
    document.getElementById('city').textContent = `${data.name}`;
    document.getElementById('temperature').textContent = `Temperature: ${data.main.temp}°`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    updateTheme(data.main.temp);
    get24HourForecast(data.coord.lat, data.coord.lon);
    get5DayForecast(data.coord.lat, data.coord.lon);
    getComparisonData(data.name);
}

function updateTheme(temp) {
    const app = document.getElementById('app');
    if (temp < 15) {
        app.classList.add('cold');
        app.classList.remove('hot');
    } else if (temp > 25) {
        app.classList.add('hot');
        app.classList.remove('cold');
    } else {
        app.classList.remove('hot');
        app.classList.remove('cold');
    }
}

async function get24HourForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url);
    const data = await response.json();

    const hourlyTemps = data.list.slice(0, 24).map((hour) => hour.main.temp);
    const hours = data.list.slice(0, 24).map((hour) => new Date(hour.dt * 1000).getHours());

    const ctx = document.getElementById('hourlyForecastChart').getContext('2d');
    if (hourlyForecastChart) {
        hourlyForecastChart.destroy();
    }
    hourlyForecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Temperature (°)',
                data: hourlyTemps,
                borderColor: 'blue',
                fill: false,
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Hours' } },
                y: { title: { display: true, text: 'Temperature (°)' } }
            }
        }
    });
}

async function get5DayForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url);
    const data = await response.json();
    const forecastElement = document.getElementById('forecast');
    forecastElement.innerHTML = '';
    const groupedForecast = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!groupedForecast[date]) {
            groupedForecast[date] = [];
        }
        groupedForecast[date].push(item);
    });

    const days = Object.keys(groupedForecast).slice(0, 5);
    days.forEach(day => {
        const dayData = groupedForecast[day][0]; 
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.innerHTML = `
            <h3>${day}</h3>
            <p>Temp: ${dayData.main.temp}°</p>
            <img src="http://openweathermap.org/img/wn/${dayData.weather[0].icon}.png" alt="Icon">
        `;
        forecastElement.appendChild(dayElement);
    });
}

async function getComparisonData(city) {
    const url1 = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
    const url2 = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey2}&q=${city}&days=1`;

    const response1 = await fetch(url1);
    const data1 = await response1.json();
    const temps1 = data1.list.slice(0, 24).map(hour => hour.main.temp);

    const response2 = await fetch(url2);
    const data2 = await response2.json();
    const temps2 = data2.forecast.forecastday[0].hour.map(hour => hour.temp_c);

    const ctx = document.getElementById('comparisonChart').getContext('2d');
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data1.list.slice(0, 24).map(hour => new Date(hour.dt * 1000).getHours()),
            datasets: [
                { label: 'OpenWeatherMap', data: temps1, borderColor: 'red', fill: false },
                { label: 'WeatherAPI', data: temps2, borderColor: 'green', fill: false }
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Hours' } },
                y: { title: { display: true, text: 'Temperature (°)' } }
            }
        }
    });
}

function updateUnits() {
    units = document.getElementById('units').value;
    const city = document.getElementById('city').textContent.split(': ')[1];
    if (city) {
        getWeather(city);
    }
}

let favorites = []; 

function addFavorite() {
    const cityElement = document.getElementById('city');
    const city = cityElement.textContent.trim(); 

    if (city && !favorites.includes(city)) {
        favorites.push(city); 
        updateFavoriteList(); 
        console.log(`${city} added to favorites`); 
    } else {
        console.log(`Could not add ${city} to favorites. It may already exist or be empty.`); 
    }
}

function updateFavoriteList() {
    const favoriteList = document.getElementById('favoriteList');
    favoriteList.innerHTML = ''; 
    favorites.forEach(city => {
        const listItem = document.createElement('li');
        listItem.textContent = city;
        listItem.addEventListener('click', () => {
            console.log(`Fetching weather for: ${city}`); 
            getWeather(city); 
        });
        favoriteList.appendChild(listItem);
    });
}

function getCurrentCity() {
    return document.getElementById('city').textContent.trim();
}
getWeather('Helsinki');
