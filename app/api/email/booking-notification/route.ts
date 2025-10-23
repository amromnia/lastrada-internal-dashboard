import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendTemplateEmail } from "@/lib/email"
import { rateLimit, getClientIP } from "@/lib/rate-limit"

// Verify origin is from lastrada-eg.com
function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  // Allow requests from lastrada-eg.com domains
  const allowedDomains = [
    "https://lastrada-eg.com",
    "https://www.lastrada-eg.com",
    "https://internal.lastrada-eg.com",
    "http://localhost:3000", // For development
    "http://localhost:3001",
  ]
  
  if (origin && allowedDomains.some(domain => origin.startsWith(domain))) {
    return true
  }
  
  if (referer && allowedDomains.some(domain => referer.startsWith(domain))) {
    return true
  }
  
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Verify origin
    if (!verifyOrigin(request)) {
      return NextResponse.json({ error: "Forbidden - Invalid origin" }, { status: 403 })
    }

    // Rate limiting: 5 requests per 15 minutes per IP
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`booking-notification:${clientIP}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime)
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
    const { data: booking, error: bookingError } = await supabase
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

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
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

    // Prepare template data for customer (initial notification - simplified structure)
    const customerTemplateData = {
      customer: {
        first_name: booking.full_name.split(' ')[0] || booking.full_name,
      },
    }

    // Send email to customer
    const customerEmailResult = await sendTemplateEmail(
      "request-received",
      booking.email,
      customerTemplateData
    )

    if (!customerEmailResult.success) {
      console.error("Failed to send customer notification:", customerEmailResult.error)
    }

    // Fetch users with send_email = true
    const { data: managers, error: managersError } = await supabase
      .from("users")
      .select("email")
      .eq("send_email", true)

    const managerResults: Array<{ email: string; success: boolean; error?: string }> = []

    if (!managersError && managers && managers.length > 0) {
      // Split full name into first and last name
      const nameParts = booking.full_name.split(' ')
      const firstName = nameParts[0] || booking.full_name
      const lastName = nameParts.slice(1).join(' ') || ''

      // Format notes as HTML (escape and preserve line breaks)
      const notesHtml = booking.notes 
        ? booking.notes.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/\n/g, '<br>')
        : 'No notes provided'

      // Prepare template data for managers
      const managerTemplateData = {
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: booking.email,
        },
        event: {
          title: booking.event_types?.event_en || "Event",
          date_pretty: formattedDate,
          time_pretty: formatTime(booking.serving_time),
          location: `${booking.areas?.area_en || 'Area'} - ${booking.location || booking.address}`,
        },
        notes_html: notesHtml,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://internal.lastrada-eg.com"}`,
      }

      // Send emails to all managers
      for (const manager of managers) {
        const result = await sendTemplateEmail(
          "manager-booking-received",
          manager.email,
          managerTemplateData
        )
        
        managerResults.push({
          email: manager.email,
          success: result.success,
          error: result.error,
        })
      }
    }

    // Get origin for CORS headers
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://lastrada-eg.com",
      "https://www.lastrada-eg.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ]
    const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : null

    return NextResponse.json({ 
      success: true,
      customer_email_sent: customerEmailResult.success,
      manager_emails_sent: managerResults.filter(r => r.success).length,
      total_managers: managerResults.length,
      remaining_requests: rateLimitResult.remaining,
    }, {
      headers: {
        ...(responseOrigin ? {
          "Access-Control-Allow-Origin": responseOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        } : {}),
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.resetTime)
      }
    })
  } catch (error) {
    console.error("Error sending booking notifications:", error)
    
    // Get origin for CORS on error response too
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://lastrada-eg.com",
      "https://www.lastrada-eg.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ]
    const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : null

    return NextResponse.json({ error: "Internal server error" }, { 
      status: 500,
      headers: responseOrigin ? {
        "Access-Control-Allow-Origin": responseOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      } : {}
    })
  }
}

// Add CORS headers for OPTIONS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin")
  const allowedOrigins = [
    "https://lastrada-eg.com",
    "https://www.lastrada-eg.com",
    "http://localhost:3000",
    "http://localhost:3001",
  ]

  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": responseOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  })
}
