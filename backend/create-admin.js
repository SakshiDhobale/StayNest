require("dotenv").config();

const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function createAdmin() {
    try {
        // Check required environment variables
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase environment variables are missing.");
        }

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
        }

        // Connect to Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Hash admin password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create or update admin account
        const { data, error } = await supabase
            .from("admins")
            .upsert(
                {
                    email: email,
                    password_hash: passwordHash
                },
                {
                    onConflict: "email"
                }
            )
            .select("id, email")
            .single();

        if (error) {
            throw error;
        }

        console.log("Admin account created/updated successfully!");
        console.log("Admin email:", data.email);

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    }
}

createAdmin();
