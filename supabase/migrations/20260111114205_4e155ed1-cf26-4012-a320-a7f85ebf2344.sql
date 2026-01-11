-- =============================================
-- SECURITY FIX: Fix storage policy and remove role column
-- =============================================

-- 1. Drop the storage policy that depends on profiles.role
DROP POLICY IF EXISTS "Users can view their own donation images" ON storage.objects;

-- 2. Recreate the storage policy using has_role() instead of profiles.role
CREATE POLICY "Users can view their own donation images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'donation-images' 
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ngo'::app_role)
  )
);

-- 3. Drop the vulnerable role column from profiles table
ALTER TABLE public.profiles DROP COLUMN role;

-- 4. Fix the overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- 5. Create owner-only read policy for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 6. Create admin/NGO read policy for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'ngo'::app_role));

-- 7. Create policy for volunteers to view assigned donor profiles
CREATE POLICY "Volunteers can view assigned donor profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.donations d 
    WHERE d.assigned_volunteer_id = auth.uid() 
    AND d.donor_id = profiles.id
  )
);

-- 8. Create policy for donors to view assigned volunteer profiles  
CREATE POLICY "Donors can view assigned volunteer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.donations d 
    WHERE d.donor_id = auth.uid() 
    AND d.assigned_volunteer_id = profiles.id
  )
);

-- =============================================
-- SECURITY FIX: Add role validation to accept_donation RPC
-- =============================================

-- 9. Replace accept_donation function with role validation
CREATE OR REPLACE FUNCTION public.accept_donation(donation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_donation json;
BEGIN
  -- Verify caller is a volunteer
  IF NOT public.has_role(auth.uid(), 'volunteer'::app_role) THEN
    RAISE EXCEPTION 'Only volunteers can accept donations';
  END IF;
  
  -- Verify not accepting own donation
  IF EXISTS (
    SELECT 1 FROM donations 
    WHERE id = donation_id AND donor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Cannot accept your own donation';
  END IF;

  -- Atomically update the donation if it's pending and unassigned
  UPDATE donations
  SET 
    assigned_volunteer_id = auth.uid(),
    status = 'accepted',
    updated_at = now()
  WHERE 
    id = donation_id
    AND status = 'pending'
    AND assigned_volunteer_id IS NULL
  RETURNING json_build_object(
    'id', id,
    'status', status,
    'assigned_volunteer_id', assigned_volunteer_id,
    'donor_id', donor_id,
    'pickup_address', pickup_address,
    'preferred_date', preferred_date,
    'preferred_time_slot', preferred_time_slot,
    'item_category', item_category,
    'item_description', item_description,
    'item_quantity', item_quantity,
    'geo_lat', geo_lat,
    'geo_lng', geo_lng,
    'notes', notes,
    'images', images
  ) INTO updated_donation;

  -- Return null if no rows were updated
  IF updated_donation IS NULL THEN
    RAISE EXCEPTION 'Donation is no longer available';
  END IF;

  RETURN updated_donation;
END;
$$;