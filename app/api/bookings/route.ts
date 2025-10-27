import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyToken } from "@/lib/auth-server"
import { Booking } from "@/types/booking"

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = decoded.userId

    const body = await request.json();

    // Transform frontend data to database format
    const dbBooking = {
      full_name: body.name || body.fullName,
      email: body.email,
      phone_number: body.phone,
      event_type_id: Number(body.eventType),
      area_id: Number(body.area),
      event_date: body.eventDate || body.date,
      serving_time: body.servingTime,
      ready_time: body.readyTime,
      address: body.address,
      location: body.location,
      package_id: body.package,
      num_guests: body.guests,
      num_classic_pizzas: body.classicPizzas,
      num_signature_pizzas: body.signaturePizzas,
      comment: body.comment,
      downpayment_screenshot: body.downpaymentUrl,
      is_filming: body.allowFilming || body.filming === 'Yes',
      sub_total: body.subtotal
    };
    console.log("🚀 ~ POST ~ dbBooking:", dbBooking)

    const supabase = await getDb()


    if (!dbBooking.package_id) {
      return NextResponse.json({ error: "Please select a package" }, { status: 400 });
    };

    const { data, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        full_name: dbBooking?.full_name,
        email: dbBooking?.email,
        phone_number: dbBooking?.phone_number,
        event_type_id: Number(dbBooking?.event_type_id),
        event_date: dbBooking?.event_date,
        address: dbBooking?.address,
        location: dbBooking?.location,
        ready_time: dbBooking?.ready_time,
        serving_time: dbBooking?.serving_time,
        is_filming: dbBooking?.is_filming === "yes",
        comment: dbBooking?.comment || null,
        area_id: Number(dbBooking?.area_id),
        downpayment_screenshot: dbBooking.downpayment_screenshot,
        added_by: userId
      })
      .select("*, areas (area_en, area_ar), event_types (event_en, event_ar)").single();

    if (bookingError) throw bookingError;

    const { data: bookingPackageData, error: bookingPackageError } = await supabase.from("booking_package").insert({
      booking_id: data?.id,
      package_id: dbBooking?.package_id,
      num_guests: dbBooking?.num_guests || null,
      num_classic_pizzas: dbBooking?.num_classic_pizzas || null,
      num_signature_pizzas: dbBooking?.num_signature_pizzas || null,
      sub_total: dbBooking?.sub_total || null,
    }).select("*, packages (name)").single();


    if (bookingPackageError) throw bookingPackageError


    const newBookingData: Booking = {
      id: data?.id,
      event_date: data?.event_date,
      serving_time: data?.serving_time,
      ready_time: data?.ready_time,
      is_confirmed: data?.is_confirmed,
      status: data?.status,
      full_name: data?.full_name,
      email: data?.email,
      phone_number: data?.phone_number,
      is_filming: data?.is_filming,
      address: data?.address,
      location: data?.location,
      comment: data?.comment,
      downpayment_screenshot: data?.downpayment_screenshot,
      area_id: data?.area_id,
      event_type_id: data?.event_type_id,
      reference_number: data?.reference_number,
      created_at: data?.created_at,
      areas: {
        area_en: data?.areas?.area_en,
        area_ar: data?.areas?.area_ar,
      },
      event_types: {
        event_en: data?.event_types?.event_en,
        event_ar: data?.event_types?.event_ar,
      },
      booking_package: [{
        id: bookingPackageData?.id,
        num_guests: bookingPackageData?.num_guests || null,
        num_classic_pizzas: bookingPackageData?.num_classic_pizzas || null,
        num_signature_pizzas: bookingPackageData?.num_signature_pizzas || null,
        sub_total: bookingPackageData?.sub_total || null,
        packages: {
          name: bookingPackageData?.packages?.name,
        },
      }],
    }

    console.log("🚀 ~ POST ~ newBookingData:", newBookingData)
    if (newBookingData) {
      return NextResponse.json({ booking: newBookingData });
    }

    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking', details: String(error) }, { status: 500 });
  }
}