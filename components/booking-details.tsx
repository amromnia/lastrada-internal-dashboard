"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ArrowLeft, Edit } from "lucide-react"
import { ImageModal } from "@/components/image-modal"
import { formatMoney, formatTimeToAMPM } from "@/lib/utils"
import type { Booking } from "@/types/booking"
import { TActionLoading } from "@/app/dashboard/page"

interface BookingDetailsProps {
  booking: Booking
  onConfirm: () => void
  onEdit: () => void
  onDeny: () => void
  onBack?: () => void
  isLoading?: TActionLoading
}

export function BookingDetails({ booking, onConfirm, onEdit, onDeny, onBack, isLoading = 'idle' }: BookingDetailsProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const eventDate = new Date(booking.event_date)
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to list
              </Button>
            )}
            <div className="flex gap-2 item-center justify-start">
              <CardTitle>{booking.full_name}</CardTitle>
              {booking.is_confirmed !== false && <Edit size={15} className="cursor-pointer hover:opacity-70 transition-opacity duration-300" onClick={onEdit} />}
            </div>
            <CardDescription>{formattedDate}</CardDescription>
          </div>
          <Badge
            variant={
              booking.is_confirmed === true
                ? "success"
                : booking.is_confirmed === false
                  ? "destructive"
                  : "secondary"
            }
          >
            {booking.is_confirmed === true
              ? "Confirmed"
              : booking.is_confirmed === false
                ? "Rejected"
                : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Reference Number</p>
            <p className="text-sm font-medium text-foreground">{booking.reference_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground">{booking.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="text-sm font-medium text-foreground">{booking.phone_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Event Type</p>
            <p className="text-sm font-medium text-foreground">
              {booking.event_types?.event_en || booking.event_type || `ID: ${booking.event_type_id}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Area</p>
            <p className="text-sm font-medium text-foreground">
              {booking.areas?.area_en || booking.area || `ID: ${booking.area_id}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Event Date</p>
            <p className="text-sm font-medium text-foreground">{formattedDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serving Time</p>
            <p className="text-sm font-medium text-foreground">{formatTimeToAMPM(booking.serving_time)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ready Time</p>
            <p className="text-sm font-medium text-foreground">{formatTimeToAMPM(booking.ready_time)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="text-sm font-medium text-foreground">{booking.address}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">{booking.location}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Filming</p>
            <p className="text-sm font-medium text-foreground">{booking.is_filming ? "Yes" : "No"}</p>
          </div>
          {booking.booking_package && booking.booking_package.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Packages</p>
              <div className="space-y-2">
                {booking.booking_package.map((pkg) => (
                  <div key={pkg.id} className="p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium text-foreground capitalize">{pkg.packages.name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                      {pkg.num_guests && <span>Guests: {pkg.num_guests}</span>}
                      {pkg.num_classic_pizzas && <span>Classic Pizzas: {pkg.num_classic_pizzas}</span>}
                      {pkg.num_signature_pizzas && <span>Signature Pizzas: {pkg.num_signature_pizzas}</span>}
                      <span className="col-span-2 font-semibold text-foreground">Subtotal: {formatMoney(pkg.sub_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {booking.comment && (
            <div>
              <p className="text-sm text-muted-foreground">Comment</p>
              <p className="text-sm font-medium text-foreground">{booking.comment}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Downpayment Screenshot</p>
            {booking.downpayment_screenshot ? <button
              onClick={() => setIsImageModalOpen(true)}
              className="text-sm font-medium text-primary hover:underline cursor-pointer"
            >
              View Screenshot
            </button> : <p className="text-sm font-medium text-primary">No Screenshot</p>}
          </div>
        </div>

        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={booking.downpayment_screenshot}
          title="Downpayment Screenshot"
        />

        {booking.is_confirmed === null && (
          <div className="flex gap-2 pt-4">
            <Button onClick={onConfirm} className="flex-1" size="sm" disabled={isLoading !== 'idle'}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isLoading === 'confirm' ? "Confirming..." : "Confirm"}
            </Button>
            <Button onClick={onDeny} variant="destructive" className="flex-1" size="sm" disabled={isLoading !== 'idle'}>
              <XCircle className="w-4 h-4 mr-2" />
              {isLoading === 'deny' ? "Rejecting..." : "Deny"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
