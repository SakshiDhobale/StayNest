
require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const db = require("./database");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Home route
app.get("/", (req, res) => {
    res.send("StayNest Backend is Running!");
});

// Admin Login API
app.post("/api/admin/login", (req, res) => {
    console.log("ADMIN LOGIN API HIT");

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    const admin = db.prepare(
        "SELECT * FROM admins WHERE email = ?"
    ).get(email);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password."
        });
    }

    res.json({
        success: true,
        message: "Login successful!"
    });
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
app.get("/api/pgs", (req, res) => {
    res.json(pgData);
});

// Enquiry API
app.post("/api/enquiries", (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        const insertEnquiry = db.prepare(`
            INSERT INTO enquiries (name, email, phone, message)
            VALUES (?, ?, ?, ?)
        `);

        insertEnquiry.run(name, email, phone, message);

        console.log("New Enquiry Saved to Database:", name);

        res.json({
            success: true,
            message: "Enquiry submitted successfully!"
        });
    } catch (error) {
        console.error("Enquiry error:", error);

        res.status(500).json({
            success: false,
            message: "Could not save enquiry."
        });
    }
});

// Visit Request API
app.post("/api/visits", (req, res) => {
    try {
        const { name, phone, email, date, time, message } = req.body;

        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: "Name, phone and email are required."
            });
        }

        const insertVisit = db.prepare(`
            INSERT INTO visits
                (name, phone, email, date, time, message)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertVisit.run(name, phone, email, date, time, message);

        console.log("New Visit Request Saved:", name, email);

        res.json({
            success: true,
            message: "Visit request submitted successfully!"
        });
    } catch (error) {
        console.error("Visit request error:", error);

        res.status(500).json({
            success: false,
            message: "Could not save visit request."
        });
    }
});

// Admin - Get Enquiries
app.get("/api/enquiries", (req, res) => {
    try {
        const enquiries = db.prepare(
            "SELECT * FROM enquiries ORDER BY id DESC"
        ).all();

        res.json(enquiries);
    } catch (error) {
        console.error("Get enquiries error:", error);
        res.status(500).json({ message: "Could not load enquiries." });
    }
});

// Admin - Update Enquiry Status and Send Email
app.patch("/api/enquiries/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Resolved"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be Pending or Resolved."
        });
    }

    try {
        const enquiry = db.prepare(
            "SELECT id, name, email FROM enquiries WHERE id = ?"
        ).get(id);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        // Save the status in the database
        db.prepare(
            "UPDATE enquiries SET status = ? WHERE id = ?"
        ).run(status, id);

        // Send email only when marked Resolved
        if (status === "Resolved" && enquiry.email) {
            try {
                const emailResult = await resend.emails.send({
                    from: "StayNest <onboarding@resend.dev>",
                    to: [enquiry.email],
                    subject: "Your StayNest Enquiry Has Been Resolved",
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                            <h2>Hello ${String(enquiry.name || "there")
                                .replace(/[&<>"']/g, "")},</h2>
                            <p>Your enquiry submitted through StayNest
                                has been marked as <strong>Resolved</strong>.</p>
                            <p>Thank you for contacting StayNest!</p>
                            <p>Regards,<br>StayNest Team</p>
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
                        message: "Status updated, but email could not be sent."
                    });
                }

                return res.json({
                    success: true,
                    id: Number(id),
                    status,
                    emailSent: true,
                    message: "Enquiry resolved and notification email sent."
                });
            } catch (emailError) {
                console.error("Enquiry email failed:", emailError);
                return res.json({
                    success: true,
                    id: Number(id),
                    status,
                    emailSent: false,
                    message: "Status updated, but email could not be sent."
                });
            }
        }

        return res.json({
            success: true,
            id: Number(id),
            status,
            emailSent: false,
            message: `Enquiry marked as ${status}.`
        });

    } catch (error) {
        console.error("Update enquiry status error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not update enquiry status."
        });
    }
});/

// Admin - Get Visit Requests
app.get("/api/visits", (req, res) => {
    try {
        const visits = db.prepare(
            "SELECT * FROM visits ORDER BY id DESC"
        ).all();

        res.json(visits);
    } catch (error) {
        console.error("Get visits error:", error);
        res.status(500).json({ message: "Could not load visit requests." });
    }
});

// Admin - Update Visit Request Status and Send Email
app.patch("/api/visits/:id/status", async (req, res) => {
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
        // Find visit request
        const visit = db.prepare(
            "SELECT * FROM visits WHERE id = ?"
        ).get(id);

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Visit request not found."
            });
        }

        // Save status before attempting email
        db.prepare(
            "UPDATE visits SET status = ? WHERE id = ?"
        ).run(status, id);

        // Older requests may not have an email address
        if (!visit.email) {
            return res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: false,
                message: `Status updated to ${status}, but no email address is saved for this request.`
            });
        }

        // Send status notification using Resend
        try {
            const emailResult = await resend.emails.send({
                from: "StayNest <onboarding@resend.dev>",
                to: [visit.email],
                subject: `StayNest Visit Request ${status}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Hello ${String(visit.name || "there")
                            .replace(/[&<>"']/g, "")},</h2>
                        <p>Your StayNest PG visit request has been
                            <strong>${status}</strong>.</p>
                        <p><strong>Visit date:</strong>
                            ${String(visit.date || "Not specified")
                                .replace(/[&<>"']/g, "")}</p>
                        <p><strong>Visit time:</strong>
                            ${String(visit.time || "Not specified")
                                .replace(/[&<>"']/g, "")}</p>
                        <p>Thank you for choosing StayNest!</p>
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
                    message: `Status updated to ${status}, but email could not be sent. Check the backend terminal.`
                });
            }

            console.log("Status email sent. Visit ID:", id);

            return res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: true,
                message: `Visit request ${status.toLowerCase()} and notification email sent.`
            });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);

            return res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: false,
                message: `Status updated to ${status}, but email could not be sent. Check the backend terminal.`
            });
        }
    } catch (error) {
        console.error("Status update error:", error);

        res.status(500).json({
            success: false,
            message: "Could not update visit request status."
        });
    }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
