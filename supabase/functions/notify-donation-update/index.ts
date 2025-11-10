import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Donation update webhook received');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the donation record
    const record = payload.record;
    const oldRecord = payload.old_record;

    // Only send SMS if status changed
    if (!oldRecord || record.status === oldRecord.status) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    // Get donor profile
    const { data: donor } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', record.donor_id)
      .single();

    // Get volunteer profile if assigned
    let volunteer = null;
    if (record.assigned_volunteer_id) {
      const { data: vol } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', record.assigned_volunteer_id)
        .single();
      volunteer = vol;
    }

    // Prepare messages
    const messages: Array<{ to: string; message: string }> = [];

    // Message to donor
    if (donor?.phone) {
      let donorMessage = `DonateConnect: Your ${record.item_category} donation `;
      
      switch (record.status) {
        case 'assigned':
          donorMessage += `has been assigned to a volunteer. They will contact you soon.`;
          break;
        case 'accepted':
          donorMessage += `has been accepted by ${volunteer?.full_name || 'a volunteer'}.`;
          break;
        case 'in_progress':
          donorMessage += `pickup is in progress. The volunteer is on their way!`;
          break;
        case 'completed':
          donorMessage += `has been successfully picked up. Thank you for your generosity!`;
          break;
        case 'cancelled':
          donorMessage += `has been cancelled.`;
          break;
      }

      messages.push({ to: donor.phone, message: donorMessage });
    }

    // Message to volunteer
    if (volunteer?.phone && ['assigned', 'accepted'].includes(record.status)) {
      const volunteerMessage = `DonateConnect: New pickup assigned - ${record.item_category} from ${donor?.full_name || 'a donor'}. Address: ${record.pickup_address}. Date: ${new Date(record.preferred_date).toLocaleDateString()}`;
      messages.push({ to: volunteer.phone, message: volunteerMessage });
    }

    // Send all SMS messages
    const sendPromises = messages.map(async ({ to, message }) => {
      try {
        const response = await supabase.functions.invoke('send-sms', {
          body: { to, message }
        });
        console.log('SMS sent successfully');
        return response;
      } catch (error) {
        console.error('Failed to send SMS:', error);
        return null;
      }
    });

    await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({ success: true, messagesSent: messages.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in notify-donation-update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});