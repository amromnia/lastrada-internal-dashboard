import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyAuth } from "@/lib/auth-server"

export async function POST(request: Request) {
  const authResult = await verifyAuth(request)
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId, sendEmail } = await request.json()

    if (!userId || typeof sendEmail !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const supabase = await getDb()
    const { error } = await supabase
      .from("users")
      .update({ send_email: sendEmail })
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating email preference:", error)
    return NextResponse.json({ error: "Failed to update email preference" }, { status: 500 })
  }
}
