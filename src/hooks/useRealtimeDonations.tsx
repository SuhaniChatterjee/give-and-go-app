import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useRealtimeDonations(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations'
        },
        (payload) => {
          console.log('Donation update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Donation",
              description: "A new donation has been scheduled",
            });
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            toast({
              title: "Status Updated",
              description: `Donation status changed to ${newStatus}`,
            });
          }
          
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}

export function useRealtimePickupEvents(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('pickup-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_events'
        },
        (payload) => {
          console.log('Pickup event update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Pickup Update",
              description: "New pickup event recorded",
            });
          }
          
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}