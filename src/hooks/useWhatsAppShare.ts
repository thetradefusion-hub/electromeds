import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrescriptionShareData {
  prescriptionId: string;
  patientMobile: string;
  patientName: string;
  prescriptionNo: string;
  doctorName: string;
  clinicName: string;
  symptoms: { name: string }[];
  medicines: { name: string; dosage: string; duration: string }[];
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
}

export function useWhatsAppShare() {
  const [sending, setSending] = useState(false);

  const shareViaWhatsApp = async (data: PrescriptionShareData): Promise<boolean> => {
    setSending(true);
    
    try {
      console.log('Sending prescription via WhatsApp:', data.prescriptionNo);
      
      const { data: response, error } = await supabase.functions.invoke(
        'send-whatsapp-prescription',
        {
          body: data,
        }
      );

      if (error) {
        console.error('WhatsApp share error:', error);
        toast.error('Failed to send via WhatsApp: ' + error.message);
        return false;
      }

      if (response?.success) {
        toast.success('Prescription sent via WhatsApp!');
        return true;
      } else {
        toast.error(response?.details || 'Failed to send via WhatsApp');
        return false;
      }
    } catch (error) {
      console.error('WhatsApp share exception:', error);
      toast.error('Error sending via WhatsApp');
      return false;
    } finally {
      setSending(false);
    }
  };

  // Alternative: Open WhatsApp Web/App directly (works without API)
  const shareViaWhatsAppDirect = (data: PrescriptionShareData): void => {
    const symptomsText = data.symptoms.map((s) => `• ${s.name}`).join('\n');
    const medicinesText = data.medicines
      .map((m) => `💊 *${m.name}*\n   Dosage: ${m.dosage}\n   Duration: ${m.duration}`)
      .join('\n\n');

    let message = `🏥 *${data.clinicName || 'Medical Clinic'}*
━━━━━━━━━━━━━━━━
📋 *Prescription No:* ${data.prescriptionNo}
👨‍⚕️ *Doctor:* ${data.doctorName}
👤 *Patient:* ${data.patientName}

📍 *SYMPTOMS:*
${symptomsText}
`;

    if (data.diagnosis) {
      message += `\n🔍 *DIAGNOSIS:*\n${data.diagnosis}\n`;
    }

    message += `\n💊 *MEDICINES:*
${medicinesText}
`;

    if (data.advice) {
      message += `\n📝 *ADVICE:*\n${data.advice}\n`;
    }

    if (data.followUpDate) {
      message += `\n📅 *Follow-up Date:* ${data.followUpDate}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━
🙏 Get well soon!`;

    // Format phone number
    let phone = data.patientMobile.replace(/\D/g, '');
    if (!phone.startsWith('91')) {
      phone = '91' + phone;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  return {
    sending,
    shareViaWhatsApp,
    shareViaWhatsAppDirect,
  };
}
