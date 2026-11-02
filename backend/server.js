require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Send email using Brevo
async function sendEmail({ to, subject, html }) {
    try {
        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": process.env.BREVO_API_KEY
                },
                body: JSON.stringify({
                    sender: {
                        name: "StayNest",
                        email: process.env.BREVO_SENDER_EMAIL
                    },
                    to: to.map(function (email) {
                        return { email };
                    }),
                    replyTo: {
                        name: "StayNest",
                        email: process.env.BREVO_SENDER_EMAIL
                    },
                    subject,
                    htmlContent: html
                }),
                signal: AbortSignal.timeout(20000)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.messageId) {
            console.error(
                "Brevo email error:",
                response.status,
                result.message || "Email was not accepted."
            );

            return {
                error: {
                    message: result.message || "Email was not accepted."
                }
            };
        }

        return {
            data: {
                id: result.messageId
            }
        };

    } catch (error) {
        console.error("Brevo connection error:", error.message);

        return {
            error: {
                message: "Could not connect to the email service."
            }
        };
    }
}

let supabase;
// Create secure admin session token
function createAdminToken(email) {
    const payload = {
        email,
        role: "admin",
        expiresAt: Date.now() + (8 * 60 * 60 * 1000)
    };

    const encodedPayload = Buffer
        .from(JSON.stringify(payload))
        .toString("base64url");

    const signature = crypto
        .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
        .update(encodedPayload)
        .digest("base64url");

    return `${encodedPayload}.${signature}`;
}

// Verify admin session token
function verifyAdminToken(token) {
    try {
        const [payload, signature] = token.split(".");

        if (!payload || !signature) return null;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
            .update(payload)
            .digest();

        const actualSignature = Buffer.from(signature, "base64url");

        if (
            actualSignature.length !== expectedSignature.length ||
            !crypto.timingSafeEqual(actualSignature, expectedSignature)
        ) {
            return null;
        }

        const admin = JSON.parse(
            Buffer.from(payload, "base64url").toString()
        );

        if (
            admin.role !== "admin" ||
            admin.expiresAt < Date.now()
        ) {
            return null;
        }

        return admin;

    } catch {
        return null;
    }
}

// Protect admin-only APIs
function requireAdmin(req, res, next) {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin login required."
        });
    }

    const token = authorization.slice(7);
    const admin = verifyAdminToken(token);

    if (!admin) {
        return res.status(401).json({
            success: false,
            message: "Admin session expired. Please login again."
        });
    }

    req.admin = admin;
    next();
}

// Escape special characters before adding user data to email HTML
function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}

// Connect to Supabase
async function connectDatabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
        throw new Error("Supabase environment variables are missing.");
    }

   if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    throw new Error("Brevo API key or sender email is missing.");
}

    const { createClient } = await import("@supabase/supabase-js");

    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );

    console.log("StayNest database connected successfully!");
}

// Home route
app.get("/", (req, res) => {
    res.send("StayNest Backend is Running!");
});

// User Signup API
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.replace(/\D/g, "");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10-digit Indian mobile number."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
                data: {
                    full_name: cleanName,
                    phone: cleanPhone
                }
            }
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: data.session
                ? "Account created successfully!"
                : "Account created. Please check your email for confirmation.",
            user: {
                id: data.user.id,
                name: cleanName,
                email: data.user.email,
                phone: cleanPhone
            },
            requiresEmailConfirmation: !data.session
        });

    } catch (error) {
        console.error("Signup error:", error);

        res.status(500).json({
            success: false,
            message: "Could not create account. Please try again."
        });
    }
});
// User Login API
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
        });

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        res.json({
            success: true,
            message: "Login successful!",
            user: {
                id: data.user.id,
                name: data.user.user_metadata?.full_name || "",
                email: data.user.email,
                phone: data.user.user_metadata?.phone || ""
            },
            session: data.session
        });

    } catch (error) {
        console.error("User login error:", error);

        res.status(500).json({
            success: false,
            message: "Could not complete login. Please try again."
        });
    }
});
// Admin Login API
// Admin Login API
app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        if (!process.env.ADMIN_SESSION_SECRET) {
            throw new Error("Admin session secret is missing.");
        }

        const cleanEmail = email.trim().toLowerCase();

        const { data: admin, error } = await supabase
            .from("admins")
            .select("*")
            .eq("email", cleanEmail)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (
            !admin ||
            !bcrypt.compareSync(password, admin.password_hash)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = createAdminToken(cleanEmail);

        res.json({
            success: true,
            message: "Login successful!",
            token,
            admin: {
                email: cleanEmail
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);

        res.status(500).json({
            success: false,
            message: "Could not complete admin login."
        });
    }
});
// PG data
const pgData = [
    {
        name: "StayWell Residency",
        location: "Lokmanya Nagar, Nagpur",
        price: 5500,
        rating: 4.8,
        facilities: ["Wi-Fi", "Meals", "Furnished"]
    },
    {
        name: "Sai Krupa PG",
        location: "Vasudev Nagar, Nagpur",
        price: 6000,
        rating: 4.7,
        facilities: ["Security", "Laundry", "Wi-Fi"]
    },
    {
        name: "Urban Nest PG",
        location: "Hingna Road, Nagpur",
        price: 7000,
        rating: 4.9,
        facilities: ["Furnished", "Wi-Fi", "AC"]
    }
];

// PG API
app.get("/api/pgs", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("pgs")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            throw error;
        }

        res.json([...pgData, ...(data || [])]);

    } catch (error) {
        console.error("Load PGs error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load PG listings."
        });
    }
});
// Add PG
app.post("/api/pgs", requireAdmin, async (req, res) => {
    try {
        const {
            name,
            location,
            price,
            description = "",
            suitable_for = "",
            image = "",
            facilities = []
        } = req.body || {};

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 150 ||
            typeof location !== "string" ||
            !location.trim() ||
            location.trim().length > 300
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid PG name and location."
            });
        }

        if (
            !["string", "number"].includes(typeof price) ||
            String(price).trim() === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0 ||
            Number(price) > 99999999.99
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid monthly rent greater than zero."
            });
        }

        if (
            typeof description !== "string" ||
            description.length > 3000 ||
            typeof suitable_for !== "string" ||
            suitable_for.length > 200 ||
            typeof image !== "string" ||
            image.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Please check the description, residents and image."
            });
        }

        if (
            !Array.isArray(facilities) ||
            facilities.length > 20 ||
            facilities.some(function (item) {
                return typeof item !== "string" ||
                    !item.trim() ||
                    item.length > 100;
            })
        ) {
            return res.status(400).json({
                success: false,
                message: "Facilities must be a list of valid names."
            });
        }

        const cleanImage = image.trim();

        if (
            cleanImage &&
            !/^images\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(cleanImage)
        ) {
            try {
                const imageUrl = new URL(cleanImage);

                if (
                    imageUrl.protocol !== "https:" ||
                    imageUrl.username ||
                    imageUrl.password
                ) {
                    throw new Error("Invalid image URL");
                }
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Use an HTTPS image URL or an images/filename.jpg path."
                });
            }
        }

        const { data, error } = await supabase
            .from("pgs")
            .insert({
                name: name.trim(),
                location: location.trim(),
                price: Number(Number(price).toFixed(2)),
                description: description.trim(),
                suitable_for: suitable_for.trim(),
                image: cleanImage,
                facilities: [...new Set(
                    facilities.map(function (item) {
                        return item.trim();
                    })
                )]
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: "PG added successfully!",
            pg: data
        });

    } catch (error) {
        console.error("Add PG error:", error);

        res.status(500).json({
            success: false,
            message: "Could not add PG. Please try again."
        });
    }
});

// Submit Enquiry
app.post("/api/enquiries", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email and message are required."
            });
        }

        const { data, error } = await supabase
            .from("enquiries")
            .insert([{
                name,
                email,
                phone: phone || "",
                message,
                status: "Pending"
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log("New enquiry saved:", name);

        res.json({
            success: true,
            message: "Enquiry submitted successfully!",
            enquiry: data
        });

    } catch (error) {
        console.error("Enquiry error:", error);

        res.status(500).json({
            success: false,
            message: "Could not save enquiry."
        });
    }
});

// Submit Visit Request
app.post("/api/visits", async (req, res) => {
    try {
        const { name, phone, email, date, time, message } = req.body;

        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: "Name, phone and email are required."
            });
        }

        const { data, error } = await supabase
            .from("visits")
            .insert([{
                name,
                phone,
                email,
                date: date || null,
                time: time || null,
                message: message || "",
                status: "Pending"
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log("New visit request saved:", name);

        res.json({
            success: true,
            message: "Visit request submitted successfully!",
            visit: data
        });

    } catch (error) {
        console.error("Visit request error:", error);

        res.status(500).json({
            success: false,
            message: "Could not save visit request."
        });
    }
});

// Get All Enquiries
app.get("/api/enquiries", requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("enquiries")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            throw error;
        }

        res.json(data);

    } catch (error) {
        console.error("Get enquiries error:", error);

        res.status(500).json({
            message: "Could not load enquiries."
        });
    }
});

// Send Reply Email
app.post("/api/enquiries/:id/reply", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
        return res.status(400).json({
            success: false,
            message: "Please enter a reply message."
        });
    }

    try {
        const { data: enquiry, error: fetchError } = await supabase
            .from("enquiries")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (fetchError) {
            throw fetchError;
        }

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        if (!enquiry.email) {
            return res.status(400).json({
                success: false,
                message: "No email address is available for this enquiry."
            });
        }

        const cleanReply = reply.trim();

        const emailResult = await sendEmail({
           
            to: [enquiry.email],
            subject: "Reply to Your StayNest Enquiry",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #344650;">
                    <h2>Hello ${escapeHTML(enquiry.name)},</h2>

                    <p>Thank you for contacting StayNest.</p>

                    <p>Here is our response to your enquiry:</p>

                    <div style="background: #f7f7f5; padding: 15px; border-radius: 8px;">
                        ${escapeHTML(cleanReply).replace(/\n/g, "<br>")}
                    </div>

                    <p>If you have any further questions, feel free to contact us.</p>

                    <p>Regards,<br><strong>StayNest Team</strong></p>
                </div>
            `
        });

        if (emailResult.error) {
            console.error("Resend error:", emailResult.error);

            return res.status(500).json({
                success: false,
                message: "Email could not be sent. Please check the backend terminal."
            });
        }

        // Save the reply after the email is sent
        const { error: updateError } = await supabase
            .from("enquiries")
            .update({
                reply: cleanReply,
                replied_at: new Date().toISOString()
            })
            .eq("id", id);

        if (updateError) {
            throw updateError;
        }

        console.log("Reply email sent. Enquiry ID:", id);

        res.json({
            success: true,
            emailSent: true,
            message: "Reply email sent successfully!"
        });

    } catch (error) {
        console.error("Enquiry reply error:", error);

        res.status(500).json({
            success: false,
            message: "Could not send enquiry reply."
        });
    }
});

// Update Enquiry Status
app.patch("/api/enquiries/:id/status", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Resolved"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be Pending or Resolved."
        });
    }

    try {
        const { data: enquiry, error: fetchError } = await supabase
            .from("enquiries")
            .select("id")
            .eq("id", id)
            .maybeSingle();

        if (fetchError) {
            throw fetchError;
        }

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        const { error } = await supabase
            .from("enquiries")
            .update({
                status,
                resolved_at: status === "Resolved"
                    ? new Date().toISOString()
                    : null
            })
            .eq("id", id);

        if (error) {
            throw error;
        }

        console.log(`Enquiry ${id} status updated to ${status}`);

        res.json({
            success: true,
            id: Number(id),
            status,
            message: `Enquiry marked as ${status}.`
        });

    } catch (error) {
        console.error("Enquiry status error:", error);

        res.status(500).json({
            success: false,
            message: "Could not update enquiry status."
        });
    }
});

// Get All Visit Requests
app.get("/api/visits", requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("visits")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            throw error;
        }

        res.json(data);

    } catch (error) {
        console.error("Get visits error:", error);

        res.status(500).json({
            message: "Could not load visit requests."
        });
    }
});

// Update Visit Status and Send Email
app.patch("/api/visits/:id/status", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Approved", "Rejected"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be Approved or Rejected."
        });
    }

    try {
        const { data: visit, error: fetchError } = await supabase
            .from("visits")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (fetchError) {
            throw fetchError;
        }

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Visit request not found."
            });
        }

        const { error: updateError } = await supabase
            .from("visits")
            .update({ status })
            .eq("id", id);

        if (updateError) {
            throw updateError;
        }

        if (!visit.email) {
            return res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: false,
                message: `Status updated to ${status}, but no email address is saved.`
            });
        }

        try {
            const emailResult = await sendEmail({
            
                to: [visit.email],
                subject: `StayNest Visit Request ${status}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #344650;">
                        <h2>Hello ${escapeHTML(visit.name || "there")},</h2>

                        <p>Your StayNest PG visit request has been
                            <strong>${status}</strong>.</p>

                        <p><strong>Visit date:</strong>
                            ${escapeHTML(visit.date || "Not specified")}</p>

                        <p><strong>Visit time:</strong>
                            ${escapeHTML(visit.time || "Not specified")}</p>

                        <p>Thank you for choosing StayNest!</p>
                        <p>Regards,<br><strong>StayNest Team</strong></p>
                    </div>
                `
            });

            if (emailResult.error) {
                console.error("Resend error:", emailResult.error);

                return res.json({
                    success: true,
                    id: Number(id),
                    status,
                    emailSent: false,
                    message: `Status updated to ${status}, but email could not be sent.`
                });
            }

            console.log("Visit status email sent. Visit ID:", id);

            res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: true,
                message: `Visit request ${status.toLowerCase()} and notification email sent.`
            });

        } catch (emailError) {
            console.error("Email sending failed:", emailError);

            res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: false,
                message: `Status updated to ${status}, but email could not be sent.`
            });
        }

    } catch (error) {
        console.error("Visit status error:", error);

        res.status(500).json({
            success: false,
            message: "Could not update visit request status."
        });
    }
});

// Start the server after connecting to Supabase
async function startServer() {
    try {
        await connectDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server could not start:", error.message);
        process.exit(1);
    }
}

startServer();
