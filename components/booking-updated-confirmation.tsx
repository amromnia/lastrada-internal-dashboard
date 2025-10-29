import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Booking } from '@/types/booking';
import { formatMoney } from '@/lib/utils';

interface BookingUpdatedConfirmationProps {
  newBookingData: Booking;
  onClose: () => void;
}

export function BookingUpdatedConfirmation({ newBookingData, onClose }: BookingUpdatedConfirmationProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div className="text-center">
          <h3>Booking Updated Successfully!</h3>
        </div>
      </div>

      <div className="rounded-lg border bg-gray-50 p-6 space-y-4">
        <h4>Booking Summary</h4>

        <div className="grid grid-cols-2 gap-4 min-w-full break-all text-sm">
          <div>
            <div className="text-gray-500">Name</div>
            <div>{newBookingData.full_name}</div>
          </div>

          <div>
            <div className="text-gray-500">Email</div>
            <div>{newBookingData.email}</div>
          </div>

          <div>
            <div className="text-gray-500">Phone</div>
            <div>{newBookingData.phone_number}</div>
          </div>

          <div>
            <div className="text-gray-500">Event Date</div>
            <div>{newBookingData.event_date}</div>
          </div>

          <div>
            <div className="text-gray-500">Event Type</div>
            <div>{newBookingData.event_types?.event_en}</div>
          </div>
          <div>
            <div className="text-gray-500">Area</div>
            <div>{newBookingData.areas?.area_en}</div>
          </div>

          <div>
            <div className="text-gray-500">Package</div>
            <div>
              {newBookingData.booking_package?.[0].packages.name}
            </div>
          </div>

          {newBookingData.booking_package?.[0].num_guests && (
            <div>
              <div className="text-gray-500">Guests</div>
              <div>{newBookingData.booking_package?.[0].num_guests}</div>
            </div>
          )}

          {(newBookingData.booking_package?.[0].num_classic_pizzas || newBookingData.booking_package?.[0].num_signature_pizzas) && (
            <div className="col-span-2">
              <div className="text-gray-500">Pizzas</div>
              <div>
                {newBookingData.booking_package?.[0].num_classic_pizzas ? `${newBookingData.booking_package?.[0].num_classic_pizzas} Classic` : ''}
                {newBookingData.booking_package?.[0].num_classic_pizzas && newBookingData.booking_package?.[0].num_signature_pizzas ? ', ' : ''}
                {newBookingData.booking_package?.[0].num_signature_pizzas ? `${newBookingData.booking_package?.[0].num_signature_pizzas} Signature` : ''}
              </div>
            </div>
          )}

          <div>
            <div className="text-gray-500">Serving Time</div>
            <div>{newBookingData.serving_time}</div>
          </div>

          <div>
            <div className="text-gray-500">Ready Time</div>
            <div>{newBookingData.ready_time}</div>
          </div>

          <div className="col-span-2">
            <div className="text-gray-500">Address</div>
            <div>{newBookingData.address}</div>
          </div>

          <div className="col-span-2">
            <div className="text-gray-500">Location</div>
            <div>{newBookingData.location}</div>
          </div>

          <div>
            <div className="text-gray-500">Filming Allowed</div>
            <div>{newBookingData.is_filming ? 'Yes' : 'No'}</div>
          </div>

          {newBookingData.comment && (
            <div className="col-span-2">
              <div className="text-gray-500">Comment</div>
              <div>{newBookingData.comment}</div>
            </div>
          )}

        </div>
        <div className="rounded-lg bg-gray-100 p-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm md:text-base">Subtotal:</span>
            <span className="md:text-base text-sm text-semibold">{formatMoney(newBookingData.booking_package?.[0].sub_total!)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}
