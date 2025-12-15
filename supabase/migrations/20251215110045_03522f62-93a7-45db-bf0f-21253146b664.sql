-- Add verified badge column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Add bio column to profiles for user description
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';

-- Set verified to true for liskcells@gmail.com user
UPDATE public.profiles 
SET verified = true 
WHERE email = 'liskcells@gmail.com';