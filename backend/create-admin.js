const bcrypt = require("bcryptjs");
const db = require("./database");

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const passwordHash = bcrypt.hashSync(password, 10);

try {
    const existingAdmin = db.prepare(
        "SELECT id FROM admins WHERE email = ?"
    ).get(email);

    if (existingAdmin) {
        db.prepare(
            "UPDATE admins SET password_hash = ? WHERE email = ?"
        ).run(passwordHash, email);

        console.log("Admin password reset successfully!");
    } else {
        db.prepare(`
            INSERT INTO admins (email, password_hash)
            VALUES (?, ?)
        `).run(email, passwordHash);

        console.log("Admin account created successfully!");
    }

    console.log("Email:", email);
   
} catch (error) {
    console.error("Error:", error.message);
} finally {
    db.close();
}
