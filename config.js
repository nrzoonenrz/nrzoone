export const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;
export const GOOGLE_SHEET_VIEW_URL = import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL;

// BulkSMSBD API Configuration (বাংলাদেশি জনপ্রিয় গেটওয়ে)
// এখানে আপনার BulkSMSBD এর এপিআই কী এবং সেন্ডার আইডি দিন।
export const SMS_API_KEY = import.meta.env.VITE_SMS_API_KEY; 
export const SMS_SENDER_ID = import.meta.env.VITE_SMS_SENDER_ID; 
export const SMS_API_URL = import.meta.env.VITE_SMS_API_URL;

// WhatsApp Notification (CallMeBot - Free)
// Get your API Key by messaging "+34 644 10 55 23" on WhatsApp with "resend apikey"
export const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE; 
export const WHATSAPP_API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY; 
export const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL;

export const appConfig = {
    deliveryDhaka: 70,
    deliveryOutside: 130,
    whatsappNumber: '01886161109' // Default/Example WhatsApp number
};
