-- =============================================
-- SECURITY FIX: Restrict donations visibility to prevent address exposure
-- =============================================

-- Drop the overly permissive volunteer policy
DROP POLICY IF EXISTS "Volunteers can view assigned donations" ON public.donations;

-- Create a more restrictive policy for volunteers:
-- 1. Volunteers can see donations assigned to them (full details)
-- 2. Volunteers can see ONLY non-sensitive fields of pending donations (for accepting)
CREATE POLICY "Volunteers can view their assigned donations"
ON public.donations
FOR SELECT
USING (
  -- Can see full details of donations assigned to them
  auth.uid() = assigned_volunteer_id
);

-- Create a separate RPC function for volunteers to browse available donations
-- This returns limited data without exposing full addresses
CREATE OR REPLACE FUNCTION public.get_available_donations()
RETURNS TABLE (
  id uuid,
  item_category text,
  item_description text,
  item_quantity integer,
  preferred_date date,
  preferred_time_slot text,
  status text,
  -- Return only city/area, not full address (truncate after first comma)
  pickup_area text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a volunteer
  IF NOT public.has_role(auth.uid(), 'volunteer'::app_role) THEN
    RAISE EXCEPTION 'Only volunteers can view available donations';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.item_category,
    d.item_description,
    d.item_quantity,
    d.preferred_date,
    d.preferred_time_slot,
    d.status,
    -- Mask the full address - show only general area
    CASE 
      WHEN position(',' in d.pickup_address) > 0 
      THEN substring(d.pickup_address from position(',' in d.pickup_address) + 2)
      ELSE 'Area available after acceptance'
    END as pickup_area,
    d.created_at
  FROM donations d
  WHERE d.status = 'pending'
    AND d.assigned_volunteer_id IS NULL
  ORDER BY d.created_at DESC;
END;
$$;