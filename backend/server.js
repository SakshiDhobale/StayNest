
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

// Helper: Safely display text inside email HTML
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

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email and message are required."
            });
        }

        const insertEnquiry = db.prepare(`
            INSERT INTO enquiries (name, email, phone, message)
            VALUES (?, ?, ?, ?)
        `);

        insertEnquiry.run(name, email, phone || "", message);

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
        res.status(500).json({
            message: "Could not load enquiries."
        });
    }
});

// Admin - Send Custom Reply Email
app.post("/api/enquiries/:id/reply", async (req, res) => {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
        return res.status(400).json({
            success: false,
            message: "Please enter a reply message."
        });
    }

    try {
        const enquiry = db.prepare(
            "SELECT * FROM enquiries WHERE id = ?"
        ).get(id);

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

        const emailResult = await resend.emails.send({
            from: "StayNest <onboarding@resend.dev>",
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

        // Save reply only after successful email sending
        db.prepare(`
            UPDATE enquiries
            SET reply = ?, replied_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(cleanReply, id);

        console.log("Enquiry reply email sent. Enquiry ID:", id);

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

// Admin - Mark Enquiry as Resolved or Pending
app.patch("/api/enquiries/:id/status", (req, res) => {
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
        const enquiry = db.prepare(
            "SELECT * FROM enquiries WHERE id = ?"
        ).get(id);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found."
            });
        }

        db.prepare(`
            UPDATE enquiries
            SET status = ?,
                resolved_at = CASE
                    WHEN ? = 'Resolved' THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
            WHERE id = ?
        `).run(status, status, id);

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

// Admin - Get Visit Requests
app.get("/api/visits", (req, res) => {
    try {
        const visits = db.prepare(
            "SELECT * FROM visits ORDER BY id DESC"
        ).all();

        res.json(visits);
    } catch (error) {
        console.error("Get visits error:", error);
        res.status(500).json({
            message: "Could not load visit requests."
        });
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
        const visit = db.prepare(
            "SELECT * FROM visits WHERE id = ?"
        ).get(id);

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: "Visit request not found."
            });
        }

        db.prepare(
            "UPDATE visits SET status = ? WHERE id = ?"
        ).run(status, id);

        if (!visit.email) {
            return res.json({
                success: true,
                id: Number(id),
                status,
                emailSent: false,
                message: `Status updated to ${status}, but no email address is saved for this request.`
            });
        }

        try {
            const emailResult = await resend.emails.send({
                from: "StayNest <onboarding@resend.dev>",
                to: [visit.email],
                subject: `StayNest Visit Request ${status}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Hello ${escapeHTML(visit.name || "there")},</h2>
                        <p>Your StayNest PG visit request has been
                            <strong>${status}</strong>.</p>
                        <p><strong>Visit date:</strong>
                            ${escapeHTML(visit.date || "Not specified")}</p>
                        <p><strong>Visit time:</strong>
                            ${escapeHTML(visit.time || "Not specified")}</p>
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


  
        

  

        
                    
              
