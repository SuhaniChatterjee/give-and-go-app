-- Create storage bucket for donation images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-images',
  'donation-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- RLS policies for donation images bucket
CREATE POLICY "Users can upload their donation images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'donation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own donation images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'donation-images' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'ngo')
    )
  )
);

CREATE POLICY "Volunteers can view assigned donation images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'donation-images' AND
  EXISTS (
    SELECT 1 FROM donations d
    WHERE d.assigned_volunteer_id = auth.uid()
    AND (storage.foldername(name))[1] = d.donor_id::text
  )
);

CREATE POLICY "Users can delete their own donation images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'donation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for donations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- Enable realtime for pickup_events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_events;