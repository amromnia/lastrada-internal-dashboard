import { verifyToken } from "@/lib/auth-server";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0]

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await getDb()

    const { data, error } = await supabase
      .from('event_types')
      .select('id, name:event_en')

    if (error) {
      console.error('Error fetching event types:', error)
      return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 })
    }

    return NextResponse.json({ eventTypes: data })
  } catch (error) {
    console.error('Error fetching event types:', error)
    return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 })
  }
}