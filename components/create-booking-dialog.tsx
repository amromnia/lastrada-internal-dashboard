import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PackageSelectionStep } from './package-selection-step';
import { BookingDetailsStep } from './booking-details-step';
import { BookingConfirmation } from './booking-confirmation';
import { Booking } from '@/types/booking';
import { PackageData } from '@/types/packageData';
import { BookingData } from '@/types/bookingData';

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: (booking: any) => void;
}

export function CreateBookingDialog({ open, onOpenChange, onBookingCreated }: CreateBookingDialogProps) {
  const [step, setStep] = useState<'package' | 'details' | 'confirmation'>('package');
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [newBookingData, setNewBookingData] = useState<Booking>();
  const [submitting, setSubmitting] = useState(false);

  const handlePackageSubmit = (data: PackageData) => {
    setPackageData(data);
    setStep('details');
  };

  const handleDetailsSubmit = async (data: BookingData) => {
    try {
      setSubmitting(true);
      setBookingData(data);

      // Create the complete booking
      const completeBooking = {
        ...packageData,
        ...data,
        date: data.eventDate,
        name: data.fullName,
        package: packageData?.packageType.id,
        filming: data.allowFilming ? 'Yes' : 'No',
        subtotal: packageData?.subtotal || 0,
      };
      console.log("🚀 ~ handleDetailsSubmit ~ completeBooking:", completeBooking)

      // Send to backend
      const response = await fetch(`api/bookings`, {
        method: 'POST',
        body: JSON.stringify(completeBooking),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();

      setNewBookingData(result.booking);
      onBookingCreated(result.booking);
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
    setPackageData(null);
    setBookingData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {step === 'package' && 'Select Package'}
            {step === 'details' && 'Booking Details'}
            {step === 'confirmation' && 'Booking Confirmed'}
          </DialogTitle>
        </DialogHeader>

        {step === 'package' && (
          <PackageSelectionStep packageData={packageData} onSubmit={handlePackageSubmit} />
        )}

        {step === 'details' && packageData && (
          <BookingDetailsStep
            packageData={packageData}
            onSubmit={handleDetailsSubmit}
            onBack={(packageData: PackageData) => {
              console.log("🚀 ~ CreateBookingDialog ~ packageData:", packageData)
              setStep('package')
              setPackageData(packageData)
            }}
            submitting={submitting}
          />
        )}

        {step === 'confirmation' && packageData && bookingData && newBookingData && (
          <BookingConfirmation
            newBookingData={newBookingData}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
