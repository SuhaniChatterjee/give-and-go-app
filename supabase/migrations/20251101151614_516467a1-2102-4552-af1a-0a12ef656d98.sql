-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('donor', 'volunteer', 'admin', 'ngo');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'donor',
  address TEXT,
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ngo')
  ));

-- Create volunteer details table
CREATE TABLE public.volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  availability JSONB DEFAULT '{}',
  vehicle_capacity INTEGER,
  background_check_date DATE,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_pickups INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers can view their own profile"
  ON public.volunteer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Volunteers can update their own profile"
  ON public.volunteer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all volunteer profiles"
  ON public.volunteer_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ngo')
  ));

-- Create donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_category TEXT NOT NULL,
  item_description TEXT,
  item_quantity INTEGER NOT NULL DEFAULT 1,
  images TEXT[] DEFAULT '{}',
  pickup_address TEXT NOT NULL,
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  preferred_date DATE NOT NULL,
  preferred_time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
  assigned_volunteer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Donations policies
CREATE POLICY "Donors can view their own donations"
  ON public.donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Donors can create donations"
  ON public.donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own donations"
  ON public.donations FOR UPDATE
  USING (auth.uid() = donor_id AND status IN ('pending', 'assigned'));

CREATE POLICY "Volunteers can view assigned donations"
  ON public.donations FOR SELECT
  USING (auth.uid() = assigned_volunteer_id OR status IN ('pending', 'assigned'));

CREATE POLICY "Volunteers can update assigned donations"
  ON public.donations FOR UPDATE
  USING (auth.uid() = assigned_volunteer_id);

CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ngo')
  ));

CREATE POLICY "Admins can update all donations"
  ON public.donations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ngo')
  ));

-- Create pickup events table for status tracking
CREATE TABLE public.pickup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  proof_image TEXT,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pickup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pickup events"
  ON public.pickup_events FOR SELECT
  USING (
    auth.uid() = volunteer_id 
    OR EXISTS (
      SELECT 1 FROM public.donations WHERE id = donation_id AND donor_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can create pickup events"
  ON public.pickup_events FOR INSERT
  WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Admins can view all pickup events"
  ON public.pickup_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ngo')
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'donor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_assigned_volunteer ON public.donations(assigned_volunteer_id);
CREATE INDEX idx_donations_geo ON public.donations(geo_lat, geo_lng);
CREATE INDEX idx_profiles_role ON public.profiles(role);