document.addEventListener("DOMContentLoaded", function () {

    // Mobile Menu
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            navLinks.classList.toggle("show");
            menuToggle.setAttribute(
                "aria-expanded",
                navLinks.classList.contains("show")
            );
        });
    }

    // Login Modal
    const loginModal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const mobileLoginBtn = document.getElementById("mobileLoginBtn");
    const closeLogin = document.getElementById("closeLogin");

    const loginSection = document.getElementById("loginSection");
    const signupSection = document.getElementById("signupSection");

    function openLogin() {
        if (loginModal) {
            loginModal.classList.add("active");
            if (loginSection) loginSection.style.display = "block";
            if (signupSection) signupSection.style.display = "none";
        }

        if (navLinks) navLinks.classList.remove("show");
    }

    function openSignup() {
        if (loginModal) {
            loginModal.classList.add("active");
            if (loginSection) loginSection.style.display = "none";
            if (signupSection) signupSection.style.display = "block";
        }

        if (navLinks) navLinks.classList.remove("show");
    }

    function closeLoginModal() {
        if (loginModal) loginModal.classList.remove("active");
    }

    if (loginBtn) loginBtn.addEventListener("click", openLogin);
    if (mobileLoginBtn) mobileLoginBtn.addEventListener("click", openLogin);
    if (signupBtn) signupBtn.addEventListener("click", openSignup);
    if (closeLogin) closeLogin.addEventListener("click", closeLoginModal);

    if (loginModal) {
        loginModal.addEventListener("click", function (event) {
            if (event.target === loginModal) {
                closeLoginModal();
            }
        });
    }

    // Switch between Login and Signup
    const showSignup = document.getElementById("showSignup");
    const showLogin = document.getElementById("showLogin");

    if (showSignup) {
        showSignup.addEventListener("click", function (event) {
            event.preventDefault();
            if (loginSection) loginSection.style.display = "none";
            if (signupSection) signupSection.style.display = "block";
        });
    }

    if (showLogin) {
        showLogin.addEventListener("click", function (event) {
            event.preventDefault();
            if (signupSection) signupSection.style.display = "none";
            if (loginSection) loginSection.style.display = "block";
        });
    }

    // Homepage Search
    const homeSearchForm = document.getElementById("homeSearchForm");

    if (homeSearchForm) {
        homeSearchForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const location = document.getElementById("homeLocation")?.value.trim() || "";
            const budget = document.getElementById("homeBudget")?.value.trim() || "";
            const facility = document.getElementById("homeFacility")?.value || "";

            const params = new URLSearchParams();

            if (location) params.set("location", location);
            if (budget) params.set("budget", budget);
            if (facility) params.set("facility", facility);

            window.location.href = "explore.html?" + params.toString();
        });
    }

    // Login Form
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            alert("Login feature will be connected to the backend.");
        });
    }

    // Signup Form
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault();
            alert("Signup feature will be connected to the backend.");
        });
    }

    // Close Modal with Escape Key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeLoginModal();
            if (navLinks) navLinks.classList.remove("show");
        }
    });

});
