export interface Booking {
  id: number | string  // Can be bigint from DB or string in responses
  event_date: string
  serving_time: string
  ready_time: string
  is_confirmed: boolean | null
  status?: string  // pending, confirmed, denied
  full_name: string
  email: string
  phone_number: string
  is_filming: boolean
  address: string
  location: string
  comment: string | null
  downpayment_screenshot: string
  area_id: number
  event_type_id: number
  area?: string | null
  event_type?: string | null
  reference_number: string
  created_at: string
  // Related data
  areas?: {
    area_en: string
    area_ar: string | null
  }
  event_types?: {
    event_en: string
    event_ar: string | null
  }
  booking_package?: Array<{
    id: number
    num_guests: number | null
    num_classic_pizzas: number | null
    num_signature_pizzas: number | null
    sub_total: number
    packages: {
      name: string
    }
  }>
}
