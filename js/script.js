document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "https://staynest-kl5u.onrender.com";

    // Menu
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    function closeMobileMenu() {
        navLinks?.classList.remove("show");
        menuToggle?.setAttribute("aria-expanded", "false");
    }

    function closeAccountMenu() {
        document.querySelectorAll(".account-menu").forEach(function (menu) {
            menu.open = false;
        });
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            const isOpen = navLinks.classList.toggle("show");

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMobileMenu);
        });
    }

    document.addEventListener("click", function (event) {
        document.querySelectorAll(".account-menu").forEach(function (menu) {
            if (!menu.contains(event.target)) {
                menu.open = false;
            }
        });
    });

    // Account elements
    const loginModal = document.getElementById("loginModal");
    const loginSection = document.getElementById("loginSection");
    const signupSection = document.getElementById("signupSection");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const loginSubmitBtn = document.getElementById("loginSubmitBtn");
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");

    const closeLogin = document.getElementById("closeLogin");

    let accountOpener = null;
    let previousOverflow = "";

    // Messages
    function showMessage(form, message, success = false) {
        if (!form) return;

        let messageBox = form.querySelector(".auth-message");

        if (!messageBox) {
            messageBox = document.createElement("p");
            messageBox.className = "auth-message";
            messageBox.setAttribute("role", "status");
            messageBox.setAttribute("aria-live", "polite");
            messageBox.style.marginTop = "12px";
            messageBox.style.fontSize = "14px";

            form.appendChild(messageBox);
        }

        messageBox.textContent = message;
        messageBox.style.color = success ? "#218838" : "#c0392b";
    }

    function clearMessages() {
        loginModal?.querySelectorAll(".auth-message").forEach(function (message) {
            message.textContent = "";
        });
    }

    // Open account form
    function openAccount(section, opener) {
        if (!loginModal || !loginSection || !signupSection) return;

        if (!loginModal.classList.contains("active")) {
            accountOpener = opener || document.activeElement;
            previousOverflow = document.body.style.overflow;
        }

        clearMessages();

        loginSection.style.display =
            section === "signup" ? "none" : "block";

        signupSection.style.display =
            section === "signup" ? "block" : "none";

        loginModal.classList.add("active");
        document.body.style.overflow = "hidden";

        closeMobileMenu();
        closeAccountMenu();

        const firstInput = section === "signup"
            ? document.getElementById("signupName")
            : document.getElementById("loginEmail");

        firstInput?.focus();
    }

    function closeLoginModal() {
        if (!loginModal?.classList.contains("active")) return;

        loginModal.classList.remove("active");
        document.body.style.overflow = previousOverflow;

        if (accountOpener && accountOpener.getClientRects().length > 0) {
            accountOpener.focus();
        }
    }

    // Login buttons
    ["loginBtn", "mobileLoginBtn"].forEach(function (id) {
        const button = document.getElementById(id);

        button?.addEventListener("click", function () {
            openAccount("login", button);
        });
    });

    // Signup buttons
    ["signupBtn", "mobileSignupBtn"].forEach(function (id) {
        const button = document.getElementById(id);

        button?.addEventListener("click", function () {
            openAccount("signup", button);
        });
    });

    closeLogin?.addEventListener("click", closeLoginModal);

    loginModal?.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            closeLoginModal();
        }
    });

    // Switch forms
    document.getElementById("showSignup")?.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            openAccount("signup");
        }
    );

    document.getElementById("showLogin")?.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            openAccount("login");
        }
    );

    // Read saved data
    function readSavedData(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }

    // Update account menu
    function updateAccountMenu() {
        const user = readSavedData("staynestUser");
        const session = readSavedData("staynestSession");

        const expiresAt = Number(session?.expires_at);

        const isExpired =
            Number.isFinite(expiresAt) &&
            expiresAt > 0 &&
            expiresAt * 1000 <= Date.now();

        const isLoggedIn = Boolean(
            user &&
            session?.access_token &&
            !isExpired
        );

        [
            "loginBtn",
            "signupBtn",
            "mobileLoginBtn",
            "mobileSignupBtn"
        ].forEach(function (id) {
            const element = document.getElementById(id);

            if (element) {
                element.hidden = isLoggedIn;
            }
        });

        [
            "userDashboardLink",
            "mobileUserDashboardLink",
            "userLogoutBtn",
            "mobileUserLogoutBtn"
        ].forEach(function (id) {
            const element = document.getElementById(id);

            if (element) {
                element.hidden = !isLoggedIn;
            }
        });
    }

    // Read API response
    async function readApiResponse(response) {
        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                "Server returned an unexpected response. Please try again."
            );
        }

        if (!response.ok || !result?.success) {
            throw new Error(
                result?.message || "Request failed. Please try again."
            );
        }

        return result;
    }

    // Signup
    signupForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!signupForm.reportValidity()) return;
        if (signupSubmitBtn?.disabled) return;

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const phone = document.getElementById("signupPhone").value.trim();
        const password = document.getElementById("signupPassword").value;

        if (!name) {
            showMessage(signupForm, "Please enter your full name.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            showMessage(
                signupForm,
                "Please enter a valid 10-digit mobile number."
            );
            return;
        }

        if (password.length < 8) {
            showMessage(
                signupForm,
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (signupSubmitBtn) {
            signupSubmitBtn.disabled = true;
            signupSubmitBtn.textContent = "Creating Account...";
        }

        showMessage(signupForm, "");

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

            const result = await readApiResponse(response);

            signupForm.reset();

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
            showMessage(
                signupForm,
                error instanceof TypeError
                    ? "Unable to connect to the server. Please try again."
                    : error.message
            );

        } finally {
            if (signupSubmitBtn) {
                signupSubmitBtn.disabled = false;
                signupSubmitBtn.textContent = "Create Account";
            }
        }
    });

    // Login
    loginForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!loginForm.reportValidity()) return;
        if (loginSubmitBtn?.disabled) return;

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (loginSubmitBtn) {
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.textContent = "Logging in...";
        }

        showMessage(loginForm, "");

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

            const result = await readApiResponse(response);

            if (!result.user || !result.session?.access_token) {
                throw new Error(
                    "Login session was not received. Please try again."
                );
            }

            try {
                localStorage.setItem(
                    "staynestUser",
                    JSON.stringify(result.user)
                );

                localStorage.setItem(
                    "staynestSession",
                    JSON.stringify(result.session)
                );
            } catch {
                localStorage.removeItem("staynestUser");
                localStorage.removeItem("staynestSession");

                throw new Error(
                    "Unable to save login. Please allow browser storage."
                );
            }

            loginForm.reset();
            closeLoginModal();
            updateAccountMenu();

        } catch (error) {
            showMessage(
                loginForm,
                error instanceof TypeError
                    ? "Unable to connect to the server. Please try again."
                    : error.message
            );

        } finally {
            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.textContent = "Login";
            }
        }
    });

    // User logout
    function logoutUser() {
        localStorage.removeItem("staynestUser");
        localStorage.removeItem("staynestSession");

        sessionStorage.removeItem("staynestSession");

        closeMobileMenu();
        closeAccountMenu();
        updateAccountMenu();

        window.location.replace("index.html");
    }

    ["userLogoutBtn", "mobileUserLogoutBtn"].forEach(function (id) {
        document.getElementById(id)?.addEventListener(
            "click",
            logoutUser
        );
    });

    // Homepage search
    const homeSearchForm = document.getElementById("homeSearchForm");

    homeSearchForm?.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!homeSearchForm.reportValidity()) return;

        const location = document.getElementById("homeLocation").value.trim();
        const budget = document.getElementById("homeBudget").value.trim();
        const facility = document.getElementById("homeFacility").value;

        const params = new URLSearchParams();

        if (location) params.set("location", location);
        if (budget) params.set("budget", budget);
        if (facility) params.set("facility", facility);

        const query = params.toString();

        window.location.href = query
            ? `explore.html?${query}`
            : "explore.html";
    });

    // Keep keyboard focus in popup
    loginModal?.addEventListener("keydown", function (event) {
        if (event.key !== "Tab") return;
        if (!loginModal.classList.contains("active")) return;

        const elements = Array.from(
            loginModal.querySelectorAll(
                "a[href], button, input, select, textarea"
            )
        ).filter(function (element) {
            return !element.disabled && element.getClientRects().length > 0;
        });

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (!first) return;

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // Escape key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeLoginModal();
            closeMobileMenu();
            closeAccountMenu();
        }
    });

    // Update menu across tabs
    window.addEventListener("storage", function (event) {
        if (
            event.key === "staynestUser" ||
            event.key === "staynestSession" ||
            event.key === null
        ) {
            updateAccountMenu();
        }
    });

    window.addEventListener("pageshow", updateAccountMenu);

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            updateAccountMenu();
        }
    });

    updateAccountMenu();

});
