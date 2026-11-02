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
    let savedOverflow = "";

    const sampleImages = {
        "StayWell Residency": "images/pg1.jpg",
        "Sai Krupa PG": "images/pg2.png",
        "Urban Nest PG": "images/pg3.jpg"
    };

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

    // Check image path
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

    // Read API response
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

    // Restore homepage filters
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

    // Property popup
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

            <div class="modal-actions">

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
                    class="primary-btn"
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
        "#exploreVisit
