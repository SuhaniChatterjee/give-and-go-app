-- Create database webhook for donation updates
CREATE OR REPLACE FUNCTION notify_donation_status_change()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  -- Only trigger on status changes
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    payload := json_build_object(
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'type', TG_OP
    );
    
    -- Note: Actual webhook call would be configured in Supabase dashboard
    -- This function prepares the payload structure
    RAISE NOTICE 'Donation status changed: %', payload;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for donation updates
DROP TRIGGER IF EXISTS on_donation_status_change ON donations;
CREATE TRIGGER on_donation_status_change
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION notify_donation_status_change();