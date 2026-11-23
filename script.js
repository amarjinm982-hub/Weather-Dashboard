const API_KEY = "de6428b130610fbf66e457feb671fdae";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const themeToggle = document.getElementById("themeToggle");

const loading = document.getElementById("loading");
const error = document.getElementById("error");

const cityName = document.getElementById("cityName");
const weatherDate = document.getElementById("weatherDate");
const description = document.getElementById("description");
const weatherIcon = document.getElementById("weatherIcon");

const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");

const favoriteBtn = document.getElementById("favoriteBtn");
const forecastContainer = document.getElementById("forecastContainer");
const favoritesList = document.getElementById("favoritesList");
const suggestions = document.getElementById("suggestions");

function searchCity() {

    const city = cityInput.value.trim();

    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    getWeather(city);
    getForecast(city);

}

searchBtn.addEventListener("click", searchCity);

let searchTimeout;
let suggestionTimeout;

cityInput.addEventListener("input", function () {

    clearTimeout(searchTimeout);
    clearTimeout(suggestionTimeout);

    const city = cityInput.value.trim();

    if (city.length < 3) {
        suggestions.style.display = "none";
        return;
    }

    suggestionTimeout = setTimeout(function () {
        getSuggestions(city);
    }, 500);

    searchTimeout = setTimeout(function () {
        searchCity();
    }, 500);

});

cityInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        clearTimeout(searchTimeout);
        searchCity();
        suggestions.style.display = "none";
    }

});

async function getWeather(city) {

    loading.style.display = "block";

    temperature.classList.add("skeleton");
    humidity.classList.add("skeleton");
    windSpeed.classList.add("skeleton");
    feelsLike.classList.add("skeleton");

    error.style.display = "none";

    try {

        const URL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

        const response = await fetch(URL);

        if (!response.ok) {
            throw new Error("City not found!");
        }

        const data = await response.json();
        
        temperature.classList.remove("skeleton");
        humidity.classList.remove("skeleton");
        windSpeed.classList.remove("skeleton");
        feelsLike.classList.remove("skeleton");

        cityName.textContent = data.name;

        temperature.textContent = Math.round(data.main.temp) + "°C";

        feelsLike.textContent = Math.round(data.main.feels_like) + "°C";

        humidity.textContent = data.main.humidity + "%";

        windSpeed.textContent = (data.wind.speed * 3.6).toFixed(1) + " km/h";

        description.textContent = data.weather[0].description;

        weatherIcon.textContent = getWeatherIcon(data.weather[0].main);

        weatherDate.textContent = new Date().toDateString();

    } catch (err) {

        error.textContent = err.message;
        error.style.display = "block";

    } finally {

        loading.style.display = "none";

    }

}

function getWeatherIcon(condition) {

    if (condition === "Clear") {
        return "☀️";
    }

    else if (condition === "Clouds") {
        return "☁️";
    }

    else if (condition === "Rain") {
        return "🌧️";
    }

    else if (condition === "Drizzle") {
        return "🌦️";
    }

    else if (condition === "Thunderstorm") {
        return "⛈️";
    }

    else if (condition === "Snow") {
        return "❄️";
    }

    else if (condition === "Mist" || condition === "Haze" || condition === "Fog") {
        return "🌫️";
    }

    else {
        return "🌤️";
    }

}

async function getForecast(city) {

    const URL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    try {

        const response = await fetch(URL);

        if (!response.ok) {
            throw new Error("Forecast not available");
        }

        const data = await response.json();

        const dailyData = {};

        for (const item of data.list) {

            const date = item.dt_txt.split(" ")[0];

            if (!dailyData[date]) {
                dailyData[date] = [];
            }

            dailyData[date].push(item);

        }

        forecastContainer.innerHTML = "";

        const days = Object.values(dailyData).slice(0, 5);

        for (const day of days) {

            let minTemp = day[0].main.temp_min;
            let maxTemp = day[0].main.temp_max;

            for (const item of day) {

                if (item.main.temp_min < minTemp) {
                    minTemp = item.main.temp_min;
                }

                if (item.main.temp_max > maxTemp) {
                    maxTemp = item.main.temp_max;
                }

            }

            const weather = day[Math.floor(day.length / 2)];

            const dateParts = day[0].dt_txt.split(" ")[0].split("-").map(Number);

            const date = new Date(
                dateParts[0],
                dateParts[1] - 1,
                dateParts[2],
                12
            );

            const dayName = date.toLocaleDateString("en-US", {
                weekday: "short"
            });

            const icon = getWeatherIcon(weather.weather[0].main);

            const card = document.createElement("div");

            card.className = "forecast-card";

            card.innerHTML = `
                <h3>${dayName}</h3>
                <p class="forecast-icon">${icon}</p>
                <p>${Math.round(maxTemp)}°C / ${Math.round(minTemp)}°C</p>
                <p>${weather.weather[0].description}</p>
            `;

            forecastContainer.appendChild(card);

        }

    } catch (err) {

        forecastContainer.textContent = err.message;

    }

}

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function displayFavorites() {

    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        favoritesList.textContent = "No favorite cities added yet.";
        return;
    }

    for (const city of favorites) {

        const item = document.createElement("div");

        item.className = "favorite-item";

        const cityButton = document.createElement("button");

        cityButton.textContent = city;
        cityButton.className = "favorite-city";

        cityButton.addEventListener("click", function () {

            cityInput.value = city;

            getWeather(city);
            getForecast(city);

        });

        const removeButton = document.createElement("button");

        removeButton.textContent = "✖";
        removeButton.className = "remove-favorite";

        removeButton.addEventListener("click", function () {
            removeFavorite(city);
        });

        item.appendChild(cityButton);
        item.appendChild(removeButton);

        favoritesList.appendChild(item);

    }

}

function addFavorite() {

    const city = cityName.textContent;

    if (!city || city === "") {
        return;
    }

    if (favorites.includes(city)) {
        alert("City already added!");
        return;
    }

    favorites.push(city);

    localStorage.setItem("favorites", JSON.stringify(favorites));

    displayFavorites();

}

favoriteBtn.addEventListener("click", addFavorite);

function removeFavorite(city) {

    favorites = favorites.filter(function (item) {
        return item !== city;
    });

    localStorage.setItem("favorites", JSON.stringify(favorites));

    displayFavorites();

}

displayFavorites();

async function getSuggestions(city) {

    const URL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${API_KEY}`;

    try {

        const response = await fetch(URL);

        if (!response.ok) {
            throw new Error("Unable to get suggestions");
        }

        const data = await response.json();

        suggestions.innerHTML = "";

        if (data.length === 0) {
            suggestions.style.display = "none";
            return;
        }

        for (const item of data) {

            const suggestion = document.createElement("div");

            suggestion.className = "suggestion-item";

            suggestion.textContent = `${item.name}, ${item.country}`;

            suggestion.addEventListener("click", function () {

                clearTimeout(searchTimeout);

                cityInput.value = item.name;

                suggestions.style.display = "none";

                getWeather(item.name);
                getForecast(item.name);

            });

            suggestions.appendChild(suggestion);

        }

        suggestions.style.display = "block";

    } catch (err) {

        console.log(err.message);

        suggestions.style.display = "none";

    }

}

document.addEventListener("click", function (event) {

    if (
        !cityInput.contains(event.target) &&
        !suggestions.contains(event.target)
    ) {
        suggestions.style.display = "none";
    }

});

themeToggle.addEventListener("click", function () {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark-mode")) {

        themeToggle.textContent = "☀️ Light Mode";

        localStorage.setItem("theme", "dark");

    } else {

        themeToggle.textContent = "🌙 Dark Mode";

        localStorage.setItem("theme", "light");

    }

});

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    themeToggle.textContent = "☀️ Light Mode";

} else {

    document.body.classList.remove("dark-mode");

    themeToggle.textContent = "🌙 Dark Mode";

}