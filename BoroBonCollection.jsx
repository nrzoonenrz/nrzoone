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
    Minus,
    Plus,
    Sparkles,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {  GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL , appConfig } from './config';
import { useOrderSubmit } from './hooks/useOrderSubmit';
import { useCart } from './CartContext';

const BoroBonCollection = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState('কালো');

    const heroImages = {
        'কালো': '/boro_bon_black.jpg',
        'নীল': '/boro_bon_blue.jpg',
        'অলিভ': '/boro_bon_olive.jpg',
        'মেরুন': '/boro_bon_maroon.jpg',
        'কফি': '/boro_bon_coffee.png',
        'default': '/boro_bon_black.jpg'
    };

    const currentHeroImage = heroImages[selectedColor] || heroImages['default'];
    const [selectedSize, setSelectedSize] = useState('৪২');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const sizes = ['৪২', '৪৪', '৪৬', '৪৮'];
    const orderFormRef = useRef(null);

    const prices = {
        single: 990,
        hijab: 220
    };

    const deliveryCharges = { inside: appConfig.deliveryDhaka, outside: appConfig.deliveryOutside };

    const colors = [
        { name: 'কালো', class: 'bg-black' },
        { name: 'নীল', class: 'bg-[#1E3A8A]' },
        { name: 'অলিভ', class: 'bg-[#556B2F]' },
        { name: 'মেরুন', class: 'bg-[#800000]' },
        { name: 'কফি', class: 'bg-[#4B3621]' }
    ];

    const [withHijab, setWithHijab] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [showOrderModal, setShowOrderModal] = useState(false);

    const scrollToForm = () => {
        setShowOrderModal(true);
    };

    const itemPrice = prices.single + (withHijab ? prices.hijab : 0);
    const currentPrice = itemPrice * quantity;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const { submitOrder, isSubmitting, orderSuccess, setOrderSuccess } = useOrderSubmit({
        onSuccess: () => {
            setShowOrderModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। অনুগ্রহ করে ফোন করে অর্ডার দিন।');
        }
    });

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        
        const orderData = {
            ...formData,
            sourceWebsite: 'NRZOONE.COM',
            landingPage: 'Boro Bon Collection',
            productType: withHijab ? 'বোরকা + হিজাব (বড় বোন)' : 'বোরকা সিঙ্গেল (বড় বোন)',
            color: selectedColor,
            size: selectedSize,
            quantity,
            price: currentPrice,
            deliveryCharge: deliveryCharges[deliveryArea],
            total: currentTotal,
        };
        
        await submitOrder(orderData);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-bengali text-[#2D2D2D] overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center border-b border-gray-100 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <img loading="lazy" src="/nrzoone-logo-new.jpg" alt="NRzone Logo" className="h-[40px] md:h-[50px] object-contain" onError={(e)=>{e.target.style.display='none';}} />
                </div>
                <button
                    onClick={scrollToForm}
                    className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-neutral-800 transition-all shadow-sm border border-slate-200 text-sm md:text-base"
                >
                    অর্ডার দিন
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 md:pt-32 md:pb-24 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 space-y-6 text-center md:text-left"
                    >
                        <div className="inline-flex items-center gap-2 bg-neutral-100 text-black px-4 py-1 rounded-full text-sm font-bold dark:text-white">
                            <Sparkles size={16} /> বড়বোন কালেকশন
                        </div>
                        <h1 className="text-[#111827] dark:text-white text-xl md:text-6xl font-bold leading-tight text-[#1A1A1A]">
                            এলিগ্যান্ট ডিজাইন <br />
                            <span className="text-black dark:text-white">বড়বোন বোরকা সেট</span>
                        </h1>
                        <div className="space-y-2 text-lg text-gray-600 dark:text-zinc-300">
                            <p>✨ বড় বোনদের জন্য প্রিমিয়াম ডিজাইনের বোরকা</p>
                            <p>🧣 ম্যাচিং বড় হিজাব (৭২ ইঞ্চি) সহ সম্পূর্ণ সেট</p>
                            <p>👗 সাইজ ৪২ থেকে ৪৮ পর্যন্ত এভেলেবল</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                            <button
                                onClick={scrollToForm}
                                className="bg-black text-white px-10 py-4 rounded font-bold text-xl hover:shadow-sm hover:bg-neutral-800 transition-all shadow-sm shadow-black/10"
                            >
                                এখনই অর্ডার করুন
                            </button>
                            <div className="flex flex-col justify-center">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">মূল্য শুরু মাত্র</p>
                                <p className="text-3xl font-bold text-black dark:text-white">৳ ৯৯০ <span className="text-base font-medium text-gray-400 line-through ml-2">৳ ১২০০</span></p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 relative"
                    >
                        <div className="relative rounded-lg overflow-hidden shadow-sm border-8 border-white group aspect-[9/16] w-full max-w-sm mx-auto md:max-w-md bg-black">
                            <iframe 
                                src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1157413009867299&show_text=false&autoplay=1&mute=0"
                                width="100%" 
                                height="100%" 
                                style={{ border: 'none', overflow: 'hidden', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                                scrolling="no" 
                                frameBorder="0" 
                                allowFullScreen={true} 
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                title="Boro Bon Borka Video"
                            ></iframe>
                            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur p-4 rounded shadow-sm z-10 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <p className="text-xs font-bold text-gray-400 mb-1">এভেলেবল কালার</p>
                                <div className="flex gap-2">
                                    {colors?.map(c => (
                                        <div
                                            key={c.name}
                                            onClick={() => setSelectedColor(c.name)}
                                            className={`w-6 h-6 rounded-full cursor-pointer border-2 ${selectedColor === c.name ? 'border-black scale-125' : 'border-transparent'} ${c.class} transition-all`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Selection Grid */}
            <section className="py-20 bg-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">পছন্দের কালার ও প্যাকেজ</h2>
                        <div className="w-24 h-2 bg-black mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {colors?.map((color) => {
                            const [itemWithHijab, setItemWithHijab] = useState(true);
                            const price = prices.single + (itemWithHijab ? prices.hijab : 0);

                            return (
                                <motion.div
                                    key={color.name}
                                    whileHover={{ y: -10 }}
                                    className="bg-[#FDFBF7] rounded-lg overflow-hidden border border-gray-100 shadow-sm flex flex-col"
                                >
                                    <div className="aspect-[4/5] relative overflow-hidden">
                                        <img loading="lazy" src={heroImages[color.name]} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-4 left-4 bg-white/90 px-4 py-1 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                            {color.name}
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                                        <h3 className="text-[#111827] dark:text-white text-xl font-bold">বড়বোন বোরকা - {color.name}</h3>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">প্যাকেজ সিলেক্ট করুন:</p>
                                            <button
                                                onClick={() => setItemWithHijab(true)}
                                                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${itemWithHijab ? 'border-rose-600 bg-rose-50' : 'border-gray-100 bg-white'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm">🧣 বোরকা + হিজাব সেট</span>
                                                    <span className={`font-black text-base ${itemWithHijab ? 'text-rose-600' : 'text-slate-700'}`}>৳ {prices.single + prices.hijab}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-0.5">শুধু বোরকা ৳{prices.single} + হিজাব ৳{prices.hijab}</p>
                                            </button>
                                            <button
                                                onClick={() => setItemWithHijab(false)}
                                                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${!itemWithHijab ? 'border-slate-800 bg-slate-50' : 'border-gray-100 bg-white'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm">👗 শুধু বোরকা</span>
                                                    <span className={`font-black text-base ${!itemWithHijab ? 'text-slate-800' : 'text-slate-500'}`}>৳ {prices.single}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-0.5">হিজাব ছাড়া শুধু বোরকা</p>
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-3 mt-auto">
                                            <button
                                                onClick={() => {
                                                    addToCart({
                                                        id: `borobon_${color.name}_${itemWithHijab ? 'with_hijab' : 'without_hijab'}`,
                                                        name: `বড়বোন বোরকা - ${color.name} ${itemWithHijab ? '(হিজাবসহ)' : '(সিঙ্গেল)'}`,
                                                        color: color.name,
                                                        size: selectedSize,
                                                        price: price,
                                                        quantity: 1,
                                                        image: heroImages[color.name]
                                                    });
                                                }}
                                                className="w-full bg-white text-black border-2 border-black py-3 rounded font-bold hover:bg-neutral-100 transition-all shadow-sm flex items-center justify-center gap-2 dark:text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                            >
                                                <ShoppingBag size={20} /> কার্টে যোগ করুন
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedColor(color.name);
                                                    setWithHijab(itemWithHijab);
                                                    scrollToForm();
                                                }}
                                                className="w-full bg-black text-white py-3 rounded font-bold hover:bg-neutral-800 transition-all shadow-sm border border-slate-200"
                                            >
                                                অর্ডার করুন
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Order Form */}
            <section ref={orderFormRef} className="py-24 px-6 bg-neutral-100">
                <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row border border-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="md:w-[40%] bg-black text-white p-12 space-y-8">
                        <h2 className="text-[#111827] dark:text-white text-xl font-bold leading-tight">অর্ডার তথ্য</h2>
                        <div className="space-y-4 pt-8">
                            <div className="flex justify-between items-center text-lg border-b border-white/10 pb-4">
                                <span className="opacity-70">কালার:</span>
                                <span className="font-bold">{selectedColor}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg border-b border-white/10 pb-4">
                                <span className="opacity-70">প্যাকেজ:</span>
                                <span className="font-bold">{withHijab ? 'বোরকা + হিজাব' : 'শুধুমাত্র বোরকা'}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg border-b border-white/10 pb-4">
                                <span className="opacity-70">সাইজ:</span>
                                <span className="font-bold">{selectedSize}</span>
                            </div>
                            <div className="flex justify-between items-center text-3xl font-bold text-white pt-4">
                                <span>সর্বমোট:</span>
                                <span>৳ {currentTotal}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 md:p-12">
                        <form onSubmit={handleOrderSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase">আপনার নাম *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-4 rounded bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all dark:bg-[#09090B]"
                                        placeholder="সম্পূর্ণ নাম লিখুন"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase">মোবাইল নম্বর *</label>
                                    <input
                                        required
                                        type="tel"
                                        className="w-full p-4 rounded bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all dark:bg-[#09090B]"
                                        placeholder="০১XXXXXXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 uppercase">সম্পূর্ণ ঠিকানা *</label>
                                    <textarea
                                        required
                                        className="w-full p-4 rounded bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all min-h-[100px] dark:bg-[#09090B]"
                                        placeholder="বাসা নম্বর, রোড, এলাকা ও জেলা"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-500 uppercase block">সাইজ সিলেক্ট করুন *</label>
                                <select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    className="w-full p-4 rounded bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all font-bold text-lg cursor-pointer appearance-none dark:bg-[#09090B]"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                                >
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="" disabled>সাইজ সিলেক্ট করুন</option>
                                    {sizes?.map(s => (
                                        <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-500 uppercase block">ডেলিভারি এরিয়া *</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('inside')}
                                        className={`p-4 rounded border-2 text-left ${deliveryArea === 'inside' ? 'border-black bg-black/5' : 'border-gray-100'}`}
                                    >
                                        <p className="font-bold">ঢাকার ভিতরে</p>
                                        <p className="text-xs opacity-50">৮০ ৳</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryArea('outside')}
                                        className={`p-4 rounded border-2 text-left ${deliveryArea === 'outside' ? 'border-black bg-black/5' : 'border-gray-100'}`}
                                    >
                                        <p className="font-bold">ঢাকার বাইরে</p>
                                        <p className="text-xs opacity-50">১৫০ ৳</p>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-white py-6 rounded font-bold text-[#111827] dark:text-white text-xl shadow-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isSubmitting ? 'প্রসেস হচ্ছে...' : 'অর্ডার সম্পন্ন করুন'} <ArrowRight />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Order Modal */}
            <AnimatePresence>
                {showOrderModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-rose-100 my-8 relative overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">বড়বোন কালেকশন অর্ডার ফর্ম</h3>
                            <p className="text-xs text-slate-500 text-center mb-6">নিচের ফর্মটি পূরণ করে অর্ডার নিশ্চিত করুন</p>

                            <form onSubmit={handleOrderSubmit} className="space-y-6">
                                {/* Options Selection */}
                                <div className="space-y-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                                    {/* Color Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">কালার নির্বাচন করুন:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(c => (
                                                <button
                                                    type="button"
                                                    key={c.name}
                                                    onClick={() => setSelectedColor(c.name)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedColor === c.name ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Size Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">সাইজ নির্বাচন করুন (৪২-৫২):</label>
                                        <div className="flex flex-wrap gap-2">
                                            {sizes.map(s => (
                                                <button
                                                    type="button"
                                                    key={s}
                                                    onClick={() => setSelectedSize(s)}
                                                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${selectedSize === s ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hijab toggle */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">ম্যাচিং হিজাব যুক্ত করবেন?</p>
                                            <p className="text-xs text-slate-500">হিজাব মূল্য: ৳২২০</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setWithHijab(!withHijab)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${withHijab ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                        >
                                            {withHijab ? 'হ্যাঁ (হিজাব সহ)' : 'না (শুধু বোরকা)'}
                                        </button>
                                    </div>
                                </div>

                                {/* Delivery Area */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">ডেলিভারি এলাকা:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryArea('inside')}
                                            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${deliveryArea === 'inside' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600'}`}
                                        >
                                            ঢাকা সিটির ভেতরে (৳{deliveryCharges.inside})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryArea('outside')}
                                            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${deliveryArea === 'outside' ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600'}`}
                                        >
                                            ঢাকার বাইরে (৳{deliveryCharges.outside})
                                        </button>
                                    </div>
                                </div>

                                {/* User Details Form */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">আপনার নাম *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="আপনার নাম লিখুন"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-600 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="০১৭XXXXXXXX"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-600 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণাঙ্গ ঠিকানা *</label>
                                        <textarea
                                            required
                                            rows={2}
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="বাসা নম্বর, রোড, এলাকা, জেলা"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-600 text-sm"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Pricing Summary */}
                                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>পণ্য মূল্য:</span>
                                        <span>৳{currentPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>ডেলিভারি চার্জ:</span>
                                        <span>৳{deliveryCharges[deliveryArea]}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-700 text-rose-400">
                                        <span>সর্বমোট:</span>
                                        <span>৳{currentTotal}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg text-base"
                                >
                                    {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {orderSuccess && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-rose-100 space-y-4"
                        >
                            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 size={48} className="text-black dark:text-white" />
                            </div>
                            <h2 className="text-[#111827] dark:text-white text-xl font-bold text-gray-900 dark:text-white mb-4">অর্ডার সফল!</h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed dark:text-zinc-300">
                                শীঘ্রই আপনাকে কল করে নিশ্চিত করা হবে।
                            </p>
                             <div className="space-y-4">
                                <a 
                                    href={`https://wa.me/8801783155897?text=${encodeURIComponent(`*নতুন অর্ডার (Boro Bon)*\n\n*নাম:* ${formData.name}\n*মোবাইল:* ${formData.phone}\n*প্যাকেজ:* ${withHijab ? 'বোরকা + হিজাব' : 'শুধুমাত্র বোরকা'}\n*সর্বমোট:* ${currentTotal} ৳\n\n_অর্ডারটি কনফার্ম করতে এই মেসেজটি পাঠান।_`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#25D366] text-white py-4 rounded font-bold text-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-sm border border-slate-200"
                                >
                                    WhatsApp এ কনফার্ম করুন
                                </a>
                                <button
                                    onClick={() => setOrderSuccess(false)}
                                    className="w-full bg-neutral-100 text-black py-4 rounded font-bold text-xl dark:text-white"
                                >
                                    ঠিক আছে
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sticky WhatsApp */}
            <a href={`https://wa.me/88${appConfig.whatsappNumber}`} target="_blank" className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-sm hover:scale-110 transition-all">
                <Phone size={32} />
            </a>
        </div>
    );
};

export default BoroBonCollection;
