import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrescriptionData {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("Missing WhatsApp API credentials");
      return new Response(
        JSON.stringify({ error: "WhatsApp API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: PrescriptionData = await req.json();
    console.log("Received prescription data for WhatsApp:", data.prescriptionNo);

    // Format mobile number (add country code if not present)
    let mobileNumber = data.patientMobile.replace(/\D/g, ""); // Remove non-digits
    if (!mobileNumber.startsWith("91")) {
      mobileNumber = "91" + mobileNumber; // Add India country code
    }

    // Build prescription message
    const symptomsText = data.symptoms.map((s) => `• ${s.name}`).join("\n");
    const medicinesText = data.medicines
      .map((m) => `💊 *${m.name}*\n   Dosage: ${m.dosage}\n   Duration: ${m.duration}`)
      .join("\n\n");

    let messageBody = `🏥 *${data.clinicName || "Medical Clinic"}*
━━━━━━━━━━━━━━━━
📋 *Prescription No:* ${data.prescriptionNo}
👨‍⚕️ *Doctor:* ${data.doctorName}
👤 *Patient:* ${data.patientName}

📍 *SYMPTOMS:*
${symptomsText}
`;

    if (data.diagnosis) {
      messageBody += `\n🔍 *DIAGNOSIS:*\n${data.diagnosis}\n`;
    }

    messageBody += `\n💊 *MEDICINES:*
${medicinesText}
`;

    if (data.advice) {
      messageBody += `\n📝 *ADVICE:*\n${data.advice}\n`;
    }

    if (data.followUpDate) {
      messageBody += `\n📅 *Follow-up Date:* ${data.followUpDate}\n`;
    }

    messageBody += `\n━━━━━━━━━━━━━━━━
🙏 Get well soon!
_This is an auto-generated prescription._`;

    console.log("Sending WhatsApp message to:", mobileNumber);

    // Send message via WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: mobileNumber,
          type: "text",
          text: {
            preview_url: false,
            body: messageBody,
          },
        }),
      }
    );

    const responseData = await whatsappResponse.json();
    console.log("WhatsApp API response:", JSON.stringify(responseData));

    if (!whatsappResponse.ok) {
      console.error("WhatsApp API error:", responseData);
      return new Response(
        JSON.stringify({
          error: "Failed to send WhatsApp message",
          details: responseData.error?.message || "Unknown error",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.messages?.[0]?.id,
        message: "Prescription sent successfully via WhatsApp",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-whatsapp-prescription:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
