import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyAuth } from "@/lib/auth-server"

export async function GET(request: Request) {
  const authResult = await verifyAuth(request)
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = await getDb()
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
