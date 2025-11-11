-- Create RPC function for atomic donation acceptance
CREATE OR REPLACE FUNCTION public.accept_donation(donation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_donation json;
BEGIN
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

  -- Return null if no rows were updated (already assigned or not pending)
  IF updated_donation IS NULL THEN
    RAISE EXCEPTION 'Donation is no longer available';
  END IF;

  RETURN updated_donation;
END;
$$;