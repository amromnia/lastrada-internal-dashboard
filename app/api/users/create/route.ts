import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { hashPassword } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await getDb()

    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    } 

    const passwordHash = await hashPassword(password)
    const { data: result, error } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash })
      .select("id, email")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ user: result }, { status: 201 })
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
