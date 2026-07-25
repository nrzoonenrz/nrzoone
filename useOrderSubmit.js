import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL, WHATSAPP_API_KEY, WHATSAPP_API_URL, WHATSAPP_PHONE } from '../config';

export const useOrderSubmit = ({ onSuccess, onError } = {}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const submitOrder = async (orderData) => {
        let cleanPhone = orderData.phone?.replace(/\D/g, '') || '';
        if (cleanPhone.startsWith('88') && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.substring(2);
        }
        orderData.phone = cleanPhone;

        if (cleanPhone.length !== 11) {
            alert('আপনার মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে!');
            return;
        }

        const finalOrderData = {
            ...orderData,
            status: 'pending',
            date: new Date().toLocaleDateString('en-GB'),
            createdAt: serverTimestamp()
        };

        try {
            setIsSubmitting(true);

            // Optimistic UI updates
            setOrderSuccess(true);
            if (onSuccess) onSuccess();

            // 1. Firebase Sync
            if (db) {
                try {
                    await addDoc(collection(db, 'orders'), finalOrderData);
                } catch (e) {
                    console.warn("Firestore sync warning:", e);
                }
            }

            // (Google Sheet Sync Removed)

            // 3. SMS Notification (If configured and not dummy)
            if (SMS_API_KEY && SMS_API_KEY !== 'VoYeTuiZ7OH6ZW1rLFZf' && SMS_API_KEY !== 'PASTE_YOUR_API_KEY_HERE') {
                const formattedNumber = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;
                const smsMessage = `Thanks for your order from NR ZONE! Your total is Tk ${finalOrderData.total}. We'll call you soon to confirm.`;
                try {
                    fetch(`${SMS_API_URL}?api_key=${encodeURIComponent(SMS_API_KEY)}&type=text&number=${encodeURIComponent(formattedNumber)}&senderid=${encodeURIComponent(SMS_SENDER_ID || '')}&message=${encodeURIComponent(smsMessage)}`, { mode: 'no-cors' });
                } catch (e) {
                    console.warn("SMS error:", e);
                }
            }

            // 4. WhatsApp Notification (Admin)
            if (WHATSAPP_API_KEY && WHATSAPP_API_KEY !== 'XXXXXX' && WHATSAPP_API_KEY !== 'PASTE_YOUR_API_KEY_HERE') {
                const waMessage = `*New Order (${finalOrderData.landingPage})*\n*Name:* ${finalOrderData.name}\n*Phone:* ${finalOrderData.phone}\n*Product:* ${finalOrderData.productType}\n*Total:* ${finalOrderData.total} TK`;
                const waUrl = `${WHATSAPP_API_URL}?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(waMessage)}&apikey=${WHATSAPP_API_KEY}`;
                try {
                    fetch(waUrl, { mode: 'no-cors' });
                } catch (e) {
                    console.warn("WhatsApp error:", e);
                }
            }

            setIsSubmitting(false);

        } catch (error) {
            console.error('Order submission error:', error);
            setIsSubmitting(false);
            if (onError) onError(error);
        }
    };

    return {
        submitOrder,
        isSubmitting,
        orderSuccess,
        setOrderSuccess
    };
};
