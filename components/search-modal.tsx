"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Calendar, User, Hash, Phone } from "lucide-react"
import type { Booking } from "@/types/booking"

interface SearchModalProps {
  onSelectBooking: (booking: Booking) => void
}

export function SearchModal({ onSelectBooking }: SearchModalProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [allBookings, setAllBookings] = useState<Booking[]>([])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings")
      if (!response.ok) throw new Error("Failed to fetch bookings")
      const data = await response.json()
      setAllBookings(data.bookings || [])
    } catch (err) {
      console.error("Error fetching bookings:", err)
    }
  }

  useEffect(() => {
    if (open) {
      fetchBookings()
      setSearchQuery("")
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const query = searchQuery.toLowerCase()
    
    // Search through reference number, phone number, and full name
    const filtered = allBookings.filter((booking) => {
      const refMatch = booking.reference_number?.toLowerCase().includes(query)
      const phoneMatch = booking.phone_number?.toLowerCase().includes(query)
      const nameMatch = booking.full_name?.toLowerCase().includes(query)
      return refMatch || phoneMatch || nameMatch
    })

    setResults(filtered)
    setLoading(false)
  }, [searchQuery, allBookings])

  const handleSelectBooking = (booking: Booking) => {
    onSelectBooking(booking)
    setOpen(false)
  }

  const getStatus = (booking: Booking) => {
    if (booking.is_confirmed === true) return "confirmed"
    if (booking.is_confirmed === false) return "denied"
    return "pending"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Bookings</DialogTitle>
          <DialogDescription>
            Search by reference number, phone number, or full name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              results.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => handleSelectBooking(booking)}
                  className="p-4 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          <Hash className="w-3 h-3 mr-1" />
                          {booking.reference_number}
                        </Badge>
                        <Badge
                          variant={
                            getStatus(booking) === "pending"
                              ? "secondary"
                              : getStatus(booking) === "confirmed"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {getStatus(booking)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{booking.full_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{booking.phone_number}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(booking.event_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found matching "{searchQuery}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Start typing to search bookings
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
