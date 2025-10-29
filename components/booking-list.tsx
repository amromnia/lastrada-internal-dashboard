"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTimeToAMPM } from "@/lib/utils"
import type { Booking } from "@/types/booking"

interface BookingListProps {
  bookings: Booking[]
  onSelectBooking: (booking: Booking, allDateBookings?: Booking[]) => void
}

export function BookingList({ bookings, onSelectBooking }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>Selected Date</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No bookings on this day</p>
        </CardContent>
      </Card>
    )
  }

  const dateStr = new Date(bookings[0].event_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>{dateStr}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => onSelectBooking(booking, bookings)}
              className="p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{booking.full_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.email}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{booking.event_types?.event_en || 'Event'}</span>
                    <span>•</span>
                    <span>{booking.areas?.area_en || 'Area'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Serving: {formatTimeToAMPM(booking.serving_time)} • Ready: {formatTimeToAMPM(booking.ready_time)}
                  </p>
                </div>
                <Badge 
                  variant={
                    booking.is_confirmed === true 
                      ? "success" 
                      : booking.is_confirmed === false 
                      ? "destructive" 
                      : "secondary"
                  } 
                  className="ml-2"
                >
                  {booking.is_confirmed === true 
                    ? "Confirmed" 
                    : booking.is_confirmed === false 
                    ? "Rejected" 
                    : "Pending"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
