-- Create users table for custom authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
  id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  area_en TEXT NOT NULL UNIQUE,
  area_ar TEXT UNIQUE,
  CONSTRAINT areas_pkey PRIMARY KEY (id)
);

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
  id INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_en TEXT NOT NULL UNIQUE,
  event_ar TEXT UNIQUE,
  CONSTRAINT event_types_pkey PRIMARY KEY (id)
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT packages_pkey PRIMARY KEY (id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  event_date DATE NOT NULL,
  serving_time TIME WITHOUT TIME ZONE NOT NULL,
  ready_time TIME WITHOUT TIME ZONE NOT NULL,
  is_filming BOOLEAN NOT NULL,
  address TEXT NOT NULL,
  location TEXT NOT NULL,
  comment TEXT,
  downpayment_screenshot TEXT NOT NULL UNIQUE,
  area_id INTEGER NOT NULL,
  event_type_id INTEGER NOT NULL,
  area TEXT,
  event_type TEXT,
  reference_number UUID DEFAULT gen_random_uuid() UNIQUE,
  is_confirmed BOOLEAN,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_area_id_fkey FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT bookings_event_type_id_fkey FOREIGN KEY (event_type_id) REFERENCES event_types(id)
);

-- Create booking_package table
CREATE TABLE IF NOT EXISTS booking_package (
  id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  num_guests SMALLINT,
  num_classic_pizzas SMALLINT,
  num_signature_pizzas SMALLINT,
  sub_total NUMERIC NOT NULL,
  package_id BIGINT NOT NULL,
  booking_id BIGINT NOT NULL,
  CONSTRAINT booking_package_pkey PRIMARY KEY (id),
  CONSTRAINT booking_package_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages(id),
  CONSTRAINT booking_package_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_is_confirmed ON bookings(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_bookings_area_id ON bookings(area_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_booking_package_booking_id ON booking_package(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_package_package_id ON booking_package(package_id);

