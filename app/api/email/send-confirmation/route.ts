import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyToken } from "@/lib/auth-server"
import { sendTemplateEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Verify JWT authentication
    const token = request.cookies.get("auth_token")?.value

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: 20 requests per 10 minutes per authenticated user
    const rateLimitResult = rateLimit(`confirm-email:${token}`, {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 20,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
          }
        }
      )
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Fetch booking details
    const supabase = await getDb()
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
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
      `)
      .eq("id", bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.is_confirmed !== true) {
      return NextResponse.json({ error: "Booking is not confirmed" }, { status: 400 })
    }

    // Format date for email
    const eventDate = new Date(booking.event_date)
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Format time to AM/PM
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours, 10)
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${period}`
    }

    // Prepare template data with nested structure
    const templateData = {
      customer: {
        first_name: booking.full_name.split(' ')[0] || booking.full_name,
      },
      event: {
        title: booking.event_types?.event_en || "Event",
        date_pretty: formattedDate,
        time_pretty: formatTime(booking.serving_time),
        location: `${booking.areas?.area_en || 'Area'} - ${booking.location || booking.address}`,
      },
    }

    // Send confirmation email
    const result = await sendTemplateEmail("booking-confirmed", booking.email, templateData)

    if (!result.success) {
      console.error("Failed to send confirmation email:", result.error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      remaining: rateLimitResult.remaining 
    })
  } catch (error) {
    console.error("Error sending confirmation email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
