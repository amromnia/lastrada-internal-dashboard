import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyToken } from "@/lib/auth-server"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0]

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const showRejected = url.searchParams.get("showRejected") === "true"

    const supabase = await getDb()
    let query = supabase
      .from("bookings")
      .select(
        `
        *,
        areas (area_en, area_ar),
        event_types (event_en, event_ar),
        booking_package (
          id,
          num_guests,
          num_classic_pizzas,
          num_signature_pizzas,
          sub_total,
          packages (name)
        )
      `,
      )
      .order("event_date", { ascending: true })

    // Filter out rejected bookings unless showRejected is true
    if (!showRejected) {
      query = query.or("is_confirmed.is.null,is_confirmed.eq.true")
    }

    const { data: bookings, error } = await query

    if (error) throw error

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}
