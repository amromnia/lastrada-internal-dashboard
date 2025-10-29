import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { PackageData, BookingData } from './create-booking-dialog';

interface BookingDetailsStepProps {
  packageData: PackageData;
  onSubmit: (data: BookingData) => void;
  onBack: (packageData: PackageData) => void;
  submitting?: boolean;
}

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

export function BookingDetailsStep({ packageData, onSubmit, onBack, submitting = false }: BookingDetailsStepProps) {
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [allowFilming, setAllowFilming] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [areas, setAreas] = useState<{ id: number; name: string }[]>([]);
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingData>();

  // Fetch areas and event types on mount
  useEffect(() => {
    fetchAreas();
    fetchEventTypes();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await fetch(`api/areas`);

      if (response.ok) {
        const data = await response.json();
        setAreas(data.areas || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await fetch(`api/event-types`);

      if (response.ok) {
        const data = await response.json();
        setEventTypes(data.eventTypes || []);
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const uploadDownpayment = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`api/upload-payment`, {
        method: 'POST',
        body: formData,
      });
      console.log("🚀 ~ uploadDownpayment ~ response:", response)

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading downpayment:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onFormSubmit = async (data: BookingData) => {
    if (!selectedArea || !selectedEventType) {
      alert('Please select area and event type');
      return;
    }

    if (!allowFilming) {
      alert('Please select allow filming option');
      return;
    }

    let downpaymentUrl = null;
    if (imageFile) {
      downpaymentUrl = await uploadDownpayment(imageFile);
      if (!downpaymentUrl) {
        alert('Failed to upload downpayment screenshot. Please try again.');
        return;
      }
    }

    onSubmit({
      ...data,
      area: selectedArea,
      eventType: selectedEventType,
      allowFilming,
      downpaymentUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 min-w-full">
      <div className="grid grid-cols-2 gap-4 ">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...register('fullName', { required: 'Full name is required' })}
            className="mt-2 text-sm"
          />
          {errors.fullName && (
            <p className="mt-1 text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone', { required: 'Phone number is required' })}
            className="mt-2 text-sm"
          />
          {errors.phone && (
            <p className="mt-1 text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="mt-2 text-sm"
        />
        {errors.email && (
          <p className="mt-1 text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="eventDate">Event Date *</Label>
        <Input
          id="eventDate"
          type="date"
          min={tomorrow?.toISOString().split("T")[0] || new Date()?.toISOString().split("T")[0]}
          {...register('eventDate', { required: 'Event date is required' })}
          className="mt-2 text-sm"
        />
        {errors.eventDate && (
          <p className="mt-1 text-red-600">{errors.eventDate.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 ">
        <div>
          <Label htmlFor="readyTime">Ready Time *</Label>
          <Input
            id="readyTime"
            type="time"
            step="1"
            {...register('readyTime', { required: 'Ready time is required' })}
            className="mt-2 text-sm"
          />
          {errors.readyTime && (
            <p className="mt-1 text-red-600">{errors.readyTime.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="servingTime">Serving Time *</Label>
          <Input
            id="servingTime"
            type="time"
            step="1"
            {...register('servingTime', { required: 'Serving time is required' })}
            className="mt-2 text-sm"
          />
          {errors.servingTime && (
            <p className="mt-1 text-red-600">{errors.servingTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          {...register('address', { required: 'Address is required' })}
          className="mt-2 text-sm"
        />
        {errors.address && (
          <p className="mt-1 text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          {...register('location', { required: 'Location is required' })}
          className="mt-2 text-sm"
        />
        {errors.location && (
          <p className="mt-1 text-red-600">{errors.location.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 ">
        <div>
          <Label>Area *</Label>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {areas.map(area => (
                <SelectItem key={area.id} value={area.id?.toString()}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.area && (
            <p className="mt-1 text-red-600">{errors.area.message}</p>
          )}
        </div>

        <div>
          <Label>Event Type *</Label>
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(type => (
                <SelectItem key={type.id} value={type.id?.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.eventType && (
            <p className="mt-1 text-red-600">{errors.eventType.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 max-w-ful">
        <Checkbox
          id="filming"
          checked={allowFilming}
          onCheckedChange={(checked) => setAllowFilming(checked as boolean)}
        />
        <Label htmlFor="filming" className="cursor-pointer">
          Allow filming during the event
        </Label>
      </div>

      <div>
        <Label htmlFor="comment">Comment (Optional)</Label>
        <Textarea
          id="comment"
          {...register('comment')}
          className="mt-2 text-sm"
          rows={3}
          placeholder="Any special requests or notes..."
        />
      </div>

      <div>
        <Label htmlFor="downpayment">Downpayment Screenshot (Optional)</Label>
        <Input
          id="downpayment"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="mt-2 "
        />
        {imageFile && (
          <p className="mt-1 text-gray-600 break-all">Selected: {imageFile.name}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => onBack(packageData)} disabled={uploading || submitting}>
          Back
        </Button>
        <Button type="submit" disabled={uploading || submitting}>
          {uploading ? 'Uploading...' : submitting ? 'Creating Booking...' : 'Submit Booking'}
        </Button>
      </div>
    </form>
  );
}
