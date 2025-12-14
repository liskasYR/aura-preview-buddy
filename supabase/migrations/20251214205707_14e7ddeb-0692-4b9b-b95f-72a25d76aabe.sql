-- Add handle/nickname column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle text UNIQUE;

-- Add index for handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- Add admin role for liskcells@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('d563504b-34fb-4533-9c35-b038d8d7aefa', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;