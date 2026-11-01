document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "https://staynest-kl5u.onrender.com";

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

    // Auth Elements
    const loginModal = document.getElementById("loginModal");
    const loginSection = document.getElementById("loginSection");
    const signupSection = document.getElementById("signupSection");

    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const mobileLoginBtn = document.getElementById("mobileLoginBtn");
    const closeLogin = document.getElementById("closeLogin");

    function openLogin() {
        loginModal?.classList.add("active");

        if (loginSection) loginSection.style.display = "block";
        if (signupSection) signupSection.style.display = "none";

        navLinks?.classList.remove("show");
    }

    function openSignup() {
        loginModal?.classList.add("active");

        if (loginSection) loginSection.style.display = "none";
        if (signupSection) signupSection.style.display = "block";

        navLinks?.classList.remove("show");
    }

    function closeLoginModal() {
        loginModal?.classList.remove("active");
    }

    loginBtn?.addEventListener("click", openLogin);
    mobileLoginBtn?.addEventListener("click", openLogin);
    signupBtn?.addEventListener("click", openSignup);
    closeLogin?.addEventListener("click", closeLoginModal);

    loginModal?.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            closeLoginModal();
        }
    });

    // Switch Login / Signup
    document.getElementById("showSignup")?.addEventListener("click", function (event) {
        event.preventDefault();
        openSignup();
    });

    document.getElementById("showLogin")?.addEventListener("click", function (event) {
        event.preventDefault();
        openLogin();
    });

    // Show messages
    function showMessage(form, message, success = false) {
        let messageBox = form.querySelector(".auth-message");

        if (!messageBox) {
            messageBox = document.createElement("p");
            messageBox.className = "auth-message";
            messageBox.style.marginTop = "12px";
            messageBox.style.fontSize = "14px";
            form.appendChild(messageBox);
        }

        messageBox.textContent = message;
        messageBox.style.color = success ? "#218838" : "#c0392b";
    }

    // Signup API
    const signupForm = document.getElementById("signupForm");
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");

    signupForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const phone = document.getElementById("signupPhone").value.trim();
        const password = document.getElementById("signupPassword").value;

        if (!/^[6-9]\d{9}$/.test(phone)) {
            showMessage(signupForm, "Please enter a valid 10-digit mobile number.");
            return;
        }

        if (password.length < 8) {
            showMessage(signupForm, "Password must contain at least 8 characters.");
            return;
        }

        signupSubmitBtn.disabled = true;
        signupSubmitBtn.textContent = "Creating Account...";

        try {
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Signup failed.");
            }

            signupForm.reset();

            showMessage(
                signupForm,
                result.message,
                true
            );

            if (result.requiresEmailConfirmation) {
                showMessage(
                    signupForm,
                    "Account created! Please check your email and confirm your account before login.",
                    true
                );
            } else {
                showMessage(
                    signupForm,
                    "Account created successfully! You can now login.",
                    true
                );
            }

        } catch (error) {
            console.error("Signup error:", error);
            showMessage(
                signupForm,
                error.message || "Unable to create account. Please try again."
            );
        } finally {
            signupSubmitBtn.disabled = false;
            signupSubmitBtn.textContent = "Create Account";
        }
    });

    // Login API
    const loginForm = document.getElementById("loginForm");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");

    loginForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = "Logging in...";

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Login failed.");
            }

            // Save login session in this browser
            localStorage.setItem(
                "staynestUser",
                JSON.stringify(result.user)
            );

            localStorage.setItem(
                "staynestSession",
                JSON.stringify(result.session)
            );

            showMessage(loginForm, "Login successful!", true);

            setTimeout(function () {
                closeLoginModal();
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);
            showMessage(
                loginForm,
                error.message || "Unable to login. Please try again."
            );
        } finally {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = "Login";
        }
    });

    // Homepage Search
    const homeSearchForm = document.getElementById("homeSearchForm");

    homeSearchForm?.addEventListener("submit", function (event) {
        event.preventDefault();

        const location = document.getElementById("homeLocation").value.trim();
        const budget = document.getElementById("homeBudget").value.trim();
        const facility = document.getElementById("homeFacility").value;

        const params = new URLSearchParams();

        if (location) params.set("location", location);
        if (budget) params.set("budget", budget);
        if (facility) params.set("facility", facility);

        window.location.href = "explore.html?" + params.toString();
    });

    // Close with Escape key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeLoginModal();
            navLinks?.classList.remove("show");
        }
    });

});
