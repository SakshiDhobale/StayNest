// StayNest JavaScript

// PROPERTY DATA
const propertyDetails = {
    "StayWell Residency": {
        title: "StayWell Residency",
        location: "Lokmanya Nagar, Nagpur",
        price: "5,500",
        rating: "4.8",
        image: "images/pg1.jpg",
        description: "A comfortable and student-friendly PG with essential facilities for a convenient stay.",
        facilities: ["Wi-Fi", "Meals", "Furnished"],
        rooms: [
            {
                type: "Single Room",
                sharing: "1 Person",
                price: "7,000",
                availability: "Available"
            },
            {
                type: "Double Sharing",
                sharing: "2 Persons",
                price: "5,500",
                availability: "Available"
            },
            {
                type: "Triple Sharing",
                sharing: "3 Persons",
                price: "4,500",
                availability: "Limited"
            }
        ]
    },

    "Sai Krupa PG": {
        title: "Sai Krupa PG",
        location: "Vasudev Nagar, Nagpur",
        price: "6,000",
        rating: "4.7",
        image: "images/pg2.png",
        description: "A convenient PG option for students with useful facilities and a comfortable living environment.",
        facilities: ["Security", "Laundry", "Wi-Fi"],
        rooms: [
            {
                type: "Single Room",
                sharing: "1 Person",
                price: "7,500",
                availability: "Available"
            },
            {
                type: "Double Sharing",
                sharing: "2 Persons",
                price: "6,000",
                availability: "Available"
            },
            {
                type: "Triple Sharing",
                sharing: "3 Persons",
                price: "5,000",
                availability: "Limited"
            }
        ]
    },

    "Urban Nest PG": {
        title: "Urban Nest PG",
        location: "Hingna Road, Nagpur",
        price: "7,000",
        rating: "4.9",
        image: "images/pg3.jpg",
        description: "A modern and comfortable PG with useful facilities for students looking for a convenient stay.",
        facilities: ["Furnished", "Wi-Fi", "AC"],
        rooms: [
            {
                type: "Single Room",
                sharing: "1 Person",
                price: "8,000",
                availability: "Available"
            },
            {
                type: "Double Sharing",
                sharing: "2 Persons",
                price: "7,000",
                availability: "Available"
            },
            {
                type: "AC Room",
                sharing: "1 Person",
                price: "8,500",
                availability: "Limited"
            }
        ]
    }
};


// PROPERTY MODAL
const propertyModal = document.getElementById("propertyModal");
const closeModal = document.getElementById("closeModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalLocation = document.getElementById("modalLocation");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const modalRating = document.getElementById("modalRating");
const modalFacilities = document.getElementById("modalFacilities");

const enquireBtn = document.getElementById("enquireBtn");
const visitBtn = document.getElementById("visitBtn");
const viewRoomsBtn = document.getElementById("viewRoomsBtn");
const roomSection = document.getElementById("roomSection");

let currentPropertyName = "";


// OPEN PROPERTY
function openProperty(propertyName) {

    const property = propertyDetails[propertyName];

    if (!property) {
        console.error("Property not found:", propertyName);
        return;
    }

    currentPropertyName = propertyName;

    modalImage.src = property.image;
    modalTitle.textContent = property.title;
    modalLocation.textContent = property.location;
    modalDescription.textContent = property.description;
    modalPrice.textContent = "₹" + property.price + " / month";
    modalRating.textContent = property.rating;

    modalFacilities.innerHTML = "";

    property.facilities.forEach(function (facility) {

        const span = document.createElement("span");

        span.textContent = facility;

        modalFacilities.appendChild(span);

    });

    if (roomSection) {
        roomSection.style.display = "none";
    }

    if (viewRoomsBtn) {
        viewRoomsBtn.innerHTML = `
            View Rooms
            <i class="fa-solid fa-bed"></i>
        `;
    }

    propertyModal.style.display = "flex";

    document.body.style.overflow = "hidden";
}


// CLOSE PROPERTY MODAL
if (closeModal) {

    closeModal.addEventListener("click", function () {

        propertyModal.style.display = "none";

        document.body.style.overflow = "auto";

    });

}


// CLOSE PROPERTY MODAL OUTSIDE CLICK
if (propertyModal) {

    propertyModal.addEventListener("click", function (event) {

        if (event.target === propertyModal) {

            propertyModal.style.display = "none";

            document.body.style.overflow = "auto";

        }

    });

}


// ROOM DETAILS
if (viewRoomsBtn) {

    viewRoomsBtn.addEventListener("click", function () {

        const property = propertyDetails[currentPropertyName];

        if (!property || !roomSection) {
            return;
        }

        if (roomSection.style.display === "none") {

            roomSection.innerHTML = `
                <h3 style="margin-bottom: 12px;">
                    Available Rooms
                </h3>

                ${property.rooms.map(function (room) {

                    return `
                        <div style="
                            border: 1px solid #d9d9d5;
                            padding: 12px;
                            border-radius: 8px;
                            margin-bottom: 10px;
                        ">

                            <strong>
                                ${room.type}
                            </strong>

                            <p style="margin: 5px 0;">
                                ${room.sharing}
                                •
                                ₹${room.price} / month
                            </p>

                            <small>
                                ${room.availability}
                            </small>

                        </div>
                    `;

                }).join("")}
            `;

            roomSection.style.display = "block";

            viewRoomsBtn.innerHTML = `
                Hide Rooms
                <i class="fa-solid fa-bed"></i>
            `;

        } else {

            roomSection.style.display = "none";

            viewRoomsBtn.innerHTML = `
                View Rooms
                <i class="fa-solid fa-bed"></i>
            `;

        }

    });

}


// ENQUIRY MODAL
const enquiryModal = document.getElementById("enquiryModal");
const closeEnquiry = document.getElementById("closeEnquiry");
const enquiryForm = document.getElementById("enquiryForm");


if (enquireBtn) {

    enquireBtn.addEventListener("click", function () {

        propertyModal.style.display = "none";

        enquiryModal.style.display = "flex";

        document.body.style.overflow = "hidden";

    });

}


if (closeEnquiry) {

    closeEnquiry.addEventListener("click", function () {

        enquiryModal.style.display = "none";

        document.body.style.overflow = "auto";

    });

}


if (enquiryModal) {

    enquiryModal.addEventListener("click", function (event) {

        if (event.target === enquiryModal) {

            enquiryModal.style.display = "none";

            document.body.style.overflow = "auto";

        }

    });

}


if (enquiryForm) {

    enquiryForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document.getElementById("enquiryName").value;
        const email = document.getElementById("enquiryEmail").value;
        const phone = document.getElementById("enquiryPhone").value;
        const message = document.getElementById("enquiryMessage").value;


        fetch("http://127.0.0.1:5000/api/enquiries", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: name,
                email: email,
                phone: phone,
                message: message

            })

        })

        .then(function (response) {

            return response.json();

        })

        .then(function (data) {

            console.log("Enquiry Response:", data);

            alert(data.message);

            enquiryForm.reset();

            enquiryModal.style.display = "none";

            document.body.style.overflow = "auto";

        })

        .catch(function (error) {

            console.error("Enquiry Error:", error);

            alert("Something went wrong. Please try again.");

        });

    });

}


// REQUEST A VISIT
const visitModal = document.getElementById("visitModal");
const closeVisit = document.getElementById("closeVisit");
const visitForm = document.getElementById("visitForm");


if (visitBtn) {

    visitBtn.addEventListener("click", function () {

        propertyModal.style.display = "none";

        visitModal.style.display = "flex";

        document.body.style.overflow = "hidden";

    });

}


if (closeVisit) {

    closeVisit.addEventListener("click", function () {

        visitModal.style.display = "none";

        document.body.style.overflow = "auto";

    });

}


if (visitModal) {

    visitModal.addEventListener("click", function (event) {

        if (event.target === visitModal) {

            visitModal.style.display = "none";

            document.body.style.overflow = "auto";

        }

    });

}


if (visitForm) {

    visitForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document.getElementById("visitName").value;
        const phone = document.getElementById("visitPhone").value;
        const date = document.getElementById("visitDate").value;
        const time = document.getElementById("visitTime").value;
        const message = document.getElementById("visitMessage").value;


        fetch("http://127.0.0.1:5000/api/visits", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: name,
                phone: phone,
                date: date,
                time: time,
                message: message

            })

        })

        .then(function (response) {

            return response.json();

        })

        .then(function (data) {

            console.log("Visit Response:", data);

            alert(data.message);

            visitForm.reset();

            visitModal.style.display = "none";

            document.body.style.overflow = "auto";

        })

        .catch(function (error) {

            console.error("Visit Error:", error);

            alert("Something went wrong. Please try again.");

        });

    });

}


// SEARCH
const searchBtn = document.getElementById("searchBtn");
const locationInput = document.getElementById("locationInput");
const budgetInput = document.getElementById("budgetInput");
const pgTypeInput = document.getElementById("pgTypeInput");
const propertyCards = document.querySelectorAll(".property-card");

const searchMessage = document.getElementById("searchMessage");


if (searchBtn) {

    searchBtn.addEventListener("click", function () {

        const locationValue = locationInput
            ? locationInput.value.toLowerCase().trim()
            : "";

        const budgetValue = budgetInput
            ? budgetInput.value.trim()
            : "";

        const typeValue = pgTypeInput
            ? pgTypeInput.value.toLowerCase().trim()
            : "";


        propertyCards.forEach(function (card) {

            const location =
                card.querySelector(".location")?.textContent.toLowerCase() || "";

            const priceText =
                card.querySelector(".price")?.textContent || "";

            const price =
                parseInt(priceText.replace(/[^\d]/g, "")) || 0;

            const cardText =
                card.textContent.toLowerCase().replace(/-/g, "");


            let locationMatch = true;
            let budgetMatch = true;
            let typeMatch = true;


            if (locationValue) {

                locationMatch =
                    location.includes(locationValue);

            }


            if (budgetValue) {

                budgetMatch =
                    price <= Number(budgetValue);

            }


            if (typeValue) {

                const searchTypes =
                    typeValue
                        .split(/[,/]/)
                        .map(function (item) {
                            return item.trim();
                        })
                        .filter(Boolean);


                typeMatch =
                    searchTypes.every(function (type) {

                        const cleanType =
                            type.replace(/-/g, "");

                        return cardText.includes(cleanType);

                    });

            }


            if (locationMatch && budgetMatch && typeMatch) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });


        const visibleCards =
            Array.from(propertyCards).filter(function (card) {

                return card.style.display !== "none";

            }).length;


        if (searchMessage) {

            if (visibleCards === 0) {

                searchMessage.textContent =
                    "No PGs found matching your search.";

            } else {

                searchMessage.textContent =
                    visibleCards + " PG option(s) found.";

            }

        }

    });

}


// SEARCH USING ENTER KEY
function searchOnEnter(input) {

    if (input) {

        input.addEventListener("keypress", function (event) {

            if (event.key === "Enter") {

                if (searchBtn) {

                    searchBtn.click();

                }

            }

        });

    }

}


searchOnEnter(locationInput);
searchOnEnter(budgetInput);
searchOnEnter(pgTypeInput);


// FAVORITES
function toggleFavorite(propertyName, button) {

    let favorites =
        JSON.parse(localStorage.getItem("staynestFavorites")) || [];


    if (favorites.includes(propertyName)) {

        favorites =
            favorites.filter(function (item) {

                return item !== propertyName;

            });


        if (button) {

            button.classList.remove("active");

            button.innerHTML = `
                <i class="fa-regular fa-heart"></i>
            `;

        }

        alert("Removed from saved PGs");

    } else {

        favorites.push(propertyName);


        if (button) {

            button.classList.add("active");

            button.innerHTML = `
                <i class="fa-solid fa-heart"></i>
            `;

        }

        alert("PG saved successfully");

    }


    localStorage.setItem(
        "staynestFavorites",
        JSON.stringify(favorites)
    );

    loadFavorites();

}


// LOAD FAVORITES
function loadFavorites() {

    const favorites =
        JSON.parse(localStorage.getItem("staynestFavorites")) || [];


    const savedGrid =
        document.getElementById("savedGrid");

    const noSavedMessage =
        document.getElementById("noSavedMessage");


    if (!savedGrid || !noSavedMessage) {

        return;

    }


    savedGrid.innerHTML = "";


    if (favorites.length === 0) {

        noSavedMessage.style.display = "block";

        return;

    }


    noSavedMessage.style.display = "none";


    favorites.forEach(function (propertyName) {

        const property =
            propertyDetails[propertyName];


        if (!property) {

            return;

        }


        const card =
            document.createElement("div");

        card.className = "property-card";


        card.innerHTML = `

            <div class="property-image">

                <img
                    src="${property.image}"
                    alt="${property.title}"
                >

                <button
                    class="favorite-btn active"
                    type="button"
                    onclick="toggleFavorite('${property.title}', this)"
                >
                    <i class="fa-solid fa-heart"></i>
                </button>

            </div>


            <div class="property-info">

                <div class="property-title-row">

                    <h3>${property.title}</h3>

                    <span class="rating">

                        <i class="fa-solid fa-star"></i>

                        ${property.rating}

                    </span>

                </div>


                <p class="location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${property.location}

                </p>


                <p class="property-description">

                    ${property.description}

                </p>


                <div class="property-features">

                    ${property.facilities.map(function (facility) {

                        return `
                            <span>
                                ${facility}
                            </span>
                        `;

                    }).join("")}

                </div>


                <div class="price-row">

                    <div class="price">

                        <strong>
                            ₹${property.price}
                        </strong>

                        <span>
                            / month
                        </span>

                    </div>


                    <button
                        class="view-btn"
                        type="button"
                        onclick="openProperty('${property.title}')"
                    >
                        View Details

                        <i class="fa-solid fa-arrow-right"></i>

                    </button>

                </div>

            </div>
        `;


        savedGrid.appendChild(card);

    });

}


// LOGIN / SIGNUP
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const closeLogin = document.getElementById("closeLogin");


if (loginBtn && loginModal) {

    loginBtn.addEventListener("click", function () {

        loginModal.style.display = "flex";

        document.body.style.overflow = "hidden";

    });

}


if (signupBtn && loginModal) {

    signupBtn.addEventListener("click", function () {

        loginModal.style.display = "flex";

        document.body.style.overflow = "hidden";

    });

}


if (closeLogin) {

    closeLogin.addEventListener("click", function () {

        loginModal.style.display = "none";

        document.body.style.overflow = "auto";

    });

}


if (loginModal) {

    loginModal.addEventListener("click", function (event) {

        if (event.target === loginModal) {

            loginModal.style.display = "none";

            document.body.style.overflow = "auto";

        }

    });

}


// LOGIN AND SIGNUP
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const loginSection = document.getElementById("loginSection");
const signupSection = document.getElementById("signupSection");


if (showSignup) {

    showSignup.addEventListener("click", function (event) {

        event.preventDefault();

        if (loginSection) {

            loginSection.style.display = "none";

        }

        if (signupSection) {

            signupSection.style.display = "block";

        }

    });

}


if (showLogin) {

    showLogin.addEventListener("click", function (event) {

        event.preventDefault();

        if (signupSection) {

            signupSection.style.display = "none";

        }

        if (loginSection) {

            loginSection.style.display = "block";

        }

    });

}


if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name =
            document.getElementById("signupName").value;

        const email =
            document.getElementById("signupEmail").value;

        const password =
            document.getElementById("signupPassword").value;


        const user = {

            name: name,
            email: email,
            password: password

        };


        localStorage.setItem(
            "staynestUser",
            JSON.stringify(user)
        );


        alert("Signup successful!");


        signupForm.reset();


        if (signupSection) {

            signupSection.style.display = "none";

        }


        if (loginSection) {

            loginSection.style.display = "block";

        }

    });

}


if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value;

        const password =
            document.getElementById("loginPassword").value;


        const savedUser =
            JSON.parse(
                localStorage.getItem("staynestUser")
            );


        if (
            savedUser &&
            savedUser.email === email &&
            savedUser.password === password
        ) {

            alert("Login successful!");

            loginForm.reset();

            if (loginModal) {

                loginModal.style.display = "none";

            }

            document.body.style.overflow = "auto";

        } else {

            alert("Invalid email or password.");

        }

    });

}


// ESCAPE KEY
document.addEventListener("keydown", function (event) {

    if (event.key !== "Escape") {

        return;

    }


    if (
        propertyModal &&
        propertyModal.style.display === "flex"
    ) {

        propertyModal.style.display = "none";

    }


    if (
        enquiryModal &&
        enquiryModal.style.display === "flex"
    ) {

        enquiryModal.style.display = "none";

    }


    if (
        visitModal &&
        visitModal.style.display === "flex"
    ) {

        visitModal.style.display = "none";

    }


    if (
        loginModal &&
        loginModal.style.display === "flex"
    ) {

        loginModal.style.display = "none";

    }


    document.body.style.overflow = "auto";

});


// PAGE LOAD
document.addEventListener("DOMContentLoaded", function () {

    loadFavorites();

});