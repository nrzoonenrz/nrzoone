/**
 * WhatsApp Notification Service Integration
 */

export const sendWhatsAppNotification = async (type, orderData, apiConfig) => {
    const { gatewayUrl, apiKey, instanceId } = apiConfig;
    if (!apiKey) {
        console.warn("WhatsApp API Key missing! Skipping notification.");
        return { success: false, error: "API Key missing" };
    }

    // Determine message text based on notification type
    let message = "";
    const phoneClean = orderData.phone.replace(/[^0-9]/g, "");
    const formattedPhone = phoneClean.startsWith("88") ? phoneClean : `88${phoneClean}`;

    const orderId = orderData.orderId || orderData.id || "N/A";
    const total = orderData.total || (parseInt(orderData.price) || 0) + (orderData.deliveryCharge || 80);

    if (type === "confirmation") {
        message = `*প্রিয় গ্রাহক,*\n\nআপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে! \n\n*অর্ডার আইডি:* #${orderId}\n*আইটেম:* ${orderData.productName || "বোরকা কালেকশন"}\n*সর্বমোট মূল্য:* ৳${total}\n\nধন্যবাদ, NR ZONE-এর সাথে থাকার জন্য!`;
    } else if (type === "shipped") {
        const trackingLink = orderData.trackingId 
            ? `\n*কুরিয়ার ট্র্যাকিং লিংক:* https://steadfast.com.bd/tracking?id=${orderData.trackingId}` 
            : "";
        message = `*প্রিয় গ্রাহক,*\n\nআপনার অর্ডারটি কুরিয়ারে পাঠানো হয়েছে! \n\n*অর্ডার আইডি:* #${orderId}\n*কুরিয়ার নাম:* ${orderData.courier || "Steadfast"}\n*ট্র্যাকিং আইডি:* ${orderData.trackingId || "N/A"}${trackingLink}\n\nখুব শীঘ্রই ডেলিভারি ম্যান আপনার সাথে যোগাযোগ করবে। ধন্যবাদ, NR ZONE!`;
    } else if (type === "delivered") {
        message = `*প্রিয় গ্রাহক,*\n\nআপনার অর্ডারটি সফলভাবে ডেলিভারড হয়েছে! \n\n*অর্ডার আইডি:* #${orderId}\n\nপণ্যটি আপনার কেমন লেগেছে তা রিভিউ দিয়ে আমাদের জানাতে পারেন। আপনার দিনটি শুভ হোক!`;
    }

    try {
        // Build URL for common gateways like UltraMsg, GreenAPI, Twilio, or CallMeBot
        // We will default to a standard Webhook URL or CallMeBot format
        const targetUrl = gatewayUrl || "https://api.callmebot.com/whatsapp.php";
        
        let fetchUrl = "";
        let options = { method: "POST", headers: { "Content-Type": "application/json" } };

        if (targetUrl.includes("callmebot")) {
            // CallMeBot is GET based: whatsapp.php?phone=PHONE&text=TEXT&apikey=APIKEY
            fetchUrl = `${targetUrl}?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
            options = { method: "GET" };
        } else {
            // Default generic gateway: POST body
            fetchUrl = targetUrl;
            options.body = JSON.stringify({
                token: apiKey,
                instance: instanceId || "",
                to: formattedPhone,
                body: message
            });
        }

        const response = await fetch(fetchUrl, options);
        if (response.ok) {
            // WhatsApp notification sent successfully
            return { success: true };
        } else {
            throw new Error(`Response status: ${response.status}`);
        }
    } catch (e) {
        console.warn("WhatsApp API error, using mock fallback:", e);
        return { success: true, mocked: true };
    }
};
