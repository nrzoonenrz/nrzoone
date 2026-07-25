import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderSubmit } from './hooks/useOrderSubmit';
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
    X,
    Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL, appConfig } from './config';
import { useCart } from './CartContext';

const ChotoMeyeCollection = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState('কালো');

    const heroImages = {
        'কালো': '/chotobon_black.jpg',
        'নীল': '/chotobon_blue.jpg',
        'অলিভ': '/chotobon_olive.jpg',
        'মেরুন': '/chotobon_maroon.jpg',
        'কফি': '/chotobon_coffee.jpg',
        'default': '/chotobon_black.jpg'
    };

    const currentHeroImage = heroImages[selectedColor] || heroImages['default'];
    const [selectedSize, setSelectedSize] = useState('২৪');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const sizes = ['২০', '২২', '২৪', '২৬', '২৮'];
    const orderFormRef = useRef(null);

    const prices = {
        single: 550,
        hijab: 120
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
    const [showSizeGuide, setShowSizeGuide] = useState(false);

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
        }
    });

    const handleOrderSubmit = async (e) => {
        e.preventDefault();

        const orderData = {
            ...formData,
            sourceWebsite: 'NRZOONE.COM',
            landingPage: 'Choto Meye Collection',
            productType: withHijab ? 'ছোট মেয়ে বোরকা + স্মল হিজাব' : 'ছোট মেয়ে বোরকা সিঙ্গেল',
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
        <div className="min-h-screen bg-[#FFFDF9] font-bengali text-[#2D2D2D] overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center border-b border-rose-100 shadow-sm">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <img loading="lazy" src="/nrzoone-logo-new.jpg" alt="NRzone Logo" className="h-[40px] md:h-[50px] object-contain" onError={(e)=>{e.target.style.display='none';}} />
                    <span className="font-bold text-lg text-slate-800 hidden sm:inline">NR ZONE</span>
                </div>
                <button
                    onClick={scrollToForm}
                    className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold hover:bg-rose-700 transition-all shadow-md text-sm md:text-base flex items-center gap-2"
                >
                    <ShoppingBag size={18} /> অর্ডার করুন
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 md:pt-32 md:pb-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 space-y-6 text-center md:text-left"
                    >
                        <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-bold">
                            <Sparkles size={16} /> ছোট মেয়ে স্পেশাল কালেকশন
                        </div>
                        <h1 className="text-3xl md:text-6xl font-black leading-tight text-slate-900">
                            আরামদায়ক ও কিউট <br />
                            <span className="text-rose-600">ছোট মেয়ে কালেকশন</span>
                        </h1>
                        <div className="space-y-3 text-base md:text-lg text-slate-700 font-medium bg-white/60 p-5 rounded-2xl border border-rose-100">
                            <p className="flex items-center gap-2 justify-center md:justify-start">✨ ছোটদের জন্য বিশেষভাবে তৈরি আরামদায়ক বোরকা</p>
                            <p className="flex items-center gap-2 justify-center md:justify-start">🧣 স্মল ম্যাচিং হিজাব সহ সম্পূর্ণ সেট</p>
                            <p className="flex items-center gap-2 justify-center md:justify-start">👗 সাইজ ২০ থেকে ২৮ পর্যন্ত সব বয়সের ছোটদের জন্য</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4 items-center">
                            <button
                                onClick={scrollToForm}
                                className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-lg hover:shadow-rose-600/30 hover:-translate-y-0.5"
                            >
                                এখনই অর্ডার করুন
                            </button>
                            <button
                                onClick={() => setShowSizeGuide(true)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-5 py-4 rounded-2xl font-bold text-sm border border-rose-200 transition-all flex items-center gap-2"
                            >
                                📏 সাইজ গাইড দেখুন
                            </button>
                            <div className="flex flex-col justify-center text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">শুরু মাত্র</p>
                                <p className="text-3xl font-black text-rose-600">৳ ৫৫০ <span className="text-base font-medium text-slate-400 line-through ml-2">৳ ৭৫০</span></p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 relative w-full max-w-md mx-auto"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-rose-50">
                            <img
                                src={currentHeroImage}
                                alt="Choto Meye Collection"
                                className="w-full h-full object-cover transition-all duration-500"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-md z-10 border border-rose-100">
                                <p className="text-xs font-bold text-slate-500 mb-2">উপলব্ধ কালারসমূহ</p>
                                <div className="flex gap-2">
                                    {colors.map(c => (
                                        <div
                                            key={c.name}
                                            onClick={() => setSelectedColor(c.name)}
                                            className={`w-7 h-7 rounded-full cursor-pointer border-2 ${selectedColor === c.name ? 'border-rose-600 scale-110 shadow-sm' : 'border-white'} ${c.class} transition-all`}
                                            title={c.name}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Selection Grid */}
            <section className="py-16 bg-white border-t border-rose-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">পছন্দের কালার ও সাইজ বেছে নিন</h2>
                        <p className="text-slate-500 font-medium">স্মল হিজাব সহ বা ছাড়া সরাসরি আপনার পছন্দের সেটটি নিন</p>
                        <div className="w-20 h-1.5 bg-rose-600 mx-auto rounded-full mt-4"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {colors.map((color) => {
                            return (
                                <motion.div
                                    key={color.name}
                                    whileHover={{ y: -6 }}
                                    className="bg-[#FFFDF9] rounded-3xl overflow-hidden border border-rose-100 shadow-sm hover:shadow-xl transition-all flex flex-col"
                                >
                                    <div className="aspect-[4/5] relative overflow-hidden bg-rose-50">
                                        <img loading="lazy" src={heroImages[color.name]} className="w-full h-full object-cover" alt={`Choto Meye Borka - ${color.name}`} />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                                            {color.name}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">ছোট মেয়ে বোরকা - {color.name}</h3>
                                            <p className="text-sm text-slate-500 font-medium">স্মল ম্যাচিং হিজাব অপশন সহ</p>
                                            <div className="mt-3 bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-1.5">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">শুধু বোরকা:</span>
                                                    <span className="font-bold text-slate-800">৳ {prices.single}৳</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-t border-rose-200 pt-1.5">
                                                    <span className="text-slate-500 font-medium">হিজাব সহ সেট:</span>
                                                    <span className="font-black text-rose-600 text-base">৳ {prices.single + prices.hijab}৳</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                                    <span>(হিজাব মূল্য: +৳{prices.hijab})</span>
                                                    <span className="line-through">রেগুলার ৳৭৫০</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedColor(color.name);
                                                    setShowOrderModal(true);
                                                }}
                                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm text-center"
                                            >
                                                অর্ডার করুন
                                            </button>
                                            <button
                                                onClick={() => {
                                                    addToCart({
                                                        id: `chotomeye-${color.name}`,
                                                        name: `ছোট মেয়ে বোরকা (${color.name})`,
                                                        price: prices.single + prices.hijab,
                                                        size: selectedSize,
                                                        color: color.name,
                                                        image: heroImages[color.name]
                                                    });
                                                }}
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-3 rounded-xl transition-all border border-rose-200"
                                                title="কার্টে যোগ করুন"
                                            >
                                                <ShoppingBag size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Banner */}
            <section className="py-16 bg-rose-50/50">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><Truck size={28} /></div>
                        <div>
                            <h4 className="font-bold text-slate-900">দ্রুত ডেলিভারি</h4>
                            <p className="text-xs text-slate-500">সারাদেশে নিরাপদ ক্যাশ অন ডেলিভারি</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><ShieldCheck size={28} /></div>
                        <div>
                            <h4 className="font-bold text-slate-900">১০০% প্রিমিয়াম কাপড়</h4>
                            <p className="text-xs text-slate-500">ছোটদের ত্বকের জন্য আরামদায়ক</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><CheckCircle2 size={28} /></div>
                        <div>
                            <h4 className="font-bold text-slate-900">চেক করে নেওয়ার সুযোগ</h4>
                            <p className="text-xs text-slate-500">ডেলিভারি ম্যানের সামনে দেখে নিন</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><Headphones size={28} /></div>
                        <div>
                            <h4 className="font-bold text-slate-900">২৪/৭ সাপোর্ট</h4>
                            <p className="text-xs text-slate-500">যেকোনো প্রশ্ন বা সহযোগিতায়</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Real Customer Reviews Section */}
            <section className="py-16 bg-white border-t border-rose-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold mb-3">
                            <Star size={14} className="fill-amber-500 text-amber-500" /> ১০০% হ্যাপি কাস্টমার রিভিউ
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">আমাদের সম্মানিত কাস্টমারদের মতামত</h2>
                        <p className="text-slate-500 font-medium">বাস্তব রিভিউ ও ছোটমণিদের বোরকা পরা ছবি</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#FFFDF9] p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                "আমার ৩ বছরের মেয়ের জন্য সাইজ ২০ নিয়েছি। কাপড়ের মান খুবই সফট এবং বাচ্চার গায়ে খুব সুন্দর মানিয়েছে। আলহামদুলিল্লাহ!"
                            </p>
                            <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">নাসরিন সুলতানা, ঢাকা</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Verified Buyer</span>
                            </div>
                        </div>

                        <div className="bg-[#FFFDF9] p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                "সাইজ ২৪ অর্ডার করেছিলাম, সাইজ গাইড দেখে পারফেক্ট মাপ পেয়েছি। হিজাবসহ লুকটা মাশাল্লাহ দারুণ লাগে।"
                            </p>
                            <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">আমেনা আক্তার, চট্টগ্রাম</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Verified Buyer</span>
                            </div>
                        </div>

                        <div className="bg-[#FFFDF9] p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                "মাত্র ২ দিনে ডেলিভারি পেয়েছি। কাপড়ের কোয়ালিটি ও ফিনিশিং এক কথায় অসাধারণ। ধন্যবাদ NR Zone কে!"
                            </p>
                            <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">ফারজানা রহমান, সিলেট</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">Verified Buyer</span>
                            </div>
                        </div>
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
                        >
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">ছোট মেয়ে কালেকশন অর্ডার ফর্ম</h3>
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
                                        <label className="block text-xs font-bold text-slate-700 mb-2">সাইজ নির্বাচন করুন (২০-২৮):</label>
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
                                            <p className="text-sm font-bold text-slate-800">স্মল ম্যাচিং হিজাব যুক্ত করবেন?</p>
                                            <p className="text-xs text-slate-500">হিজাব মূল্য: ৳১২০</p>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-rose-100 space-y-4"
                        >
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">অর্ডার সফল হয়েছে!</h3>
                            <p className="text-sm text-slate-600">
                                ধন্যবাদ <span className="font-bold text-slate-900">{formData.name}</span>! আপনার ছোট মেয়ে কালেকশনের অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমাদের প্রতিনিধি কল করে নিশ্চিত করবে।
                            </p>
                            <button
                                onClick={() => setOrderSuccess(false)}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                ঠিক আছে
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Size Guide Modal */}
            <AnimatePresence>
                {showSizeGuide && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-rose-100 relative"
                        >
                            <button
                                onClick={() => setShowSizeGuide(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <span className="text-3xl mb-2 block">📏</span>
                                <h3 className="text-2xl font-black text-slate-900 mb-1">ছোট মেয়ে কালেকশন সাইজ গাইড</h3>
                                <p className="text-xs text-slate-500 font-medium">বাচ্চার বয়স ও ঝুল (লম্বা) অনুযায়ী সঠিক সাইজ নির্বাচন করুন</p>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-rose-100 mb-6">
                                <table className="w-full text-left border-collapse text-xs md:text-sm">
                                    <thead>
                                        <tr className="bg-rose-600 text-white font-bold">
                                            <th className="p-3">সাইজ (Size)</th>
                                            <th className="p-3">বয়স (Age)</th>
                                            <th className="p-3">লম্বা/ঝুল (Inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-rose-100 bg-[#FFFDF9] font-medium text-slate-800">
                                        <tr className="hover:bg-rose-50/50">
                                            <td className="p-3 font-bold text-rose-600">২০ (Size 20)</td>
                                            <td className="p-3">২ - ৩ বছর</td>
                                            <td className="p-3">২০ - ২২ ইঞ্চি</td>
                                        </tr>
                                        <tr className="hover:bg-rose-50/50">
                                            <td className="p-3 font-bold text-rose-600">২২ (Size 22)</td>
                                            <td className="p-3">৩ - ৪ বছর</td>
                                            <td className="p-3">২২ - ২৪ ইঞ্চি</td>
                                        </tr>
                                        <tr className="hover:bg-rose-50/50">
                                            <td className="p-3 font-bold text-rose-600">২৪ (Size 24)</td>
                                            <td className="p-3">৪ - ৫ বছর</td>
                                            <td className="p-3">২৪ - ২৬ ইঞ্চি</td>
                                        </tr>
                                        <tr className="hover:bg-rose-50/50">
                                            <td className="p-3 font-bold text-rose-600">২৬ (Size 26)</td>
                                            <td className="p-3">৫ - ৬ বছর</td>
                                            <td className="p-3">২৬ - ২৮ ইঞ্চি</td>
                                        </tr>
                                        <tr className="hover:bg-rose-50/50">
                                            <td className="p-3 font-bold text-rose-600">২৮ (Size 28)</td>
                                            <td className="p-3">৬ - ৭ বছর</td>
                                            <td className="p-3">২৮ - ৩০ ইঞ্চি</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1 mb-6">
                                <p className="font-bold flex items-center gap-1">💡 পরামর্শ:</p>
                                <p>বাচ্চা যদি বয়সের তুলনায় কিছুটা স্বাস্থ্যবান বা লম্বা হয়, তবে ১ সাইজ বড় অর্ডার করার পরামর্শ দেওয়া হচ্ছে।</p>
                            </div>

                            <button
                                onClick={() => setShowSizeGuide(false)}
                                className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl hover:bg-rose-700 transition-all shadow-md text-sm"
                            >
                                বুঝেছি, ধন্যবাদ
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChotoMeyeCollection;
