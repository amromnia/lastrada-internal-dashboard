import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

// Hash password using PBKDF2 (same as auth-server.ts)
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

async function addAdminUser() {
  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    console.error("These should be set in your .env or .env.local file")
    process.exit(1)
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const email = "admin@example.com"
  const password = "admin123"

  try {
    console.log("Checking if user already exists...")
    
    // Check if user already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existing) {
      console.log("User already exists with email:", email)
      process.exit(0)
    }

    console.log("Hashing password...")
    const passwordHash = await hashPassword(password)

    console.log("Creating admin user...")
    const { data: user, error } = await supabase
      .from("users")
      .insert({ 
        email, 
        password_hash: passwordHash 
      })
      .select("id, email")
      .single()

    if (error) {
      throw error
    }

    console.log("✅ Admin user created successfully!")
    console.log("Email:", user.email)
    console.log("Password: admin123")
    console.log("\nYou can now login with these credentials.")
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
    process.exit(1)
  }
}

addAdminUser()
