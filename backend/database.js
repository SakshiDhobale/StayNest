const Database = require("better-sqlite3");

// Create / open StayNest database
const db = new Database("staynest.db");

// Create Enquiries table
db.prepare(`
    CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Create Visit Requests table
db.prepare(`
    CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT,
        time TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Add status column to existing Visit Requests table
const visitColumns = db.prepare("PRAGMA table_info(visits)").all();

if (!visitColumns.some(column => column.name === "status")) {
    db.prepare(`
        ALTER TABLE visits
        ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending'
    `).run();

    console.log("Visit request status column added successfully!");
}

// Add email column to existing Visit Requests table
const updatedVisitColumns = db.prepare("PRAGMA table_info(visits)").all();

if (!updatedVisitColumns.some(column => column.name === "email")) {
    db.prepare(`
        ALTER TABLE visits
        ADD COLUMN email TEXT
    `).run();

    console.log("Visit request email column added successfully!");
}

// Create Admin table
db.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )
`).run();
console.log("StayNest database connected successfully!");

module.exports = db;
