-- Add send_email column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS send_email boolean NOT NULL DEFAULT false;

-- Update existing users to receive emails (optional - set to true for admin users)
-- UPDATE public.users SET send_email = true WHERE email = 'admin@example.com';

COMMENT ON COLUMN public.users.send_email IS 'Whether this user should receive email notifications for new bookings';
