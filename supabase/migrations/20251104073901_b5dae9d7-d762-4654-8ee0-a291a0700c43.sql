-- Fix infinite recursion in profiles RLS policies
-- Drop ALL existing policies with CASCADE
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles CASCADE;

-- Create corrected policies without recursion
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for users based on id"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for users based on id"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);