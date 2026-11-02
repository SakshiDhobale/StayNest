document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "https://staynest-kl5u.onrender.com";

    const propertiesGrid = document.getElementById("propertiesGrid");
    const listingCount = document.getElementById("listingCount");
    const noProperties = document.getElementById("noProperties");

    const locationFilter = document.getElementById("locationFilter");
    const budgetFilter = document.getElementById("budgetFilter");
    const filterBtn = document.getElementById("filterBtn");

    if (
        !propertiesGrid ||
        !listingCount ||
        !noProperties ||
        !locationFilter ||
        !budgetFilter ||
        !filterBtn
    ) {
        return;
    }

    let allProperties = [];
    let isLoaded = false;

    // Facility filter
    let facilityFilter = document.getElementById("facilityFilter");

    if (!facilityFilter) {
        const group = document.createElement("div");
        group.className = "filter-group";

        const label = document.createElement("label");
        label.htmlFor = "facilityFilter";
        label.textContent = "Facility";

        facilityFilter = document.createElement("select");
        facilityFilter.id = "facilityFilter";

        [
            ["", "Any Facility"],
            ["Wi-Fi", "Wi-Fi"],
            ["Meals", "Meals"],
            ["AC", "AC"],
            ["Furnished", "Furnished"]
        ].forEach(function (item) {
            facilityFilter.add(new Option(item[1], item[0]));
        });

        group.append(label, facilityFilter);
        filterBtn.before(group);
    }

    // Read price
    function getPrice(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const text = String(value).trim();

        if (!text) {
            return null;
        }

        const price = Number(text.replace(/[₹,\s]/g, ""));

        return Number.isFinite(price) && price >= 0
            ? price
            : null;
    }

    // Read facilities
    function getFacilities(pg) {
        const value = pg.facilities || pg.amenities || [];

        if (Array.isArray(value)) {
            return value
                .filter(function (item) {
                    return typeof item === "string";
                })
                .map(function (item) {
                    return item.trim();
                })
                .filter(Boolean);
        }

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);

                if (Array.isArray(parsed)) {
                    return parsed.filter(function (item) {
                        return typeof item === "string" && item.trim();
                    });
                }
            } catch {
                return value.split(/[,/]/).map(function (item) {
                    return item.trim();
                }).filter(Boolean);
            }
        }

        return [];
    }

    function normalizeFacility(value) {
        return String(value)
            .toLowerCase()
            .replace(/[\s-]/g, "");
    }

    // Check image path
    function getImageUrl(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "images/pg1.jpg";
        }

        try {
            const url = new URL(value, window.location.href);

            if (url.protocol === "https:" || url.protocol === "http:") {
                return url.href;
            }
        } catch {
            return "images/pg1.jpg";
        }

        return "images/pg1.jpg";
    }

    // Restore homepage filters
    const params = new URLSearchParams(window.location.search);

    locationFilter.value = params.get("location") || "";

    const requestedBudget = params.get("budget");
    const parsedBudget = getPrice(requestedBudget);

    if (requestedBudget && parsedBudget !== null) {
        const budgetValue = String(parsedBudget);

        const exists = Array.from(budgetFilter.options).some(function (option) {
            return option.value === budgetValue;
        });

        if (!exists) {
            budgetFilter.add(
                new Option(
                    `Up to ₹${parsedBudget.toLocaleString("en-IN")}`,
                    budgetValue
                )
            );
        }

        budgetFilter.value = budgetValue;
    }

    const requestedFacility = params.get("facility") || "";

    const matchedFacility = Array.from(facilityFilter.options).find(
        function (option) {
            return normalizeFacility(option.value) ===
                normalizeFacility(requestedFacility);
        }
    );

    if (matchedFacility) {
        facilityFilter.value = matchedFacility.value;
    }

    // Load properties
    async function loadProperties() {
        isLoaded = false;
        noProperties.hidden = true;
        propertiesGrid.setAttribute("aria-busy", "true");

        propertiesGrid.innerHTML = "<p>Loading PG listings...</p>";
        listingCount.textContent = "Loading properties...";

        try {
            const response = await fetch(`${API_URL}/api/pgs`);

            if (!response.ok) {
                throw new Error("Unable to load PG listings.");
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Unexpected PG listing response.");
            }

            allProperties = data.filter(function (pg) {
                return pg && typeof pg === "object";
            });

            isLoaded = true;
            filterProperties();

        } catch (error) {
            console.error("Error loading PGs:", error);

            propertiesGrid.replaceChildren();
            noProperties.hidden = true;

            const message = document.createElement("p");
            message.textContent =
                "Unable to load PG listings. Please try again.";

            const retryButton = document.createElement("button");
            retryButton.type = "button";
            retryButton.className = "primary-btn";
            retryButton.textContent = "Try Again";

            retryButton.addEventListener("click", loadProperties);

            const container = document.createElement("div");
            container.style.gridColumn = "1 / -1";
            container.style.textAlign = "center";

            message.style.marginBottom = "16px";

            container.append(message, retryButton);
            propertiesGrid.appendChild(container);

            listingCount.textContent = "Unable to load properties";

        } finally {
            propertiesGrid.setAttribute("aria-busy", "false");
        }
    }

    // Build property card
    function createPropertyCard(pg) {
        const name = String(pg.name || pg.title || "PG Accommodation");
        const location = String(pg.location || "Location not available");
        const price = getPrice(pg.price);
        const rating = String(pg.rating || "New");

        const card = document.createElement("article");
        card.className = "property-card";

        const imageBox = document.createElement("div");
        imageBox.className = "property-image";

        const image = document.createElement("img");
        image.src = getImageUrl(pg.image || pg.image_url);
        image.alt = name;
        image.loading = "lazy";

        image.addEventListener("error", function () {
            image.src = "images/pg1.jpg";
        }, { once: true });

        imageBox.appendChild(image);

        const info = document.createElement("div");
        info.className = "property-info";

        const titleRow = document.createElement("div");
        titleRow.className = "property-title-row";

        const title = document.createElement("h3");
        title.textContent = name;

        const ratingLabel = document.createElement("span");
        ratingLabel.className = "rating";

        const star = document.createElement("i");
        star.className = "fa-solid fa-star";
        star.setAttribute("aria-hidden", "true");

        ratingLabel.append(star, document.createTextNode(` ${rating}`));
        titleRow.append(title, ratingLabel);

        const locationLabel = document.createElement("p");
        locationLabel.className = "location";

        const locationIcon = document.createElement("i");
        locationIcon.className = "fa-solid fa-location-dot";
        locationIcon.setAttribute("aria-hidden", "true");

        locationLabel.append(
            locationIcon,
            document.createTextNode(` ${location}`)
        );

        info.append(titleRow, locationLabel);

        if (pg.description) {
            const description = document.createElement("p");
            description.className = "property-description";
            description.textContent = String(pg.description);

            info.appendChild(description);
        }

        const facilities = getFacilities(pg);

        if (facilities.length) {
            const features = document.createElement("div");
            features.className = "property-features";

            facilities.forEach(function (facility) {
                const badge = document.createElement("span");
                badge.textContent = facility;
                features.appendChild(badge);
            });

            info.appendChild(features);
        }

        const priceRow = document.createElement("div");
        priceRow.className = "price-row";
        priceRow.style.marginTop = "20px";

        const priceBox = document.createElement("div");
        priceBox.className = "price";

        const priceLabel = document.createElement("strong");
        priceLabel.textContent = price === null
            ? "Rent on enquiry"
            : `₹${price.toLocaleString("en-IN")}`;

        priceBox.appendChild(priceLabel);

        if (price !== null) {
            const period = document.createElement("span");
            period.textContent = " / month";
            priceBox.appendChild(period);
        }

        priceRow.appendChild(priceBox);

        if (pg.id !== null && pg.id !== undefined && String(pg.id) !== "") {
            const detailsLink = document.createElement("a");
            detailsLink.className = "view-btn";
            detailsLink.href =
                `pg-details.html?id=${encodeURIComponent(pg.id)}`;
            detailsLink.textContent = "View Details";
            detailsLink.setAttribute(
                "aria-label",
                `View details for ${name}`
            );

            priceRow.appendChild(detailsLink);
        } else {
            const unavailable = document.createElement("span");
            unavailable.textContent = "Details unavailable";
            unavailable.style.fontSize = "12px";

            priceRow.appendChild(unavailable);
        }

        info.appendChild(priceRow);
        card.append(imageBox, info);

        return card;
    }

    // Display results
    function displayProperties(properties) {
        propertiesGrid.replaceChildren();

        listingCount.textContent =
            `${properties.length} PG${properties.length === 1 ? "" : "s"} found`;

        noProperties.hidden = properties.length !== 0;

        const fragment = document.createDocumentFragment();

        properties.forEach(function (pg) {
            fragment.appendChild(createPropertyCard(pg));
        });

        propertiesGrid.appendChild(fragment);
    }

    // Apply filters
    function filterProperties() {
        if (!isLoaded) return;

        const location = locationFilter.value.trim().toLowerCase();
        const budget = getPrice(budgetFilter.value);
        const facility = normalizeFacility(facilityFilter.value);

        const filtered = allProperties.filter(function (pg) {
            const pgLocation = String(pg.location || "").toLowerCase();
            const pgPrice = getPrice(pg.price);

            const locationMatch =
                !location || pgLocation.includes(location);

            const budgetMatch =
                budget === null ||
                (pgPrice !== null && pgPrice <= budget);

            const facilityMatch =
                !facility ||
                getFacilities(pg).some(function (item) {
                    return normalizeFacility(item) === facility;
                });

            return locationMatch && budgetMatch && facilityMatch;
        });

        displayProperties(filtered);
    }

    // Filter buttons
    filterBtn.addEventListener("click", filterProperties);
    locationFilter.addEventListener("input", filterProperties);
    budgetFilter.addEventListener("change", filterProperties);
    facilityFilter.addEventListener("change", filterProperties);

    locationFilter.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterProperties();
        }
    });

    loadProperties();

});
