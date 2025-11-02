import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SendSMSParams {
  to: string;
  message: string;
}

export const useSendSMS = () => {
  const sendSMS = async ({ to, message }: SendSMSParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, message }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('SMS error:', error);
      toast({
        title: "SMS Error",
        description: error.message || "Failed to send SMS notification",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return { sendSMS };
};