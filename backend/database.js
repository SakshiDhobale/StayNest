
const Database = require("better-sqlite3");

// Create / open StayNest database
const db = new Database("staynest.db");

// Helper: Add column only if it does not exist
function addColumnIfMissing(tableName, columnName, definition) {
    const columns = db.prepare(
        `PRAGMA table_info(${tableName})`
    ).all();

    if (!columns.some(column => column.name === columnName)) {
        db.prepare(
            `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
        ).run();

        console.log(`${columnName} column added to ${tableName}`);
    }
}

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

// Add Enquiry Management columns
addColumnIfMissing(
    "enquiries",
    "status",
    "TEXT NOT NULL DEFAULT 'Pending'"
);

addColumnIfMissing("enquiries", "reply", "TEXT");
addColumnIfMissing("enquiries", "replied_at", "DATETIME");
addColumnIfMissing("enquiries", "resolved_at", "DATETIME");

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

// Add missing Visit columns
addColumnIfMissing(
    "visits",
    "status",
    "TEXT NOT NULL DEFAULT 'Pending'"
);

addColumnIfMissing("visits", "email", "TEXT");

// Create Admin table with correct email column
db.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )
`).run();

// Ensure email column exists in an older Admin table
addColumnIfMissing("admins", "email", "TEXT");

console.log("StayNest database connected successfully!");

module.exports = db;
