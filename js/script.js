
// StayNest JavaScript

// Mobile Navigation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("active");
        menuToggle.setAttribute("aria-expanded", isOpen);
    });
}

// Login Modal
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const closeLogin = document.getElementById("closeLogin");

function openLoginModal() {
    if (loginModal) {
        loginModal.style.display = "flex";
        document.body.style.overflow = "hidden";

        if (navLinks) {
            navLinks.classList.remove("active");
        }
    }
}

function closeLoginModal() {
    if (loginModal) {
        loginModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

if (loginBtn) {
    loginBtn.addEventListener("click", openLoginModal);
}

if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener("click", openLoginModal);
}

if (closeLogin) {
    closeLogin.addEventListener("click", closeLoginModal);
}

if (loginModal) {
    loginModal.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            closeLoginModal();
        }
    });
}

// Login and Signup Switch
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");
const loginSection = document.getElementById("loginSection");
const signupSection = document.getElementById("signupSection");

if (showSignup) {
    showSignup.addEventListener("click", function (event) {
        event.preventDefault();

        loginSection.style.display = "none";
        signupSection.style.display = "block";
    });
}

if (showLogin) {
    showLogin.addEventListener("click", function (event) {
        event.preventDefault();

        signupSection.style.display = "none";
        loginSection.style.display = "block";
    });
}

// Signup
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        const user = {
            name: name,
            email: email,
            password: password
        };

        localStorage.setItem("staynestUser", JSON.stringify(user));

        alert("Signup successful! Please login.");

        signupForm.reset();

        signupSection.style.display = "none";
        loginSection.style.display = "block";
    });
}

// Login
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const savedUser = JSON.parse(
            localStorage.getItem("staynestUser")
        );

        if (
            savedUser &&
            savedUser.email === email &&
            savedUser.password === password
        ) {
            alert("Login successful! Welcome to StayNest.");

            loginForm.reset();
            closeLoginModal();

        } else {
            alert("Invalid email or password. Please signup first.");
        }
    });
}

// Quick Search
const homeSearchForm = document.getElementById("homeSearchForm");

if (homeSearchForm) {
    homeSearchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const location = document.getElementById("homeLocation").value.trim();
        const budget = document.getElementById("homeBudget").value.trim();

        const params = new URLSearchParams();

        if (location) {
            params.set("location", location);
        }

        if (budget) {
            params.set("budget", budget);
        }

        window.location.href = "explore.html?" + params.toString();
    });
}

// Escape Key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeLoginModal();

        if (navLinks) {
            navLinks.classList.remove("active");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }
    }
});
