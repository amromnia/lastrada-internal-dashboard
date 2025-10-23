"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Booking } from "@/types/booking"

interface BookingCalendarProps {
  bookings: Booking[]
  onSelectBooking: (booking: Booking, allDateBookings?: Booking[]) => void
  onSelectDate?: (bookings: Booking[]) => void
}

export function BookingCalendar({ bookings, onSelectBooking, onSelectDate }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getBookingsForDate = (date: Date) => {
    // Format date as YYYY-MM-DD in local timezone without any timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return bookings.filter((b) => b.event_date.startsWith(dateStr))
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  const formatDateString = (day: Date) => {
    const year = day.getFullYear()
    const month = String(day.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day.getDate()).padStart(2, '0')
    return `${year}-${month}-${dayStr}`
  }

  const handleDateClick = (day: Date, dayBookings: Booking[]) => {
    // Set the selected date even if no bookings
    setSelectedDate(formatDateString(day))
    
    if (dayBookings.length === 0) {
      // Show empty state
      onSelectDate?.([])
      return
    }
    
    if (dayBookings.length === 1) {
      // If only one booking, show it directly (pass dayBookings for consistency)
      onSelectBooking(dayBookings[0], dayBookings)
    } else {
      // If multiple bookings, show the list
      onSelectDate?.(dayBookings)
    }
  }

  const handleBookingClick = (booking: Booking, day: Date, dayBookings: Booking[]) => {
    // Set the selected date when clicking a booking directly
    setSelectedDate(formatDateString(day))
    // Pass all bookings for the date so the parent can decide if back button is needed
    onSelectBooking(booking, dayBookings)
  }

  const getBookingColor = (booking: Booking) => {
    if (booking.is_confirmed === true) return "bg-green-600 hover:bg-green-700"
    if (booking.is_confirmed === false) return "bg-[#f80328] hover:bg-[#d00220]"
    return "bg-primary hover:opacity-80"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{monthName}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-[1.5px] border-black/40 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-[1.5px] rounded" style={{ borderColor: '#f80328' }}></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {days.map((day, idx) => {
          const dayBookings = day ? getBookingsForDate(day) : []
          const isToday = day && day.toDateString() === new Date().toDateString()
          const hasBookings = dayBookings.length > 0
          
          // Check if this date is selected
          const isSelected = day && selectedDate && (() => {
            const year = day.getFullYear()
            const month = String(day.getMonth() + 1).padStart(2, '0')
            const dayStr = String(day.getDate()).padStart(2, '0')
            return selectedDate === `${year}-${month}-${dayStr}`
          })()

          return (
            <div
              key={idx}
              onClick={() => day && handleDateClick(day, dayBookings)}
              className={`aspect-square p-2 border rounded-lg transition-colors ${
                day ? "bg-card hover:bg-muted cursor-pointer" : "bg-muted"
              } ${
                isSelected 
                  ? "border-[1.5px]" 
                  : isToday 
                  ? "border-[1.5px] border-black/40" 
                  : "border-border"
              }`}
              style={isSelected ? { borderColor: '#f80328' } : undefined}
            >
              {day ? (
                <>
                  <div className="text-sm font-semibold text-foreground mb-1 md:text-left text-center">{day.getDate()}</div>
                  
                  {/* Desktop view: Show booking names */}
                  <div className="hidden md:block space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBookingClick(booking, day, dayBookings)
                        }}
                        className={`text-xs p-1 rounded text-white truncate cursor-pointer transition-colors ${getBookingColor(booking)}`}
                      >
                        {booking.full_name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayBookings.length - 2} more</div>
                    )}
                  </div>

                  {/* Mobile view: Show dot indicator - always render container for consistent height */}
                  <div className="md:hidden flex justify-center items-center h-3">
                    {hasBookings && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </>
              ) : (
                <div className="md:hidden h-3"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
