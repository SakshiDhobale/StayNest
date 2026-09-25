const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// Home route
app.get("/", (req, res) => {
    res.send("StayNest Backend is Running!");
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
    const { name, email, phone, message } = req.body;

    const insertEnquiry = db.prepare(`
        INSERT INTO enquiries (name, email, phone, message)
        VALUES (?, ?, ?, ?)
    `);

    insertEnquiry.run(name, email, phone, message);

    console.log("New Enquiry Saved to Database:");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Phone:", phone);
    console.log("Message:", message);

    res.json({
        success: true,
        message: "Enquiry submitted successfully!"
    });
});

// Visit Request API
app.post("/api/visits", (req, res) => {
    const { name, phone, date, time, message } = req.body;

    const insertVisit = db.prepare(`
        INSERT INTO visits (name, phone, date, time, message)
        VALUES (?, ?, ?, ?, ?)
    `);

    insertVisit.run(name, phone, date, time, message);

    console.log("New Visit Request Saved to Database:");
    console.log("Name:", name);
    console.log("Phone:", phone);
    console.log("Date:", date);
    console.log("Time:", time);
    console.log("Message:", message);

    res.json({
        success: true,
        message: "Visit request submitted successfully!"
    });
});

// Admin - Get Enquiries
app.get("/api/enquiries", (req, res) => {
    const enquiries = db.prepare(
        "SELECT * FROM enquiries ORDER BY id DESC"
    ).all();

    res.json(enquiries);
});

// Admin - Get Visit Requests
app.get("/api/visits", (req, res) => {
    const visits = db.prepare(
        "SELECT * FROM visits ORDER BY id DESC"
    ).all();

    res.json(visits);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});