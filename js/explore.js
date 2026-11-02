document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "https://staynest-kl5u.onrender.com";
    const grid = document.getElementById("propertiesGrid");
    const count = document.getElementById("listingCount");
    const empty = document.getElementById("noProperties");
    const locationInput = document.getElementById("locationFilter");
    const budgetInput = document.getElementById("budgetFilter");
    const searchButton = document.getElementById("filterBtn");

    if (!grid || !count || !empty || !locationInput ||
        !budgetInput || !searchButton) {
        return;
    }

    let properties = [];
    let selectedProperty = null;
    let requestType = "enquiry";
    let pending = false;
    let opener = null;
    let previousOverflow = "";

    // Sample listing details
    const information = {
        "StayWell Residency": {
            image: "images/pg1.jpg",
            suitable: "Girl students and working women",
            description:
                "A comfortable PG in Lokmanya Nagar, Nagpur, for girl students and working women. Furnished rooms, Wi-Fi and meals support a convenient daily routine.",
            rooms: [
                ["Single Room", "1 Person", 7000],
                ["Double Sharing", "2 Persons", 5500],
                ["Triple Sharing", "3 Persons", 4500]
            ]
        },
        "Sai Krupa PG": {
            image: "images/pg2.png",
            suitable: "Girl students and working women",
            description:
                "Located in Vasudev Nagar, Nagpur, this PG offers a convenient stay for girl students and working women. The sample listing includes security, laundry and Wi-Fi facilities.",
            rooms: [
                ["Single Room", "1 Person", 7500],
                ["Double Sharing", "2 Persons", 6000],
                ["Triple Sharing", "3 Persons", 5000]
            ]
        },
        "Urban Nest PG": {
            image: "images/pg3.jpg",
            suitable: "Boy students and working men",
            description:
                "A furnished PG on Hingna Road, Nagpur, for boy students and working men. Wi-Fi and AC options make it suitable for study and work routines.",
            rooms: [
                ["Single Room", "1 Person", 8000],
                ["Double Sharing", "2 Persons", 7000],
                ["AC Room", "1 Person", 8500]
            ]
        }
    };

    // Page styling
    const style = document.createElement("style");

    style.textContent = `
        #propertiesGrid .property-card {
            display: flex;
            flex-direction: column;
            background: #fff;
        }
        #propertiesGrid .property-image {
            height: 230px;
            flex-shrink: 0;
        }
        #propertiesGrid .property-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        #propertiesGrid .property-info {
            display: flex;
            flex-direction: column;
            flex: 1;
            padding: 22px;
        }
        #propertiesGrid .property-description {
            font-size: 13px;
            line-height: 1.8;
        }
        #propertiesGrid .price-row {
            margin-top: auto;
            padding-top: 20px;
            flex-wrap: wrap;
        }
        #propertiesGrid .view-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 44px;
            padding: 11px 18px;
            border: 1px solid #344650;
            background: #fff;
            color: #344650;
            font-weight: 600;
            font-size: 13px;
        }
        #propertiesGrid .view-btn:hover {
            background: #344650;
            color: #fff;
        }
        .sn-dialog {
            position: fixed;
            inset: 0;
            width: min(900px, calc(100% - 32px));
            max-height: 90vh;
            max-height: 90dvh;
            margin: auto;
            padding: 0;
            overflow-y: auto;
            border: none;
            border-radius: 16px;
            background: #fff;
            color: #344650;
            font-family: "Poppins", sans-serif;
        }
        .sn-dialog::backdrop {
            background: rgba(20, 30, 35, .65);
        }
        .sn-dialog [hidden] {
            display: none !important;
        }
        .sn-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
        }
        .sn-photo {
            width: 100%;
            height: 100%;
            min-height: 420px;
            object-fit: cover;
        }
        .sn-info {
            min-width: 0;
            padding: 40px 30px 30px;
        }
        .sn-info h2 {
            padding-right: 20px;
            font-size: 26px;
            line-height: 1.4;
        }
        .sn-location,
        .sn-description {
            margin-top: 14px;
            color: #626b6f;
            font-size: 13px;
            line-height: 1.8;
        }
        .sn-suitable {
            margin-top: 16px;
            font-size: 13px;
            font-weight: 600;
        }
        .sn-price {
            margin-top: 20px;
            font-size: 21px;
            font-weight: 700;
        }
        .sn-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 24px;
        }
        .sn-actions button,
        .sn-back {
            padding: 12px 14px;
            border: 1px solid #344650;
            border-radius: 8px;
            background: #fff;
            color: #344650;
            font: inherit;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .sn-actions .sn-main {
            background: #344650;
            color: #fff;
        }
        .sn-close {
            position: absolute;
            top: 10px;
            right: 12px;
            z-index: 2;
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 50%;
            background: #f1f1ef;
            color: #344650;
            font-size: 25px;
            cursor: pointer;
        }
        .sn-rooms {
            margin-top: 22px;
        }
        .sn-room {
            margin-top: 10px;
            padding: 12px;
            border: 1px solid #d9d9d5;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.8;
        }
        .sn-note {
            margin-top: 12px;
            color: #626b6f;
            font-size: 11px;
            line-height: 1.7;
        }
        .sn-form-view {
            max-width: 520px;
            margin: auto;
            padding: 42px 28px 28px;
        }
        .sn-form-view h2 {
            margin: 20px 0 8px;
        }
        .sn-form {
            display: grid;
            gap: 10px;
            margin-top: 20px;
        }
        .sn-form label {
            font-size: 13px;
            font-weight: 600;
        }
        .sn-form input,
        .sn-form textarea {
            width: 100%;
            min-width: 0;
            padding: 12px;
            border: 1px solid #d9d9d5;
            border-radius: 8px;
            background: #fff;
            color: #344650;
            font: inherit;
            font-size: 16px;
        }
        .sn-form textarea {
            resize: vertical;
        }
        .sn-form input:focus,
        .sn-form textarea:focus {
            outline: 2px solid #344650;
            outline-offset: 2px;
        }
        .sn-date-fields {
            display: grid;
            gap: 10px;
        }
        .sn-submit {
            margin-top: 10px;
            padding: 13px;
            border: none;
            border-radius: 8px;
            background: #344650;
            color: #fff;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }
        .sn-dialog button:disabled {
            opacity: .6;
            cursor: wait;
        }
        .sn-status {
            font-size: 13px;
            line-height: 1.7;
            overflow-wrap: anywhere;
        }
        @media (min-width: 951px) {
            .explore-filters {
                grid-template-columns:
                    minmax(0, 1.3fr) minmax(0, 1fr)
                    minmax(0, 1fr) auto;
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
            .sn-layout {
                grid-template-columns: 1fr;
            }
            .sn-photo {
                height: 230px;
                min-height: 0;
            }
            .sn-info {
                padding: 24px 20px;
            }
            .sn-form-view {
                padding: 42px 20px 24px;
            }
        }
    `;

    document.head.appendChild(style);

    // Helpers
    function getName(pg) {
        return String(pg.name || pg.title || "PG Accommodation");
    }

    function getInformation(pg) {
        return information[getName(pg)] || {};
    }

    function getPrice(value) {
        if (value === null || value === undefined ||
            String(value).trim() === "") {
            return null;
        }

        const number = Number(String(value).replace(/[₹,\s]/g, ""));

        return Number.isFinite(number) && number >= 0 ? number : null;
    }

    function rent(value) {
        const price = getPrice(value);

        return price === null
            ? "Rent on enquiry"
            : `₹${price.toLocaleString("en-IN")} / month`;
    }

    function facilities(pg) {
        let value = pg.facilities || pg.amenities || [];

        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch {
                value = value.split(/[,/]/);
            }
        }

        return Array.isArray(value)
            ? value.filter(item => typeof item === "string")
                .map(item => item.trim()).filter(Boolean)
            : [];
    }

    function normalize(value) {
        return String(value).toLowerCase().replace(/[\s-]/g, "");
    }

    function setImage(image, pg) {
        const candidate = pg.image || pg.image_url ||
            getInformation(pg).image || "images/pg1.jpg";

        let source = "images/pg1.jpg";

        try {
            const url = new URL(candidate, window.location.href);

            if (["https:", "http:"].includes(url.protocol)) {
                source = url.href;
            }
        } catch {
            source = "images/pg1.jpg";
        }

        image.onerror = function () {
            image.onerror = null;
            image.src = "images/pg1.jpg";
        };

        image.src = source;
        image.alt = getName(pg);
    }

    function addBadges(container, pg) {
        container.replaceChildren();

        facilities(pg).forEach(function (facility) {
            const badge = document.createElement("span");
            badge.textContent = facility;
            container.appendChild(badge);
        });
    }

    async function readResponse(response) {
        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Unexpected server response. Please try again.");
        }

        if (!response.ok) {
            throw new Error(data?.message || "Request failed.");
        }

        return data;
    }

    // Facility filter
    let facilityInput = document.getElementById("facilityFilter");

    if (!facilityInput) {
        const group = document.createElement("div");
        group.className = "filter-group";

        const label = document.createElement("label");
        label.htmlFor = "facilityFilter";
        label.textContent = "Facility";

        facilityInput = document.createElement("select");
        facilityInput.id = "facilityFilter";

        ["", "Wi-Fi", "Meals", "AC", "Furnished"].forEach(function (value) {
            facilityInput.add(new Option(value || "Any Facility", value));
        });

        group.append(label, facilityInput);
        searchButton.before(group);
    }

    // Popup
    const dialog = document.createElement("dialog");
    dialog.className = "sn-dialog";
    dialog.setAttribute("aria-label", "Property details and requests");

    dialog.innerHTML = `
        <button type="button" class="sn-close" aria-label="Close popup">×</button>

        <div class="sn-layout" id="snDetails">
            <img class="sn-photo" id="snPhoto" alt="">

            <div class="sn-info">
                <h2 id="snTitle"></h2>
                <p class="sn-location" id="snLocation"></p>
                <p class="sn-description" id="snDescription"></p>
                <p class="sn-suitable" id="snSuitable"></p>
                <p class="sn-price" id="snPrice"></p>
                <div class="property-features" id="snFacilities"></div>

                <div class="sn-actions">
                    <button type="button" id="snRoomsButton">View Rooms</button>
                    <button type="button" class="sn-main" id="snEnquiryButton">
                        Enquire Now →
                    </button>
                    <button type="button" id="snVisitButton">Request a Visit</button>
                </div>

                <div class="sn-rooms" id="snRooms" hidden></div>

                
            </div>
        </div>

        <div class="sn-form-view" id="snFormView" hidden>
            <button type="button" class="sn-back" id="snBack">
                ← Back to Details
            </button>

            <h2 id="snFormTitle">Send an Enquiry</h2>
            <p id="snFormProperty"></p>

            <form class="sn-form" id="snForm">
                <label for="snName">Full Name</label>
                <input id="snName" name="name" autocomplete="name"
                    maxlength="100" required>

                <label for="snEmail">Email Address</label>
                <input type="email" id="snEmail" name="email"
                    autocomplete="email" required>

                <label for="snPhone">Mobile Number</label>
                <input type="tel" id="snPhone" name="phone"
                    autocomplete="tel" inputmode="numeric"
                    pattern="[6-9][0-9]{9}" maxlength="10"
                    title="Enter a 10-digit mobile number starting with 6, 7, 8 or 9"
                    required>

                <div class="sn-date-fields" id="snDateFields" hidden>
                    <label for="snDate">Visit Date</label>
                    <input type="date" id="snDate" name="date" disabled>

                    <label for="snTime">Visit Time</label>
                    <input type="time" id="snTime" name="time" disabled>
                </div>

                <label for="snMessage" id="snMessageLabel">Message</label>
                <textarea id="snMessage" name="message"
                    rows="3" maxlength="2000" required></textarea>

                <button class="sn-submit" type="submit" id="snSubmit">
                    Send Enquiry
                </button>

                <p class="sn-status" id="snStatus"
                    role="status" aria-live="polite"></p>
            </form>
        </div>
    `;

    document.body.appendChild(dialog);

    const find = id => dialog.querySelector("#" + id);
    const details = find("snDetails");
    const formView = find("snFormView");
    const form = find("snForm");
    const status = find("snStatus");
    const submit = find("snSubmit");
    const close = dialog.querySelector(".sn-close");
    const back = find("snBack");

    function openProperty(pg, button) {
        if (pending || dialog.open) return;

        selectedProperty = pg;
        opener = button;

        const info = getInformation(pg);

        setImage(find("snPhoto"), pg);

        find("snTitle").textContent = getName(pg);
        find("snLocation").textContent = String(pg.location || "");
        find("snDescription").textContent = String(
            pg.description || info.description || "Enquire for more PG details."
        );
        find("snSuitable").textContent = info.suitable
            ? `Suitable for: ${info.suitable}` : "";
        find("snPrice").textContent = rent(pg.price);

        addBadges(find("snFacilities"), pg);

        find("snRooms").hidden = true;
        find("snRoomsButton").textContent = "View Rooms";

        details.hidden = false;
        formView.hidden = true;

        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        dialog.showModal();
        dialog.scrollTop = 0;
    }

    function closePopup() {
        if (!pending) dialog.close();
    }

    close.addEventListener("click", closePopup);

    dialog.addEventListener("cancel", function (event) {
        if (pending) event.preventDefault();
    });

    dialog.addEventListener("click", function (event) {
        if (event.target !== dialog || pending) return;

        const bounds = dialog.getBoundingClientRect();

        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) {
            closePopup();
        }
    });

    dialog.addEventListener("close", function () {
        document.body.style.overflow = previousOverflow;
        if (opener?.isConnected) opener.focus();
    });

    // Room details
    find("snRoomsButton").addEventListener("click", function () {
        const container = find("snRooms");

        if (!container.hidden) {
            container.hidden = true;
            this.textContent = "View Rooms";
            return;
        }

        container.replaceChildren();

        const rooms = getInformation(selectedProperty).rooms || [];

        if (!rooms.length) {
            container.textContent = "Please enquire for room details.";
        }

        rooms.forEach(function (room) {
            const row = document.createElement("div");
            row.className = "sn-room";

            const title = document.createElement("strong");
            title.textContent = room[0];

            const text = document.createElement("p");
            text.textContent = `${room[1]} • ${rent(room[2])}`;

            row.append(title, text);
            container.appendChild(row);
        });

        container.hidden = false;
        this.textContent = "Hide Rooms";
    });

    // Request form
    function showForm(type) {
        if (pending) return;

        requestType = type;
        form.reset();
        status.textContent = "";

        const isVisit = type === "visit";

        find("snDateFields").hidden = !isVisit;
        find("snDate").disabled = !isVisit;
        find("snTime").disabled = !isVisit;
        find("snDate").required = isVisit;
        find("snTime").required = isVisit;
        find("snMessage").required = !isVisit;

        const today = new Date();

        find("snDate").min = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        find("snFormTitle").textContent = isVisit
            ? "Request a Visit" : "Send an Enquiry";
        find("snFormProperty").textContent = getName(selectedProperty);
        find("snMessageLabel").textContent = isVisit
            ? "Message (optional)" : "Message";
        submit.textContent = isVisit
            ? "Submit Visit Request" : "Send Enquiry";

        details.hidden = true;
        formView.hidden = false;
        dialog.scrollTop = 0;

        find("snName").focus();
    }

    find("snEnquiryButton").addEventListener("click", () => showForm("enquiry"));
    find("snVisitButton").addEventListener("click", () => showForm("visit"));

    back.addEventListener("click", function () {
        if (pending) return;

        details.hidden = false;
        formView.hidden = true;
        dialog.scrollTop = 0;

        find(
            requestType === "visit" ? "snVisitButton" : "snEnquiryButton"
        ).focus();
    });

    // Submit to backend
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (pending || !form.reportValidity()) return;

        const values = new FormData(form);
        const name = String(values.get("name") || "").trim();
        const message = String(values.get("message") || "").trim();

        function showError(text) {
            status.textContent = text;
            status.style.color = "#b42318";
        }

        if (!name) {
            showError("Please enter your full name.");
            return;
        }

        if (requestType === "enquiry" && !message) {
            showError("Please enter your enquiry message.");
            return;
        }

        if (requestType === "visit") {
            const appointment = new Date(
                `${find("snDate").value}T${find("snTime").value}`
            );

            if (!Number.isFinite(appointment.getTime()) ||
                appointment <= new Date()) {
                showError("Please choose a future visit date and time.");
                return;
            }
        }

        const payload = {
            name,
            email: String(values.get("email") || "").trim(),
            phone: String(values.get("phone") || "").trim(),
            message: `PG: ${getName(selectedProperty)}\n${message}`
        };

        const endpoint = requestType === "visit"
            ? "/api/visits" : "/api/enquiries";

        if (requestType === "visit") {
            payload.date = find("snDate").value;
            payload.time = find("snTime").value;
        }

        pending = true;
        close.disabled = true;
        back.disabled = true;
        submit.disabled = true;
        submit.textContent = "Submitting...";
        status.textContent = "";

        form.setAttribute("aria-busy", "true");

        const fields = form.querySelectorAll("input, textarea");
        fields.forEach(field => field.readOnly = true);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(API_URL + endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            const result = await readResponse(response);

            if (!result?.success) {
                throw new Error(result?.message || "Could not save request.");
            }

            form.reset();
            status.textContent = result.message || "Request submitted!";
            status.style.color = "#218838";

        } catch (error) {
            if (error.name === "AbortError" || error instanceof TypeError) {
                showError(
                    "The connection was interrupted. Your request may have been saved; check before submitting again."
                );
            } else {
                showError(error.message);
            }
        } finally {
            clearTimeout(timeout);

            pending = false;
            close.disabled = false;
            back.disabled = false;
            submit.disabled = false;

            fields.forEach(field => field.readOnly = false);
            form.removeAttribute("aria-busy");

            submit.textContent = requestType === "visit"
                ? "Submit Visit Request" : "Send Enquiry";
        }
    });

    // Build cards
    function createCard(pg) {
        const info = getInformation(pg);
        const card = document.createElement("article");
        card.className = "property-card";

        card.innerHTML = `
            <div class="property-image">
                <img alt="" loading="lazy">
            </div>
            <div class="property-info">
                <div class="property-title-row">
                    <h3></h3>
                    <span class="rating"></span>
                </div>
                <p class="location"></p>
                <p class="property-description"></p>
                <div class="property-features"></div>
                <div class="price-row">
                    <div class="price"><strong></strong></div>
                    <button type="button" class="view-btn">
                        View Details →
                    </button>
                </div>
            </div>
        `;

        setImage(card.querySelector("img"), pg);

        card.querySelector("h3").textContent = getName(pg);
        card.querySelector(".rating").textContent = `★ ${pg.rating || "New"}`;
        card.querySelector(".location").textContent = String(pg.location || "");
        card.querySelector(".property-description").textContent = String(
            pg.description || info.description || "Enquire for more PG details."
        );
        card.querySelector(".price strong").textContent = rent(pg.price);

        addBadges(card.querySelector(".property-features"), pg);

        const button = card.querySelector(".view-btn");
        button.addEventListener("click", () => openProperty(pg, button));

        return card;
    }

    function applyFilters() {
        const location = locationInput.value.trim().toLowerCase();
        const budget = getPrice(budgetInput.value);
        const facility = normalize(facilityInput.value);

        const results = properties.filter(function (pg) {
            const price = getPrice(pg.price);

            return (
                (!location ||
                    String(pg.location || "").toLowerCase().includes(location)) &&
                (budget === null || (price !== null && price <= budget)) &&
                (!facility ||
                    facilities(pg).some(item => normalize(item) === facility))
            );
        });

        grid.replaceChildren();
        count.textContent = `${results.length} PGs found`;
        empty.hidden = results.length !== 0;

        results.forEach(pg => grid.appendChild(createCard(pg)));
    }

    // Restore homepage filters
    const params = new URLSearchParams(window.location.search);
    locationInput.value = params.get("location") || "";

    const initialBudget = getPrice(params.get("budget"));

    if (initialBudget !== null) {
        const value = String(initialBudget);

        if (!Array.from(budgetInput.options).some(item => item.value === value)) {
            budgetInput.add(new Option(
                `Up to ₹${initialBudget.toLocaleString("en-IN")}`, value
            ));
        }

        budgetInput.value = value;
    }

    const initialFacility = normalize(params.get("facility") || "");
    const option = Array.from(facilityInput.options).find(
        item => normalize(item.value) === initialFacility
    );

    if (option) facilityInput.value = option.value;

    // Load listings
    let loaded = false;

    async function loadProperties() {
        loaded = false;
        empty.hidden = true;
        grid.innerHTML = "<p>Loading PG listings...</p>";
        count.textContent = "Loading properties...";
        grid.setAttribute("aria-busy", "true");

        try {
            const response = await fetch(`${API_URL}/api/pgs`);
            const data = await readResponse(response);

            if (!Array.isArray(data)) {
                throw new Error("Unexpected PG data.");
            }

            properties = data.filter(
                pg => pg && typeof pg === "object"
            );

            loaded = true;
            applyFilters();

        } catch (error) {
            console.error("PG loading error:", error);

            grid.replaceChildren();
            count.textContent = "Unable to load properties";

            const message = document.createElement("p");
            message.textContent =
                "Unable to load PG listings. Please try again.";

            const retry = document.createElement("button");
            retry.type = "button";
            retry.className = "primary-btn";
            retry.textContent = "Try Again";
            retry.addEventListener("click", loadProperties);

            grid.append(message, retry);

        } finally {
            grid.setAttribute("aria-busy", "false");
        }
    }

    function search() {
        if (loaded) applyFilters();
    }

    searchButton.addEventListener("click", search);
    locationInput.addEventListener("input", search);
    budgetInput.addEventListener("change", search);
    facilityInput.addEventListener("change", search);

    locationInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            search();
        }
    });

    loadProperties();

});
