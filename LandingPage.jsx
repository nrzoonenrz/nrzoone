import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    ShoppingBag,
    Phone,
    MapPin,
    ChevronRight,
    Star,
    CheckCircle2,
    Truck,
    ShieldCheck,
    Headphones,
    ArrowRight,
    Menu,
    X,
    Minus,
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {  GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL, WHATSAPP_PHONE, WHATSAPP_API_KEY, WHATSAPP_API_URL , appConfig } from './config';
import { useCart } from './CartContext';

// Product images are currently using placeholders as requested.

const LandingPage = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState('কালো');

    const heroImages = {
        'কালো': '/hero_black.jpg',
        'নীল': '/hero_blue.jpg',
        'অলিভ': '/hero_olive.jpg',
        'মেরুন': '/hero_maroon.jpg',
        'কফি': '/hero_black.jpg', // Fallback for coffee
        'default': '/hero_black.jpg'
    };

    const currentHeroImage = heroImages[selectedColor] || heroImages['default'];
    const [selectedSize, setSelectedSize] = useState('৫০');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const sizes = ['৫০', '৫২', '৫৪', '৫৬', '৫৮'];

    const orderFormRef = useRef(null);

    const prices = {
        single: 1350,
        with_hijab: 1630
    };

    const originalPrices = {
        single: 1950,
        with_hijab: 2350
    };

    const deliveryCharges = { inside: appConfig.deliveryDhaka, outside: appConfig.deliveryOutside };

    const colors = [
        { name: 'অলিভ', class: 'bg-[#556B2F]' },
        { name: 'মেরুন', class: 'bg-[#4B0000]' },
        { name: 'কালো', class: 'bg-black' },
        { name: 'নীল', class: 'bg-blue-900' }
    ];

    const types = [
        { id: 'with_hijab', label: 'হিজাবসহ পুরো সেট', price: prices.with_hijab },
        { id: 'single', label: 'শুধুমাত্র বোরকা', price: prices.single }
    ];

    const [selectedType, setSelectedType] = useState('single');
    const [quantity, setQuantity] = useState(1);
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        // Meta Pixel Tracking
        if (window.fbq) {
            window.fbq('track', 'ViewContent');
            window.fbq('track', 'InitiateCheckout');
        }
        setSelectedColor('অলিভ');
    }, []);

    const [showOrderModal, setShowOrderModal] = useState(false);

    const scrollToForm = () => {
        setShowOrderModal(true);
    };

    const currentPrice = prices[selectedType] * quantity;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const handleOrderSubmit = async (e) => {
        e.preventDefault();

        let cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('88') && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.substring(2);
        }
        formData.phone = cleanPhone; // Ensure database always gets consistent 11-digit format
        if (cleanPhone.length !== 11) {
            alert('আপনার মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে!');
            return;
        }
        const orderData = {
            ...formData,
            landingPage: 'Haya Series', // Identifier for the sheet
            sourceWebsite: 'NRZOONE.COM',
            productType: selectedType,
            color: selectedColor,
            size: selectedSize,
            quantity,
            price: currentPrice,
            deliveryCharge: deliveryCharges[deliveryArea],
            total: currentTotal,
            status: 'pending',
            date: new Date().toLocaleDateString('en-GB'),
            createdAt: serverTimestamp()
        };

        try {
            window.alert("অর্ডার প্রসেস হচ্ছে, ১ সেকেন্ড অপেক্ষা করুন...");
            setIsSubmitting(true);

            // OPTIMISTIC UPDATE: Show success modal immediately to prevent UI hang
            setOrderSuccess(true);
            setShowOrderModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmitting(false);

            // BACKGROUND SYNC: These will run while the user sees the success modal

            // 1. Submit to Google Sheets (Exclude Firebase-specific objects)
            if (GOOGLE_SHEET_URL) {
                const sheetData = {
                    Date: orderData.date,
                    date: orderData.date,
                    Name: orderData.name,
                    name: orderData.name,
                    Phone: orderData.phone,
                    phone: orderData.phone,
                    Address: orderData.address,
                    address: orderData.address,
                    Product: orderData.productType,
                    product: orderData.productType,
                    Color: orderData.color,
                    color: orderData.color,
                    Size: orderData.size,
                    size: orderData.size,
                    Qty: orderData.quantity,
                    qty: orderData.quantity,
                    Total: orderData.total,
                    total: orderData.total,
                    Status: orderData.status,
                    status: orderData.status,
                    landingPage: orderData.landingPage,
                    sourceWebsite: orderData.sourceWebsite
                };
                const params = new URLSearchParams(sheetData).toString();
                const syncUrl = `${GOOGLE_SHEET_URL}?${params}`;
                
                fetch(syncUrl, { 
                    method: 'GET', 
                    mode: 'no-cors' 
                }).catch(err => console.error("Sheets Sync Error:", err));
            }

            // 2. Submit to Firebase
            try {
                await addDoc(collection(db, "orders"), orderData);
            } catch (err) {
                console.error("Firebase Error:", err);
                alert("অর্ডার সম্পন্ন করতে সমস্যা হচ্ছে। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।");
                return;
            }

            // 3. Facebook Pixel Tracking
            if (window.fbq) {
                try {
                    window.fbq('track', 'Purchase', { currency: 'BDT', value: orderData.total, content_category: 'NRZOONE.COM' });
                } catch (e) { console.error(e); }
            }

            // 4. Automated SMS Notification
            if (SMS_API_KEY && SMS_API_KEY !== 'VoYeTuiZ7OH6ZW1rLFZf' && SMS_API_KEY !== 'PASTE_YOUR_API_KEY_HERE') {
                const formattedNumber = formData.phone.trim().startsWith('88') ? formData.phone.trim() : `88${formData.phone.trim()}`;
                const smsMessage = `প্রিয় ${formData.name}, NRZOONE এ আপনার অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমরা আপনাকে কল করবো। ধন্যবাদ!`;
                fetch(`${SMS_API_URL}?api_key=${encodeURIComponent(SMS_API_KEY)}&type=text&number=${encodeURIComponent(formattedNumber)}&senderid=${encodeURIComponent(SMS_SENDER_ID || '')}&message=${encodeURIComponent(smsMessage)}`, { mode: 'no-cors' })
                    .catch(err => console.error("SMS Error:", err));
            }

            // 5. Automated WhatsApp Notification (Admin)
            if (WHATSAPP_API_KEY && WHATSAPP_API_KEY !== 'XXXXXX') {
                const waMessage = `*নতুন বোরকা অর্ডার*\n\n*নাম:* ${formData.name}\n*ফোন:* ${formData.phone}\n*ঠিকানা:* ${formData.address}\n*কালার:* ${selectedColor}\n*সাইজ:* ${selectedSize}\n*টাইপ:* ${selectedType}\n*টোটাল:* ${currentTotal} টাকা`;
                const waUrl = `${WHATSAPP_API_URL}?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(waMessage)}&apikey=${WHATSAPP_API_KEY}`;
                fetch(waUrl, { mode: 'no-cors' }).catch(err => console.error("WhatsApp Error:", err));
            }

            return; // Success flow handled above

        } catch (error) {
            console.error("Order Submission Error:", error);
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। তবে আমরা আপনার তথ্য পাওয়ার চেষ্টা করছি। অনুগ্রহ করে আমাদের ফোন নম্বরে যোগাযোগ করুন।');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F0EA] font-bengali text-[#3A1212] overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-morphism py-4 px-6 md:px-12 flex justify-between items-center">
                <a href="/" className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-110">
                    <img loading="lazy" src="/nrzoone-logo-new.jpg" alt="NRzone Logo" className="h-[60px] md:h-[85px] lg:h-[105px] object-contain drop-shadow-md" onError={(e)=>{e.target.style.display='none';}} />
                </a>
                <div className="hidden md:flex gap-8 font-medium">
                    <a href="#features" className="hover:text-amber-500 transition-colors">কেন আমরা?</a>
                    <a href="#products" className="hover:text-amber-500 transition-colors">প্রোডাক্ট কালেকশন</a>
                    <a href="/track" className="hover:text-amber-500 transition-colors font-bold text-premium-accent">অর্ডার ট্র্যাকিং</a>
                    <a href="#delivery" className="hover:text-amber-500 transition-colors">ডেলিভারি পলিসি</a>
                </div>
                <button
                    onClick={scrollToForm}
                    className="bg-premium-dark text-white px-6 py-2 rounded-full font-bold hover:bg-premium-gold transition-all duration-300 shadow-sm border border-slate-200"
                >
                    অর্ডার দিন
                </button>
            </nav>

            

            {/* Editorial Split Hero Section */}
            <section className="relative w-full bg-[#F4F0EA] min-h-screen pt-24 pb-12 flex items-center justify-center border-b border-[#3A1212]/20">
                <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    
                    {/* Left Column - Typography */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                        <p className="text-[#3A1212] tracking-[0.3em] uppercase text-sm font-semibold">THE</p>
                        <h1 className="text-6xl md:text-8xl font-serif text-[#3A1212] leading-[0.9] tracking-tighter">
                            PREMIUM <br/>
                            BORKA <br/>
                            <span className="italic">FORMULA</span> &hearts;
                        </h1>
                        
                        <div className="w-full flex items-center justify-center md:justify-start gap-4 py-4">
                            <div className="h-px bg-[#3A1212] flex-1 max-w-[100px]"></div>
                            <span className="text-[#3A1212] text-xl">&diams;</span>
                            <div className="h-px bg-[#3A1212] flex-1 max-w-[100px]"></div>
                        </div>

                        <p className="text-[#3A1212] tracking-[0.2em] uppercase text-xs md:text-sm">
                            MODEST. TIMELESS. TOTALLY YOU.
                        </p>

                        <div className="bg-[#3A1212] text-[#F4F0EA] px-8 py-3 uppercase tracking-widest font-serif text-sm mt-4">
                            HAYA SERIES COMBO
                        </div>

                        <p className="text-[#3A1212]/80 font-serif italic text-lg md:text-xl max-w-sm mt-4">
                            The ultimate modest duo. Sleek, sophisticated & endlessly versatile.
                        </p>

                        {/* 4 Feature Icons */}
                        <div className="grid grid-cols-4 gap-4 w-full max-w-md mt-8 pt-8 border-t border-[#3A1212]/20">
                            <div className="flex flex-col items-center text-center gap-2">
                                <Star className="w-6 h-6 text-[#3A1212]" />
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#3A1212]">Elevated</p>
                                <p className="text-[9px] text-[#3A1212]/70 leading-tight">Instantly polished</p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-[#3A1212]" />
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#3A1212]">Versatile</p>
                                <p className="text-[9px] text-[#3A1212]/70 leading-tight">Style it your way</p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-[#3A1212]" />
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#3A1212]">Timeless</p>
                                <p className="text-[9px] text-[#3A1212]/70 leading-tight">Never goes out of style</p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <ShoppingBag className="w-6 h-6 text-[#3A1212]" />
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#3A1212]">Confident</p>
                                <p className="text-[9px] text-[#3A1212]/70 leading-tight">Feel unstoppable</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Arched Video */}
                    <div className="relative w-full max-w-md mx-auto flex justify-center mt-12 md:mt-0">
                        {/* The Arched Container */}
                        <div className="relative w-full aspect-[2/3] md:aspect-[3/4] rounded-t-full rounded-b-lg overflow-hidden border-8 border-[#F4F0EA] shadow-2xl bg-black">
                            <iframe 
                                src={"https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent("https://www.facebook.com/reel/1506415160808378") + "&show_text=0&t=0&autoplay=1&mute=1"}
                                className="w-[150%] h-[150%] -ml-[25%] -mt-[25%] object-cover scale-110 opacity-90"
                                style={{ pointerEvents: 'none' }}
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
                                allowFullScreen={true}
                            ></iframe>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute top-10 -right-4 md:-right-12 w-28 h-28 bg-[#3A1212] rounded-full flex flex-col items-center justify-center text-[#F4F0EA] text-center p-4 shadow-xl border-4 border-[#F4F0EA] transform rotate-12">
                            <p className="text-[9px] uppercase tracking-widest leading-tight">
                                ONE COMBO.<br/>
                                ENDLESS<br/>
                                POSSIBILITIES.
                            </p>
                            <span className="text-xs mt-1">&hearts;</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section id="features" className="py-20 bg-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-serif text-[#3A1212] mb-16 tracking-wide uppercase dark:text-white">কেন এই বোরকা সেটটি বিশেষ?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Star className="text-amber-500" />, title: "এলিগ্যান্ট ডিজাইন", desc: "হায়া সিরিজের বিশেষ ডিজাইন, যা আপনাকে দেবে এক আভিজাত্যময় লুক।" },
                            { icon: <ShieldCheck className="text-amber-500" />, title: "প্রিমিয়াম ফেব্রিক", desc: "সেরা মানের ফেব্রিক দিয়ে তৈরি, যা অত্যন্ত আরামদায়ক ও টেকসই।" },
                            { icon: <CheckCircle2 className="text-amber-500" />, title: "ফ্রি সাইজ বডি", desc: "৪৬/৪৮ বডি পর্যন্ত যে কেউ অনায়াসেই পরতে পারবেন।" },
                            { icon: <ShoppingBag className="text-amber-500" />, title: "সাশ্রয়ী মূল্য", desc: "১৯৫০ টাকার বোরকা পাচ্ছেন মাত্র ১৩৫০ টাকায়!" },
                            { icon: <Truck className="text-amber-500" />, title: "সারাদেশে ডেলিভারি", desc: "আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা দিচ্ছি।" },
                            { icon: <Headphones className="text-amber-500" />, title: "লিমিটেড স্টক", desc: "স্টক ফুরিয়ে যাওয়ার আগেই আপনার পছন্দের কালারটি বুক করুন।" }
                        ]?.map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-2xl bg-transparent border-t border-b border-[#3A1212]/20 flex flex-col items-center gap-4 group hover:bg-[#3A1212]/5 transition-colors"
                            >
                                <div className="text-[#3A1212] group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{f.title}</h3>
                                <p className="text-gray-600 dark:text-zinc-300">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Grid Section */}
            <section id="products" className="py-20 px-4 md:px-6 bg-[#F4F0EA]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl md:text-6xl font-serif text-[#3A1212] uppercase tracking-wide dark:text-white">আমাদের বিশেষ কালেকশন</h2>
                        <p className="text-gray-500">আপনার পছন্দের কালার ও সাইজটি বেছে নিন</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {colors?.map((color, index) => {
                            const [itemType, setItemType] = useState('single');
                            const [itemSize, setItemSize] = useState('৫০');
                            const [itemQty, setItemQty] = useState(1);

                            const totalPrice = prices[itemType] * itemQty;

                            const badges = ["জনপ্রিয়", "সেরাসেলার", "২৭% ছাড়", "নতুন"];

                            return (
                                <motion.div
                                    key={color.name}
                                    whileHover={{ y: -5 }}
                                    className="bg-transparent flex flex-col transition-all duration-300 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                >
                                    {/* Product Image Area */}
                                    <div className="relative aspect-[4/5] overflow-hidden group bg-transparent flex items-center justify-center rounded-t-[10rem] border border-[#3A1212]/10 shadow-lg dark:bg-[#09090B]">
                                        {heroImages[color.name] ? (
                                            <img loading="lazy"
                                                src={heroImages[color.name]}
                                                alt={color.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 contrast-[1.02] brightness-[1.02] saturate-[1.05]"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${color.class}`}>
                                                <ShoppingBag size={48} className="text-white/10" />
                                                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Image Coming Soon</p>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <span className="bg-[#FF4D6D] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-slate-200">
                                                {badges[index]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 space-y-5 flex-1 flex flex-col">
                                        <div>
                                            <h3 className="text-2xl font-serif text-[#3A1212] uppercase tracking-widest dark:text-white">{color.name} বোরকা</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[#111827] dark:text-white text-xl font-bold text-[#FF4D6D]">{prices[itemType]} ৳</span>
                                                <span className="text-sm text-gray-400 line-through">{originalPrices[itemType]} ৳</span>
                                            </div>
                                        </div>

                                        {/* Type Selection */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-serif text-[#3A1212]/70 uppercase tracking-widest">ধরণ সিলেক্ট করুন:</p>
                                            <select
                                                value={itemType}
                                                onChange={(e) => setItemType(e.target.value)}
                                                className="w-full p-3 border-0 border-b border-[#3A1212] rounded-none text-sm bg-transparent border-b border-[#3A1212] outline-none font-serif text-[#3A1212] transition-all cursor-pointer rounded-none px-0 focus:border-b-2 dark:bg-[#09090B]"
                                            >
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="with_hijab">হিজাবসহ পুরো সেট (১৬৩০ ৳)</option>
                                                <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="single">শুধুমাত্র বোরকা (১৩৫০ ৳)</option>
                                            </select>
                                        </div>

                                        {/* Size Selection */}
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center bg-premium-gold/5 p-2 rounded-lg border border-premium-gold/20">
                                                    <p className="text-[10px] font-serif text-[#3A1212]/70 uppercase tracking-widest">পছন্দের সাইজ (লং):</p>
                                                    <span className="text-xs font-bold text-[#3A1212]">বডি: ৪৬/৪৮ ফ্রি সাইজ</span>
                                                </div>
                                                    <select
                                                        value={itemSize}
                                                        onChange={(e) => setItemSize(e.target.value)}
                                                        className="w-full p-3 border-0 border-b border-[#3A1212] rounded-none text-sm bg-transparent border-b border-[#3A1212] outline-none font-serif text-[#3A1212] transition-all cursor-pointer rounded-none px-0 focus:border-b-2 appearance-none"
                                                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em' }}
                                                    >
                                                        {['৫০', '৫২', '৫৪', '৫৬', '৫৮']?.map(size => (
                                                            <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={size} value={size}>{size}</option>
                                                        ))}
                                                    </select>
                                            </div>
                                        </div>

                                        {/* Quantity & Action */}
                                        <div className="pt-4 mt-auto space-y-4">
                                            <div className="flex items-center justify-between bg-gray-50 p-2 rounded dark:bg-[#09090B]">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                                                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-white hover:bg-slate-800 bg-transparent border border-[#3A1212]/30 text-[#3A1212] rounded-none transition-colors hover:bg-[#3A1212] hover:text-[#F4F0EA] dark:text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-10 text-center font-bold">{itemQty}</span>
                                                    <button
                                                        onClick={() => setItemQty(itemQty + 1)}
                                                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-white hover:bg-slate-800 bg-transparent border border-[#3A1212]/30 text-[#3A1212] rounded-none transition-colors hover:bg-[#3A1212] hover:text-[#F4F0EA] dark:text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">পরিমাণ</span>
                                            </div>

                                            <div className="bg-transparent border-t border-[#3A1212]/20 pt-4">
                                                <p className="text-xs text-center text-gray-500 mb-1">মোট মূল্য</p>
                                                <p className="text-[#111827] dark:text-white text-xl font-bold text-center text-[#FF4D6D]">{prices[itemType] * itemQty} ৳</p>
                                            </div>

                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => {
                                                            addToCart({
                                                                id: `haya_${color.name}_${itemType}`,
                                                                name: `হায়া সিরিজ - ${color.name} (${itemType === 'with_hijab' ? 'হিজাবসহ' : 'সিঙ্গেল'})`,
                                                                color: color.name,
                                                                size: itemSize,
                                                                price: prices[itemType],
                                                                quantity: itemQty,
                                                                image: heroImages[color.name]
                                                            });
                                                        }}
                                                        className="w-full bg-white text-[#FF4D6D] py-3 rounded font-bold flex items-center justify-center gap-2 hover:bg-gray-50 border-2 border-[#FF4D6D] transition-all shadow-sm active:scale-95 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                                    >
                                                        <ShoppingBag size={20} />
                                                        কার্টে যোগ করুন
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedColor(color.name);
                                                            setSelectedType(itemType);
                                                            setQuantity(itemQty);
                                                            setSelectedSize(itemSize);
                                                            scrollToForm();
                                                            // Facebook Pixel AddToCart
                                                            if (window.fbq) {
                                                                window.fbq('track', 'AddToCart', {
                                                                    content_name: `${color.name} বোরকা - ${itemType}`,
                                                                    content_category: 'Haya Series',
                                                                    value: prices[itemType],
                                                                    currency: 'BDT'
                                                                });
                                                            }
                                                        }}
                                                        className="w-full bg-[#FF4D6D] text-white py-3 rounded font-bold flex items-center justify-center gap-2 hover:bg-[#E63958] transition-all shadow-sm border border-slate-200 active:scale-95 shadow-[#FF4D6D]/20"
                                                    >
                                                        অর্ডার করুন
                                                    </button>
                                                </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Trust Badges section */}
            <section className="bg-premium-dark text-white py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-[#111827] dark:text-white text-xl font-bold mb-2">আপনি কি ফোন দিয়ে অর্ডার করতে চান?</h3>
                        <p className="opacity-70">আমাদের এক্সপার্টদের সাথে সরাসরি কথা বলে নিশ্চিত হোন।</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <a href="tel:+8801783155897" className="flex items-center gap-4 bg-white/10 p-4 rounded border border-white/20 hover:bg-white/20 transition-all dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <div className="p-3 bg-premium-gold rounded-none"><Phone /></div>
                            <div>
                                <p className="text-xs opacity-70">কল করুন</p>
                                <p className="text-xl font-bold text-amber-500">+৮৮০১ ৭৮৩-১৫৫৮৯৭</p>
                            </div>
                        </a>
                        <div className="text-center md:text-right">
                            <p className="text-sm font-medium">সার্ভিস টাইম:</p>
                            <p className="text-amber-500 font-bold">সকাল ০৯টা – রাত ০১ টা</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Delivery Info */}
            <section id="delivery" className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">আমাদের ডেলিভারি ও কোয়ালিটি নিশ্চয়তা</h2>
                        <p className="text-gray-600 dark:text-zinc-300">আমরা শুধু কাস্টমার স্যাটিসফেকশনের জন্য কাজ করি। আমাদের প্রতিটি পলিসি আপনার সুবিধার কথা চিন্তা করে তৈরি।</p>

                        <div className="space-y-4">
                            <div className="p-6 bg-white rounded border-l-4 border-premium-gold shadow-sm dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <h4 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white"><CheckCircle2 className="text-green-500" /> কোয়ালিটি গ্যারান্টি</h4>
                                <p className="text-sm text-gray-500 mt-2">১০০% প্রিমিয়াম ফেব্রিক এবং হ্যান্ডওয়ার্ক চেকড। প্রতিটি পণ্য আমরা নিখুঁতভাবে চেক করে পাঠাই।</p>
                            </div>
                            <div className="p-6 bg-white rounded border-l-4 border-premium-gold shadow-sm text-red-600 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <h4 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">⚠️ গুরুত্বপূর্ণ কুরিয়ার নোট:</h4>
                                <p className="text-sm mt-2 opacity-80">কুরিয়ার অপশন নিন বা না নিয়ে কাস্টমারকে ফুল ডেলিভারি চার্জ বহন করতে হবে। এটা কুরিয়ার কোম্পানির পলিসি, আমাদের নিয়ন্ত্রণে নেই।</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-premium-gold/10 p-8 rounded-lg border-2 border-premium-gold/20 space-y-8">
                        <h3 className="text-[#111827] dark:text-white text-xl font-bold text-center">ডেলিভারি চার্জ তালিকা</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded text-center space-y-2 border border-premium-gold/20 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <MapPin className="mx-auto text-amber-500" size={32} />
                                <p className="font-bold">ঢাকার ভিতরে</p>
                                <p className="text-[#111827] dark:text-white text-xl font-bold text-[#3A1212]">৮০ ৳</p>
                                <p className="text-xs text-gray-500">সময় ১-২ দিন</p>
                            </div>
                            <div className="bg-white p-6 rounded text-center space-y-2 border border-premium-gold/20 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <Truck className="mx-auto text-amber-500" size={32} />
                                <p className="font-bold">ঢাকার বাইরে</p>
                                <p className="text-[#111827] dark:text-white text-xl font-bold text-[#3A1212]">১৫০ ৳</p>
                                <p className="text-xs text-gray-500">সময় ২-৪ দিন</p>
                            </div>
                        </div>
                        <div className="bg-white/50 p-4 rounded-none text-sm italic text-gray-600 dark:text-zinc-300 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            * কুরিয়ার সার্ভিসে মিনিমাম ০.৫ কেজি ওয়েট গণনা করা হয়।
                        </div>
                    </div>
                </div>
            </section>

            {/* Order Form Section */}
            <section ref={orderFormRef} className="py-24 px-6 relative">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-premium-dark/5 -z-10"></div>
                <div className="max-w-4xl mx-auto bg-white rounded-md shadow-sm overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">

                    <div className="md:w-[40%] bg-premium-dark text-white p-8 space-y-8">
                        <h2 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">আপনার তথ্য দিন এবং অর্ডার প্রস্তুত করব</h2>
                        <p className="opacity-70">১০০% নিরাপদ ডেলিভারি ও কোয়ালিটি নিশ্চয়তা আমাদের।</p>

                        <div className="space-y-6">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-premium-gold rounded-none flex items-center justify-center text-[#3A1212]"><ShieldCheck /></div>
                                <div>
                                    <p className="font-bold">১০০% অরিজিনাল</p>
                                    <p className="text-xs opacity-60">প্রিমিয়াম কোয়ালিটি গ্যারান্টি</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-premium-gold rounded-none flex items-center justify-center text-[#3A1212]"><Truck /></div>
                                <div>
                                    <p className="font-bold">দ্রুত ডেলিভারি</p>
                                    <p className="text-xs opacity-60">সারা বাংলাদেশে হোম ডেলিভারি</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 space-y-4">
                            <p className="font-bold">কার্ট সামারি:</p>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">{selectedType === 'with_hijab' ? 'হিজাবসহ পুরো সেট' : 'শুধুমাত্র বোরকা'} ({quantity} টি)</span>
                                <span>{currentPrice} ৳</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">ডেলিভারি চার্জ</span>
                                <span>{deliveryCharges[deliveryArea]} ৳</span>
                            </div>
                            <div className="h-px bg-white/10 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"></div>
                            <div className="flex justify-between text-xl font-bold text-amber-500">
                                <span>সর্বমোট:</span>
                                <span>{currentTotal} ৳</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 md:p-12">
                        <h3 className="text-[#111827] dark:text-white text-xl font-bold mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-premium-dark text-white flex items-center justify-center text-sm font-bold">1</span>
                            গ্রাহকের তথ্য
                        </h3>
                        <form onSubmit={handleOrderSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">আপনার নাম *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                                    className="w-full p-4 rounded-none border border-gray-200 focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">মোবাইল নম্বর *</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="০১XXXXXXXXX"
                                    className="w-full p-4 rounded-none border border-gray-200 focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">আমরা এই নম্বরে কল করে অর্ডার কনফার্ম করব।</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">সম্পূর্ণ ঠিকানা *</label>
                                <textarea
                                    required
                                    placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, এলাকা, জেলা"
                                    className="w-full p-4 rounded-none border border-gray-200 focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all min-h-[100px]"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 block dark:text-zinc-300">ডেলিভারি এরিয়া *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('inside')}
                                        className={`p-4 rounded-none border-2 text-left transition-all ${deliveryArea === 'inside' ? 'border-premium-dark bg-[#F4F0EA]' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="font-bold flex justify-between">ঢাকার ভিতরে <CheckCircle2 size={18} className={deliveryArea === 'inside' ? 'text-[#3A1212]' : 'text-transparent'} /></div>
                                        <div className="text-xs opacity-60">চার্জ: ৮০ ৳ • ১-২ দিন সময়</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('outside')}
                                        className={`p-4 rounded-none border-2 text-left transition-all ${deliveryArea === 'outside' ? 'border-premium-dark bg-[#F4F0EA]' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="font-bold flex justify-between">ঢাকার বাইরে <CheckCircle2 size={18} className={deliveryArea === 'outside' ? 'text-[#3A1212]' : 'text-transparent'} /></div>
                                        <div className="text-xs opacity-60">চার্জ: ১৫০ ৳ • ১-৩ দিন সময়</div>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-premium-gold text-[#3A1212] py-5 rounded font-bold text-[#111827] dark:text-white text-xl shadow-sm hover:shadow-premium-gold/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-4 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার সম্পন্ন করুন'} {!isSubmitting && <ArrowRight />}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* WhatsApp Sticky Button */}
            <a
                href={`https://wa.me/88${appConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
            >
                <div className="flex items-center gap-2">
                    <span className="hidden group-hover:block ml-2 font-bold whitespace-nowrap">সরাসরি কথা বলুন</span>
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.888 11.888-11.888 3.176 0 6.161 1.237 8.404 3.48s3.481 5.229 3.481 8.404c0 6.556-5.332 11.888-11.888 11.888-2.012 0-3.986-.511-5.741-1.48L0 24zm6.12-2.903c1.554.921 3.03 1.388 4.61 1.388 5.623 0 10.201-4.578 10.201-10.201 0-5.623-4.578-10.201-10.201-10.201-2.723 0-5.283 1.061-7.207 2.985a10.137 10.137 0 00-2.984 7.208c0 1.637.458 3.167 1.353 4.542L1.07 22.848l5.107-1.751zm12.061-6.505c-.277-.139-1.641-.809-1.895-.9-.254-.092-.439-.139-.623.139-.184.277-.715.9-.877 1.085-.162.184-.323.208-.6.069-.277-.139-1.169-.431-2.227-1.374-.824-.735-1.38-1.642-1.541-1.92s-.018-.427.121-.565c.125-.124.277-.323.415-.485a1.868 1.868 0 00.277-.461.468.468 0 00-.023-.439c-.069-.139-.623-1.501-.853-2.053-.223-.538-.448-.465-.623-.473-.16-.008-.344-.01-.529-.01-.184 0-.485.069-.738.346-.253.277-.968.946-.968 2.308s.991 2.677 1.13 2.861c.139.184 1.95 2.977 4.724 4.173.66.285 1.174.455 1.577.583.662.21 1.265.18 1.74.109.53-.08 1.641-.67 1.872-1.316.23-.647.23-1.201.162-1.316-.069-.115-.254-.184-.531-.323z" />
                    </svg>
                </div>
            </a>

            {/* Order Form Popup Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto no-print">
                    <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col max-h-[90vh] my-8 animate-fade-in dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 bg-premium-dark text-white shrink-0">
                            <div>
                                <h3 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">আপনার তথ্য দিয়ে অর্ডার সম্পন্ন করুন</h3>
                                <p className="text-xs text-amber-500/80 font-bold mt-1">১০০% নিরাপদ ডেলিভারি ও কোয়ালিটি নিশ্চয়তা</p>
                            </div>
                            <button type="button" onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable Form) */}
                        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            
                            {/* Summary Banner */}
                            <div className="bg-slate-50 p-4 rounded-none space-y-2 border border-slate-100 text-sm dark:bg-[#09090B]">
                                <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                                    <span>প্রোডাক্ট: {selectedColor} বোরকা ({selectedType === 'with_hijab' ? 'হিজাবসহ' : 'শুধুমাত্র বোরকা'})</span>
                                    <span>সাইজ: {selectedSize}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-2"></div>
                                <div className="flex justify-between font-bold text-slate-700 dark:text-white">
                                    <span>পণ্যের মূল্য ({quantity} টি):</span>
                                    <span>{currentPrice} ৳</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-700 dark:text-white">
                                    <span>ডেলিভারি চার্জ:</span>
                                    <span>{deliveryCharges[deliveryArea]} ৳</span>
                                </div>
                                <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-black text-base text-[#3A1212]">
                                    <span>সর্বমোট বিল:</span>
                                    <span className="text-red-600">{currentTotal} ৳</span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <form onSubmit={handleOrderSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wide">আপনার নাম *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                                        className="w-full p-4 rounded-none bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all font-bold dark:bg-[#09090B]"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wide">মোবাইল নম্বর *</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="০১XXXXXXXXX"
                                        className="w-full p-4 rounded-none bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all font-bold dark:bg-[#09090B]"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wide">সম্পূর্ণ ঠিকানা *</label>
                                    <textarea
                                        required
                                        placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, এলাকা, জেলা"
                                        className="w-full p-4 rounded-none bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-premium-dark focus:border-premium-dark outline-none transition-all min-h-[80px] font-bold resize-none dark:bg-[#09090B]"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-wide block">ডেলিভারি এরিয়া *</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryArea('inside')}
                                            className={`p-3 rounded-none border-2 text-center transition-all text-xs font-bold ${deliveryArea === 'inside' ? 'border-premium-dark bg-[#F4F0EA]' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            🏙️ ঢাকার ভেতরে (৮০ ৳)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryArea('outside')}
                                            className={`p-3 rounded-none border-2 text-center transition-all text-xs font-bold ${deliveryArea === 'outside' ? 'border-premium-dark bg-[#F4F0EA]' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            🚚 ঢাকার বাইরে (১৫০ ৳)
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#FF4D6D] text-white py-4 rounded-none font-bold text-lg shadow-md hover:bg-[#E63958] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {isSubmitting ? 'অর্ডার প্রসেস হচ্ছে...' : '✅ অর্ডার সম্পন্ন করুন'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {orderSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="bg-white rounded-lg p-8 md:p-12 max-w-lg w-full text-center shadow-sm relative border-4 border-green-500 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 dark:text-white">অর্ডার সফল হয়েছে!</h2>
                        <p className="text-lg text-gray-600 mb-6 dark:text-zinc-300">
                            আমরা আপনার অর্ডারটি পেয়েছি। শীঘ্রই কল করা হবে।
                        </p>
                        <div className="space-y-4">
                            <a 
                                href={`https://wa.me/8801783155897?text=${encodeURIComponent(`*অর্ডার কনফার্ম (Haya)*\n\n*নাম:* ${formData.name}\n*মোবাইল:* ${formData.phone}\n*আইটেম:* ${selectedType}\n*সর্বমোট:* ${currentTotal} ৳`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] text-white py-4 rounded-none font-bold flex items-center justify-center gap-2"
                            >
                                WhatsApp এ নিশ্চিত করুন
                            </a>
                            <button
                                onClick={() => setOrderSuccess(false)}
                                className="w-full bg-gray-100 text-black py-4 rounded-none font-bold dark:text-white"
                            >
                                ঠিক আছে
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white pt-20 pb-10 border-t border-gray-100 px-6 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left space-y-4">
                            <div className="text-3xl font-bold tracking-tighter text-black flex items-center justify-center md:justify-start gap-2 dark:text-white">
                                <span>NR ZONE</span>
                            </div>
                            <p className="text-gray-500 max-w-sm mt-4 font-bold border-l-2 border-slate-100 pl-4">Premium Modesty Lifestyle</p>
                            <p className="text-gray-400 max-w-sm mt-2">সেরা কোয়ালিটি বোরকা এবং হিজাব কালেকশন। আমরা বিশ্বাস করি মডেস্টি মানেই আভিজাত্য।</p>
                        </div>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/share/r/185GWnrgi3/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#F4F0EA] flex items-center justify-center text-[#3A1212] hover:bg-premium-dark hover:text-white transition-all shadow-sm">
                                <span className="font-bold">f</span>
                            </a>
                            <a href={`https://wa.me/88${appConfig.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#F4F0EA] flex items-center justify-center text-[#3A1212] hover:bg-premium-dark hover:text-white transition-all shadow-sm">
                                <Phone size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500 font-medium">
                        <p>© 2026 NRZOONE | All Rights Reserved</p>
                        <p>Design & Developed by <span className="text-[#3A1212] font-bold">NRZOONE</span></p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-[#3A1212] transition-colors">প্রাইভেসি পলিসি</a>
                            <a href="#" className="hover:text-[#3A1212] transition-colors">টার্মস ও কন্ডিশন</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
