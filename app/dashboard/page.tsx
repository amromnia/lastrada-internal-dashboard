"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BookingCalendar } from "@/components/booking-calendar"
import { BookingDetails } from "@/components/booking-details"
import { BookingList } from "@/components/booking-list"
import { UsersModal } from "@/components/users-modal"
import { SearchModal } from "@/components/search-modal"
import type { Booking } from "@/types/booking"
import { CreateBookingDialog } from "@/components/create-booking-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { EditBookingDialog } from "@/components/edit-booking-dialog"

export type TActionLoading = 'idle' | 'confirm' | 'deny'

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [dateBookings, setDateBookings] = useState<Booking[] | null>(null)
  const [showRejected, setShowRejected] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const [actionLoading, setActionLoading] = useState<TActionLoading>('idle')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const detailsRef = useRef<HTMLDivElement>(null)

  const isMobile = useIsMobile()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          // Clear the invalid token and redirect to login
          await fetch("/api/auth/logout", { method: "POST" })
          router.push("/login")
          return
        }

        const data = await response.json()
        setUser(data.user)
        fetchBookings()
      } catch (err) {
        console.error("Auth check error:", err)
        // Clear the invalid token and redirect to login
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const fetchBookings = async (isRefetch = false) => {
    if (isRefetch) {
      setRefetching(true)
    }
    try {
      const response = await fetch(`/api/bookings?showRejected=${showRejected}`)
      if (!response.ok) throw new Error("Failed to fetch bookings")
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (err) {
      console.error("Error fetching bookings:", err)
    } finally {
      setLoading(false)
      setRefetching(false)
    }
  }

  // Refetch when showRejected changes
  useEffect(() => {
    if (user) {
      fetchBookings(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRejected, user])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const scrollToDetails = () => {
    // On mobile, scroll to the details section
    if (window.innerWidth < 1024 && detailsRef.current) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const handleSelectBooking = (booking: Booking, allDateBookings?: Booking[]) => {
    setSelectedBooking(booking)
    scrollToDetails()
    // If allDateBookings is provided and has multiple bookings, set it for back navigation
    // Otherwise clear it (single booking scenario)
    if (allDateBookings && allDateBookings.length > 1) {
      setDateBookings(allDateBookings)
    } else {
      setDateBookings(null)
    }
  }

  const handleSelectDate = (bookings: Booking[]) => {
    // Only set dateBookings if there are multiple bookings
    setDateBookings(bookings.length > 1 ? bookings : null)
    setSelectedBooking(null)
    scrollToDetails()
  }

  const handleBack = () => {
    setSelectedBooking(null)
    // dateBookings remains set, so we go back to the list
  }

  const handleConfirmBooking = async (bookingId: string | number) => {
    setActionLoading('confirm')
    try {
      const response = await fetch(`/api/bookings/${bookingId}/confirm`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to confirm booking")

      const updatedBookings = bookings.map((b) => (b.id === bookingId ? { ...b, is_confirmed: true } : b))
      setBookings(updatedBookings)

      // Re-select the updated booking
      const updatedBooking = updatedBookings.find((b) => b.id === bookingId)
      if (updatedBooking) {
        setSelectedBooking(updatedBooking)
      }

      // Send confirmation email
      try {
        const emailResponse = await fetch("/api/email/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        })

        if (!emailResponse.ok) {
          console.error("Failed to send confirmation email")
        }
      } catch (emailErr) {
        console.error("Error sending confirmation email:", emailErr)
      }
    } catch (err) {
      console.error("Error confirming booking:", err)
    } finally {
      setActionLoading('idle')
    }
  }

  const handleDenyBooking = async (bookingId: string | number) => {
    setActionLoading('deny')
    try {
      const response = await fetch(`/api/bookings/${bookingId}/deny`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to deny booking")

      const updatedBookings = bookings.map((b) => (b.id === bookingId ? { ...b, is_confirmed: false } : b))
      setBookings(updatedBookings)

      // Re-select the updated booking
      const updatedBooking = updatedBookings.find((b) => b.id === bookingId)
      if (updatedBooking) {
        setSelectedBooking(updatedBooking)
      }

      // If not showing rejected, refetch to remove it from view
      if (!showRejected) {
        setTimeout(() => fetchBookings(true), 500)
      }
    } catch (err) {
      console.error("Error denying booking:", err)
    } finally {
      setActionLoading('idle')
    }
  }

  const handleBookingCreated = (newBooking: Booking) => {
    console.log("🚀 ~ handleBookingCreated ~ newBooking:", newBooking)
    setBookings([...bookings, newBooking]);
    setSelectedBooking(newBooking);
  };

  const toggleEditBookingDialog = () => setEditDialogOpen((prev) => !prev);

  const handleBookingEdited = (editedBooking: Booking) => {
    console.log("🚀 ~ handleBookingEdited ~ editedBooking:", editedBooking)
    setBookings((prev) => prev.map((booking) => (booking.id === editedBooking.id ? editedBooking : booking)));
    setSelectedBooking(editedBooking);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Lastrada Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Lastrada Internal</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SearchModal onSelectBooking={(booking) => {
                setSelectedBooking(booking)
                setDateBookings(null)
                scrollToDetails()
              }} />
              <UsersModal />

              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-row items-center justify-between mb-6">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border w-fit">
            <Switch
              id="show-rejected"
              checked={showRejected}
              onCheckedChange={setShowRejected}
              disabled={refetching}
            />
            <Label htmlFor="show-rejected" className="cursor-pointer text-sm font-medium m-0">
              Show rejected bookings
            </Label>
            {refetching && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {!isMobile && "New Booking"}
          </Button>
        </div>

        <div className="relative">
          {refetching && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Updating bookings...</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Calendar</CardTitle>
                  <CardDescription>Click on a date to view bookings for that day</CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingCalendar
                    bookings={bookings}
                    onSelectBooking={handleSelectBooking}
                    onSelectDate={handleSelectDate}
                  />
                </CardContent>
              </Card>
            </div>

            <div ref={detailsRef}>
              {selectedBooking ? (
                <BookingDetails
                  booking={selectedBooking}
                  onConfirm={() => handleConfirmBooking(selectedBooking.id)}
                  onEdit={toggleEditBookingDialog}
                  onDeny={() => handleDenyBooking(selectedBooking.id)}
                  onBack={dateBookings ? handleBack : undefined}
                  isLoading={actionLoading}
                />
              ) : dateBookings ? (
                <BookingList
                  bookings={dateBookings}
                  onSelectBooking={handleSelectBooking}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Select a booking from the calendar to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <CreateBookingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onBookingCreated={handleBookingCreated}
      />
      {selectedBooking && <EditBookingDialog bookingId={selectedBooking.id} open={editDialogOpen} onOpenChange={toggleEditBookingDialog} onBookingEdited={handleBookingEdited} bookingData={selectedBooking} />}
    </div>
  )
}
