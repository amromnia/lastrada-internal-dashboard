import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PackageSelectionStep } from './package-selection-step';
import { BookingDetailsStep } from './booking-details-step';
import { Booking } from '@/types/booking';
import { BookingData } from '@/types/bookingData';
import { PackageData } from '@/types/packageData';
import { PackageType } from '@/types/packageType';
import { BookingUpdatedConfirmation } from './booking-updated-confirmation';

interface EditBookingDialogProps {
  bookingId: string | number;
  open: boolean;
  bookingData: Booking
  onOpenChange: (open: boolean) => void;
  onBookingEdited: (booking: any) => void;
}

export function EditBookingDialog({ bookingId, open, bookingData, onOpenChange, onBookingEdited }: EditBookingDialogProps) {
  const [step, setStep] = useState<'package' | 'details' | 'confirmation'>('package');
  const [editedPackageData, setEditedPackageData] = useState<PackageData>();
  const [editedBookingData, setEditedBookingData] = useState<BookingData>();
  const [newBookingData, setNewBookingData] = useState<Booking>();
  const [submitting, setSubmitting] = useState(false);

  const handlePackageSubmit = (data: PackageData) => {
    setEditedPackageData(data);
    setStep('details');
  };

  const handleDetailsSubmit = async (data: BookingData) => {
    try {
      setSubmitting(true);
      setEditedBookingData(data);

      // Create the complete booking
      const completeBooking = {
        ...editedPackageData,
        ...data,
        date: data.eventDate,
        name: data.fullName,
        package: editedPackageData?.packageType.id,
        filming: data.allowFilming ? 'Yes' : 'No',
        subtotal: editedPackageData?.subtotal || 0,
      };
      console.log("🚀 ~ handleDetailsSubmit ~ completeBooking:", completeBooking)

      // Send to backend
      const response = await fetch(`api/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify(completeBooking),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();

      setNewBookingData(result.booking);
      onBookingEdited(result.booking);
      setStep('confirmation');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('package');
    setEditedPackageData(editedPackageData);
    setEditedBookingData(editedBookingData);
    onOpenChange(false);
  };

  const convertBookingToBookingData = (booking: Booking): BookingData => {
    return {
      fullName: booking.full_name,
      phone: booking.phone_number,
      eventDate: booking.event_date,
      servingTime: booking.serving_time,
      readyTime: booking.ready_time,
      address: booking.address,
      location: booking.location,
      area: booking.area_id.toString(),
      eventType: booking.event_type_id.toString(),
      allowFilming: booking.is_filming,
      email: booking.email,
      comment: booking.comment || undefined,
      downpaymentUrl: booking.downpayment_screenshot
    }
  }


  const convertBookingToPackageData = (booking: Booking): PackageData => {
    return {
      packageType: {
        id: booking.booking_package![0].package_id,
        name: booking.booking_package![0].packages.name as PackageType
      },
      guests: booking.booking_package![0].num_guests || undefined,
      classicPizzas: booking.booking_package![0].num_classic_pizzas || undefined,
      signaturePizzas: booking.booking_package![0].num_signature_pizzas || undefined,
      subtotal: booking.booking_package![0].sub_total
    }
  }


  useEffect(() => {
    console.log("🚀 ~ EditBookingDialog ~ bookingData:", bookingData)
    const frontendPackageData = convertBookingToPackageData(bookingData)
    console.log("🚀 ~ EditBookingDialog ~ frontendPackageData:", frontendPackageData)
    const frontendBookingData = convertBookingToBookingData(bookingData)
    console.log("🚀 ~ EditBookingDialog ~ frontendBookingData:", frontendBookingData)
    setEditedPackageData(frontendPackageData)
    setEditedBookingData(frontendBookingData)
  }, [bookingData])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {step === 'package' && 'Select Package'}
            {step === 'details' && 'Booking Details'}
            {step === 'confirmation' && 'Booking Updated'}
          </DialogTitle>
        </DialogHeader>

        {step === 'package' && (
          <PackageSelectionStep packageData={editedPackageData} onSubmit={handlePackageSubmit} />
        )}

        {step === 'details' && editedPackageData && (
          <BookingDetailsStep
            packageData={editedPackageData}
            bookingData={editedBookingData}
            onSubmit={handleDetailsSubmit}
            onBack={(packageData: PackageData) => {
              console.log("🚀 ~ EditBookingDialog ~ packageData:", packageData)
              setStep('package')
              setEditedPackageData(packageData)
            }}
            submitting={submitting}
          />
        )}

        {step === 'confirmation' && editedPackageData && editedBookingData && newBookingData && (
          <BookingUpdatedConfirmation
            newBookingData={newBookingData}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
