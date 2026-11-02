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
    let selectedProperty = null;
    let requestType = "enquiry";
    let requestPending = false;
    let popupOpener = null;
    let previousOverflow = "";

    const sampleImages = {
        "StayWell Residency": "images/pg1.jpg",
        "Sai Krupa PG": "images/pg2.png",
        "Urban Nest PG": "images/pg3.jpg"
    };

    // Popup styling
    const popupStyle = document.createElement("style");

    popupStyle.textContent = `
        .explore-property-dialog {
            position: fixed;
            inset: 0;
            width: min(560px, calc(100% - 32px));
            max-height: 90vh;
            max-height: 90dvh;
            margin: auto;
            padding: 0;
            overflow-y: auto;
            border: 1px solid #d9d9d5;
            border-radius: 16px;
            background: #ffffff;
            color: #344650;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            font-family: "Poppins", sans-serif;
        }

        .explore-property-dialog::backdrop {
            background: rgba(20, 30, 35, 0.65);
        }

        .explore-popup-content {
            position: relative;
            padding: 32px;
        }

        .explore-popup-close {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 50%;
            background: #f1f1ef;
            color: #344650;
            font-size: 25px;
            cursor: pointer;
        }

        #explorePopupTitle {
            padding-right: 30px;
            font-size: 25px;
            line-height: 1.4;
        }

        #explorePopupLocation,
        #explorePopupPrice {
            margin-top: 10px;
        }

        #explorePopupPrice {
            font-weight: 700;
        }

        .explore-popup-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
        }

        .explore-popup-tabs button {
            padding: 11px 16px;
            border: 1px solid #344650;
            border-radius: 8px;
            background: #ffffff;
            color: #344650;
            font: inherit;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        .explore-popup-tabs button[aria-pressed="true"] {
            background: #344650;
            color: #ffffff;
        }

        #exploreRequestForm {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 24px;
        }

        #exploreRequestForm h3 {
            margin-bottom: 6px;
            font-size: 20px;
        }

        #exploreRequestForm label {
            font-size: 13px;
            font-weight: 600;
        }

        #exploreRequestForm input,
        #exploreRequestForm textarea {
            width: 100%;
            min-width: 0;
            padding: 12px;
            border: 1px solid #d9d9d5;
            border-radius: 8px;
            background: #ffffff;
            color: #344650;
            font: inherit;
            font-size: 16px;
        }

        #exploreRequestForm input:focus,
        #exploreRequestForm textarea:focus {
            outline: 2px solid #344650;
            outline-offset: 2px;
        }

        #exploreRequestForm textarea {
            resize: vertical;
        }

        #exploreVisitFields {
            display: grid;
            gap: 10px;
        }

        #exploreVisitFields[hidden] {
            display: none !important;
        }

        #exploreRequestSubmit {
            margin-top: 10px;
            padding: 13px 20px;
            border: 1px solid #344650;
            border-radius: 8px;
            background: #344650;
            color: #ffffff;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }

        #exploreRequestSubmit:disabled,
        .explore-popup-tabs button:disabled,
        .explore-popup-close:disabled {
            opacity: 0.65;
            cursor: wait;
        }

        #exploreRequestStatus {
            font-size: 14px;
            line-height: 1.7;
            overflow-wrap: anywhere;
        }

        @media (min-width: 951px) {
            .explore-filters {
                grid-template-columns:
                    minmax(0, 1.3fr)
                    minmax(0, 1fr)
                    minmax(0, 1fr)
                    auto;
            }
        }

        @media (min-width: 761px) and (max-width: 950px) {
            .explore-filters {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 760px) {
            .explore-filters {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 480px) {
            .explore-popup-content {
                padding: 28px 20px;
            }
        }
    `;

    document.head.appendChild(popupStyle);

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

        function cleanItems(items) {
            return items.filter(function (item) {
                return typeof item === "string";
            }).map(function (item) {
                return item.trim();
            }).filter(Boolean);
        }

        if (Array.isArray(value)) {
            return cleanItems(value);
        }

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);

                if (Array.isArray(parsed)) {
                    return cleanItems(parsed);
                }
            } catch {
                return cleanItems(value.split(/[,/]/));
            }

            return cleanItems(value.split(/[,/]/));
        }

        return [];
    }

    function normalizeFacility(value) {
        return String(value)
            .toLowerCase()
            .replace(/[\s-]/g, "");
    }

    // Read image path
    function getImageUrl(value) {
        if (typeof value !== "string" || !value.trim()) {
            return "images/pg1.jpg";
        }

        try {
            const url = new URL(value, window.location.href);

            if (
                url.protocol === "https:" ||
                url.protocol === "http:"
            ) {
                return url.href;
            }
        } catch {
            return "images/pg1.jpg";
        }

        return "images/pg1.jpg";
    }

    // Read server response
    async function readResponse(response) {
        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                "Unexpected server response. Please try again."
            );
        }

        if (!response.ok) {
            throw new Error(
                result?.message || "Request failed. Please try again."
            );
        }

        return result;
    }

    // Restore homepage search
    const params = new URLSearchParams(window.location.search);

    locationFilter.value = params.get("location") || "";

    const requestedBudget = params.get("budget");
    const parsedBudget = getPrice(requestedBudget);

    if (requestedBudget && parsedBudget !== null) {
        const budgetValue = String(parsedBudget);

        const exists = Array.from(budgetFilter.options).some(
            function (option) {
                return option.value === budgetValue;
            }
        );

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

    const matchingFacility = Array.from(facilityFilter.options).find(
        function (option) {
            return normalizeFacility(option.value) ===
                normalizeFacility(requestedFacility);
        }
    );

    if (matchingFacility) {
        facilityFilter.value = matchingFacility.value;
    }

    // Create popup
    const propertyDialog = document.createElement("dialog");

    propertyDialog.className = "explore-property-dialog";
    propertyDialog.setAttribute(
        "aria-labelledby",
        "explorePopupTitle"
    );

    propertyDialog.innerHTML = `
        <div class="explore-popup-content">

            <button
                type="button"
                class="explore-popup-close"
                aria-label="Close property details"
            >
                ×
            </button>

            <h2 id="explorePopupTitle"></h2>

            <p id="explorePopupLocation"></p>

            <p id="explorePopupPrice"></p>

            <div
                class="property-features"
                id="explorePopupFacilities"
            ></div>

            <div class="explore-popup-tabs">

                <button
                    type="button"
                    id="exploreEnquiryTab"
                    aria-pressed="true"
                >
                    Enquiry
                </button>

                <button
                    type="button"
                    id="exploreVisitTab"
                    aria-pressed="false"
                >
                    Request a Visit
                </button>

            </div>

            <form id="exploreRequestForm">

                <h3 id="exploreRequestHeading">
                    Send an Enquiry
                </h3>

                <label for="exploreRequestName">
                    Full Name
                </label>

                <input
                    type="text"
                    id="exploreRequestName"
                    name="name"
                    autocomplete="name"
                    maxlength="100"
                    required
                >

                <label for="exploreRequestEmail">
                    Email Address
                </label>

                <input
                    type="email"
                    id="exploreRequestEmail"
                    name="email"
                    autocomplete="email"
                    required
                >

                <label for="exploreRequestPhone">
                    Mobile Number
                </label>

                <input
                    type="tel"
                    id="exploreRequestPhone"
                    name="phone"
                    pattern="[6-9][0-9]{9}"
                    maxlength="10"
                    inputmode="numeric"
                    autocomplete="tel"
                    title="Enter a 10-digit mobile number starting with 6, 7, 8 or 9"
                    required
                >

                <div id="exploreVisitFields" hidden>

                    <label for="exploreVisitDate">
                        Visit Date
                    </label>

                    <input
                        type="date"
                        id="exploreVisitDate"
                        name="date"
                        disabled
                    >

                    <label for="exploreVisitTime">
                        Visit Time
                    </label>

                    <input
                        type="time"
                        id="exploreVisitTime"
                        name="time"
                        disabled
                    >

                </div>

                <label
                    for="exploreRequestMessage"
                    id="exploreMessageLabel"
                >
                    Message
                </label>

                <textarea
                    id="exploreRequestMessage"
                    name="message"
                    rows="3"
                    maxlength="2000"
                    required
                ></textarea>

                <button
                    type="submit"
                    id="exploreRequestSubmit"
                >
                    Send Enquiry
                </button>

                <p
                    id="exploreRequestStatus"
                    role="status"
                    aria-live="polite"
                ></p>

            </form>

        </div>
    `;

    document.body.appendChild(propertyDialog);

    const requestForm = propertyDialog.querySelector(
        "#exploreRequestForm"
    );

    const requestStatus = propertyDialog.querySelector(
        "#exploreRequestStatus"
    );

    const requestSubmit = propertyDialog.querySelector(
        "#exploreRequestSubmit"
    );

    const visitFields = propertyDialog.querySelector(
        "#exploreVisitFields"
    );

    const visitDate = propertyDialog.querySelector(
        "#exploreVisitDate"
    );

    const visitTime = propertyDialog.querySelector(
        "#exploreVisitTime"
    );

    const requestMessage = propertyDialog.querySelector(
        "#exploreRequestMessage"
    );

    const enquiryTab = propertyDialog.querySelector(
        "#exploreEnquiryTab"
    );

    const visitTab = propertyDialog.querySelector(
        "#exploreVisitTab"
    );

    const closeButton = propertyDialog.querySelector(
        ".explore-popup-close"
    );

    // Today's date
    function getToday() {
        const today = new Date();

        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    }

    // Switch form
    function selectRequestType(type) {
        if (requestPending) {
            return;
        }

        requestType = type;

        const isVisit = type === "visit";

        visitFields.hidden = !isVisit;
        visitDate.disabled = !isVisit;
        visitTime.disabled = !isVisit;
        visitDate.required = isVisit;
        visitTime.required = isVisit;
        visitDate.min = getToday();

        requestMessage.required = !isVisit;

        propertyDialog.querySelector(
            "#exploreMessageLabel"
        ).textContent = isVisit
            ? "Message (optional)"
            : "Message";

        propertyDialog.querySelector(
            "#exploreRequestHeading"
        ).textContent = isVisit
            ? "Request a Visit"
            : "Send an Enquiry";

        requestSubmit.textContent = isVisit
            ? "Submit Visit Request"
            : "Send Enquiry";

        enquiryTab.setAttribute(
            "aria-pressed",
            String(!isVisit)
        );

        visitTab.setAttribute(
            "aria-pressed",
            String(isVisit)
        );

        requestStatus.textContent = "";
    }

    // Open property details
    function openPropertyPopup(pg, opener) {
        if (requestPending || propertyDialog.open) {
            return;
        }

        selectedProperty = pg;
        popupOpener = opener;

        requestForm.reset();
        selectRequestType("enquiry");

        propertyDialog.querySelector(
            "#explorePopupTitle"
        ).textContent = String(
            pg.name || pg.title || "PG Accommodation"
        );

        propertyDialog.querySelector(
            "#explorePopupLocation"
        ).textContent = String(pg.location || "");

        const price = getPrice(pg.price);

        propertyDialog.querySelector(
            "#explorePopupPrice"
        ).textContent = price === null
            ? "Rent on enquiry"
            : `₹${price.toLocaleString("en-IN")} / month`;

        const facilities = propertyDialog.querySelector(
            "#explorePopupFacilities"
        );

        facilities.replaceChildren();

        getFacilities(pg).forEach(function (facility) {
            const badge = document.createElement("span");
            badge.textContent = facility;

            facilities.appendChild(badge);
        });

        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        propertyDialog.showModal();
    }

    // Close popup
    closeButton.addEventListener("click", function () {
        if (!requestPending) {
            propertyDialog.close();
        }
    });

    propertyDialog.addEventListener("click", function (event) {
        if (
            requestPending ||
            event.target !== propertyDialog
        ) {
            return;
        }

        const bounds = propertyDialog.getBoundingClientRect();

        const outside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

        if (outside) {
            propertyDialog.close();
        }
    });

    propertyDialog.addEventListener("cancel", function (event) {
        if (requestPending) {
            event.preventDefault();
        }
    });

    propertyDialog.addEventListener("close", function () {
        document.body.style.overflow = previousOverflow;

        if (popupOpener?.isConnected) {
            popupOpener.focus();
        }
    });

    enquiryTab.addEventListener("click", function () {
        selectRequestType("enquiry");
    });

    visitTab.addEventListener("click", function () {
        selectRequestType("visit");
    });

    // Submit form
    requestForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (
            requestPending ||
            !selectedProperty ||
            !requestForm.reportValidity()
        ) {
            return;
        }

        if (requestType === "visit") {
            const appointment = new Date(
                `${visitDate.value}T${visitTime.value}`
            );

            if (
                !Number.isFinite(appointment.getTime()) ||
                appointment <= new Date()
            ) {
                requestStatus.textContent =
                    "Please select a future visit date and time.";

                requestStatus.style.color = "#b42318";
                return;
            }
        }

        const propertyName =
            selectedProperty.name ||
            selectedProperty.title ||
            "PG Accommodation";

        const formData = new FormData(requestForm);

        const name = String(
            formData.get("name") || ""
        ).trim();

        const email = String(
            formData.get("email") || ""
        ).trim();

        const phone = String(
            formData.get("phone") || ""
        ).trim();

        const message = String(
            formData.get("message") || ""
        ).trim();

        if (!name) {
            requestStatus.textContent =
                "Please enter your full name.";

            requestStatus.style.color = "#b42318";
            return;
        }

        if (requestType === "enquiry" && !message) {
            requestStatus.textContent =
                "Please enter your enquiry message.";

            requestStatus.style.color = "#b42318";
            return;
        }

        const payload = {
            name,
            email,
            phone,
            message: `PG: ${propertyName}\n${message}`
        };

        const endpoint = requestType === "visit"
            ? "/api/visits"
            : "/api/enquiries";

        if (requestType === "visit") {
            payload.date = visitDate.value;
            payload.time = visitTime.value;
        }

        requestPending = true;

        requestSubmit.disabled = true;
        requestSubmit.textContent = "Submitting...";
        enquiryTab.disabled = true;
        visitTab.disabled = true;
        closeButton.disabled = true;

        const fields = requestForm.querySelectorAll(
            "input, textarea"
        );

        fields.forEach(function (field) {
            field.readOnly = true;
        });

        requestStatus.textContent = "";
        requestForm.setAttribute("aria-busy", "true");

        const controller = new AbortController();

        const timeout = setTimeout(function () {
            controller.abort();
        }, 60000);

        try {
            const response = await fetch(
                `${API_URL}${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                }
            );

            const result = await readResponse(response);

            if (!result?.success) {
                throw new Error(
                    result?.message ||
                    "Could not submit your request."
                );
            }

            requestForm.reset();

            requestStatus.textContent =
                result.message ||
                "Request submitted successfully!";

            requestStatus.style.color = "#218838";

        } catch (error) {
            if (error.name === "AbortError") {
                requestStatus.textContent =
                    "The server took too long to respond. Your request may have been saved; check before submitting again.";
            } else if (error instanceof TypeError) {
                requestStatus.textContent =
                    "Connection interrupted. Your request may have been saved; check before submitting again.";
            } else {
                requestStatus.textContent = error.message;
            }

            requestStatus.style.color = "#b42318";

        } finally {
            clearTimeout(timeout);

            requestPending = false;

            requestSubmit.disabled = false;
            enquiryTab.disabled = false;
            visitTab.disabled = false;
            closeButton.disabled = false;

            fields.forEach(function (field) {
                field.readOnly = false;
            });

            requestSubmit.textContent = requestType === "visit"
                ? "Submit Visit Request"
                : "Send Enquiry";

            requestForm.removeAttribute("aria-busy");
        }
    });

    // Create PG card
    function createPropertyCard(pg) {
        const name = String(
            pg.name || pg.title || "PG Accommodation"
        );

        const location = String(
            pg.location || "Location not available"
        );

        const price = getPrice(pg.price);
        const rating = String(pg.rating || "New");

        const card = document.createElement("article");
        card.className = "property-card";

        const imageBox = document.createElement("div");
        imageBox.className = "property-image";

        const image = document.createElement("img");

        image.src = getImageUrl(
            pg.image ||
            pg.image_url ||
            sampleImages[name]
        );

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

        ratingLabel.append(
            star,
            document.createTextNode(` ${rating}`)
        );

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

        if (facilities.length > 0) {
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

        const detailsButton = document.createElement("button");

        detailsButton.type = "button";
        detailsButton.className = "view-btn";
        detailsButton.textContent = "View Details";

        detailsButton.setAttribute(
            "aria-label",
            `View details for ${name}`
        );

        detailsButton.addEventListener("click", function () {
            openPropertyPopup(pg, detailsButton);
        });

        priceRow.append(priceBox, detailsButton);

        info.appendChild(priceRow);
        card.append(imageBox, info);

        return card;
    }

    // Show PG cards
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

    // Apply search filters
    function filterProperties() {
        if (!isLoaded) {
            return;
        }

        const location = locationFilter.value
            .trim()
            .toLowerCase();

        const budget = getPrice(budgetFilter.value);

        const facility = normalizeFacility(
            facilityFilter.value
        );

        const filtered = allProperties.filter(function (pg) {
            const pgLocation = String(
                pg.location || ""
            ).toLowerCase();

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

    // Load PG data
    async function loadProperties() {
        isLoaded = false;
        noProperties.hidden = true;

        propertiesGrid.setAttribute("aria-busy", "true");

        propertiesGrid.innerHTML =
            "<p>Loading PG listings...</p>";

        listingCount.textContent = "Loading properties...";

        try {
            const response = await fetch(`${API_URL}/api/pgs`);
            const data = await readResponse(response);

            if (!Array.isArray(data)) {
                throw new Error(
                    "Unexpected PG listing response."
                );
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

            const container = document.createElement("div");
            container.style.gridColumn = "1 / -1";
            container.style.textAlign = "center";

            const message = document.createElement("p");

            message.textContent =
                "Unable to load PG listings. Please try again.";

            message.style.marginBottom = "16px";

            const retryButton = document.createElement("button");

            retryButton.type = "button";
            retryButton.className = "primary-btn";
            retryButton.textContent = "Try Again";

            retryButton.addEventListener(
                "click",
                loadProperties
            );

            container.append(message, retryButton);
            propertiesGrid.appendChild(container);

            listingCount.textContent =
                "Unable to load properties";

        } finally {
            propertiesGrid.setAttribute("aria-busy", "false");
        }
    }

    // Search events
    filterBtn.addEventListener("click", filterProperties);

    locationFilter.addEventListener(
        "input",
        filterProperties
    );

    budgetFilter.addEventListener(
        "change",
        filterProperties
    );

    facilityFilter.addEventListener(
        "change",
        filterProperties
    );

    locationFilter.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterProperties();
        }
    });

    loadProperties();

});
