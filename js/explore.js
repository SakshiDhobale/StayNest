
const API_URL = "https://staynest-kl5u.onrender.com";

const propertiesGrid = document.getElementById("propertiesGrid");
const listingCount = document.getElementById("listingCount");
const noProperties = document.getElementById("noProperties");

const locationFilter = document.getElementById("locationFilter");
const budgetFilter = document.getElementById("budgetFilter");
const filterBtn = document.getElementById("filterBtn");

let allProperties = [];

async function loadProperties() {
    try {
        propertiesGrid.innerHTML = "<p>Loading PG listings...</p>";

        const response = await fetch(`${API_URL}/api/pgs`);

        if (!response.ok) {
            throw new Error("Unable to load PG listings");
        }

        const data = await response.json();

        allProperties = Array.isArray(data) ? data : [];
        displayProperties(allProperties);

    } catch (error) {
        console.error("Error loading PGs:", error);
        propertiesGrid.innerHTML =
            "<p>Unable to load PG listings. Please try again later.</p>";
        listingCount.textContent = "Unable to load properties";
    }
}

function displayProperties(properties) {
    propertiesGrid.innerHTML = "";

    listingCount.textContent = `${properties.length} PGs found`;

    if (properties.length === 0) {
        noProperties.hidden = false;
        return;
    }

    noProperties.hidden = true;

    properties.forEach((pg) => {
        const name = pg.name || pg.title || "PG Accommodation";
        const location = pg.location || "Location not available";
        const price = Number(pg.price || 0);
        const rating = pg.rating || "New";
        const image = pg.image || pg.image_url || "images/pg1.jpg";

        const card = document.createElement("div");
        card.className = "property-card";

        card.innerHTML = `
            <img src="${image}" alt="${name}"
                 onerror="this.src='images/pg1.jpg'">

            <div class="property-info">
                <h3>${name}</h3>
                <p class="property-location">
                    <i class="fa-solid fa-location-dot"></i>
                    ${location}
                </p>

                <div class="property-price">
                    <strong>₹${price.toLocaleString("en-IN")}</strong>
                    <span>/ month</span>
                </div>

                <p class="property-rating">
                    <i class="fa-solid fa-star"></i> ${rating}
                </p>

                <a href="pg-details.html?id=${encodeURIComponent(pg.id || "")}"
                   class="primary-btn">
                    View Details
                </a>
            </div>
        `;

        propertiesGrid.appendChild(card);
    });
}

function filterProperties() {
    const location = locationFilter.value.trim().toLowerCase();
    const budget = Number(budgetFilter.value);

    const filtered = allProperties.filter((pg) => {
        const pgLocation = (pg.location || "").toLowerCase();
        const pgPrice = Number(pg.price || 0);

        const locationMatch = !location || pgLocation.includes(location);
        const budgetMatch = !budget || pgPrice <= budget;

        return locationMatch && budgetMatch;
    });

    displayProperties(filtered);
}

filterBtn.addEventListener("click", filterProperties);

locationFilter.addEventListener("input", filterProperties);
budgetFilter.addEventListener("change", filterProperties);

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}

const params = new URLSearchParams(window.location.search);
locationFilter.value = params.get("location") || "";
budgetFilter.value = params.get("budget") || "";

loadProperties();
