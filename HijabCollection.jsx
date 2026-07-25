import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useOrderSubmit } from './hooks/useOrderSubmit';
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
    Image as ImageIcon,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {  GOOGLE_SHEET_URL, SMS_API_KEY, SMS_SENDER_ID, SMS_API_URL, WHATSAPP_PHONE, WHATSAPP_API_KEY, WHATSAPP_API_URL , appConfig } from './config';
import { useCart } from './CartContext';

const HijabCollection = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    
    const [selectedColor, setSelectedColor] = useState('Black');
    const [selectedDesign, setSelectedDesign] = useState('haya');
    const [selectedSize, setSelectedSize] = useState('72 Inchi (Majhari)');
    const [quantity, setQuantity] = useState(1);
    const [deliveryArea, setDeliveryArea] = useState('inside');
    
    const orderFormRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', note: '' });

    const hijabSizes = [
        { id: '40', label: '40 Inchi (Choto)', price: 250 },
        { id: '72', label: '72 Inchi (Majhari)', price: 450 },
        { id: '80', label: '80 Inchi (Boro)', price: 650 }
    ];

    const designs = [
        { id: 'haya', name: 'হায়া বোরকা হিজাব' },
        { id: 'lota', name: 'লতা বোরকা হিজাব' }
    ];

    const colors = [
        { name: 'Black', class: 'bg-black' },
        { name: 'Maroon', class: 'bg-[#800000]' },
        { name: 'Olive', class: 'bg-[#556B2F]' },
        { name: 'Navy', class: 'bg-[#1E3A8A]' },
        { name: 'Brown', class: 'bg-[#A52A2A]' }
    ];

    const getImageUrl = (design, color) => {
        const colorMap = {
            'Black': 'black',
            'Maroon': 'maroon',
            'Olive': 'green',
            'Navy': 'blue',
            'Brown': 'brown'
        };
        const colorSuffix = colorMap[color] || 'black';
        return `/${design}-${colorSuffix}.jpg`;
    };

    const deliveryCharges = { inside: appConfig.deliveryDhaka, outside: appConfig.deliveryOutside };

    const currentSizeObj = hijabSizes.find(s => s.label === selectedSize) || hijabSizes[1];
    const currentDesignObj = designs.find(d => d.id === selectedDesign) || designs[0];
    const currentPrice = currentSizeObj.price * quantity;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const [showOrderModal, setShowOrderModal] = useState(false);
    const { submitOrder, isSubmitting, orderSuccess, setOrderSuccess } = useOrderSubmit({
        onSuccess: () => {
            setShowOrderModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const scrollToForm = () => setShowOrderModal(true);

    const handleOrderSubmit = async (e) => {
        e.preventDefault();

        const orderData = {
            ...formData,
            sourceWebsite: 'NRZOONE.COM',
            landingPage: 'Hijab Collection',
            productType: `${currentDesignObj.name} (${selectedSize})`,
            design: currentDesignObj.name,
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
        <div className="min-h-screen bg-[#FAFAFA] font-bengali text-slate-900 dark:text-white tracking-tight overflow-x-hidden dark:text-white">
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center border-b shadow-sm dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
                    <img loading="lazy" src="/nrzoone-logo-new.jpg" alt="NRzone" className="h-[40px] md:h-[50px] object-contain" />
                </div>
                <button onClick={scrollToForm} className="bg-[#0f172a] text-white px-8 py-2.5 rounded-full font-bold hover:bg-slate-700 transition-all shadow-sm border border-slate-200 text-sm">অর্ডার দিন</button>
            </nav>

            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 bg-indigo-50/50 text-[#111827] dark:text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={16} /> Premium Hijab Collection
                        </div>
                        <h1 className="text-5xl md:text-[#111827] dark:text-white text-xl font-bold leading-tight tracking-tighter">
                            আপনার মডেস্টিকে দিন <br />
                            <span className="text-[#111827] dark:text-white">নতুন মাত্রা</span>
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-zinc-300 font-medium leading-relaxed max-w-xl">
                            প্রিমিয়াম দুবাই চেরি ও জর্জেট ফেব্রিকের তৈরি আমাদের হিজাবগুলো আপনাকে দেবে সর্বোচ্চ আরাম এবং আভিজাত্য। ৩টি ক্যাটাগরিতে পাওয়া যাচ্ছে।
                        </p>
                        <div className="flex flex-wrap gap-6 pt-4">
                            <button onClick={scrollToForm} className="bg-[#0f172a] text-white px-10 py-5 rounded font-bold text-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all active:scale-95">অর্ডার করুন এখনই</button>
                            <div className="flex flex-col justify-center">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Price Starts From</p>
                                <p className="text-3xl font-bold">৳ ২৫০ <span className="text-sm font-bold text-slate-300 line-through ml-2">৳ ৩৫০</span></p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full max-w-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Dynamic Image Preview */}
                            <div className="relative rounded-md overflow-hidden shadow-sm border-8 border-white aspect-[3/4] bg-black">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={`${selectedDesign}-${selectedColor}`}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5 }}
                                        src={getImageUrl(selectedDesign, selectedColor)}
                                        alt={`${selectedColor} ${selectedDesign} Hijab`}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>
                                <div className="absolute top-4 right-4 bg-[#111827] hover:bg-[#1F2937] text-white px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-sm">Top Choice</div>
                            </div>

                            {/* Product Video */}
                            <div className="relative rounded-md overflow-hidden shadow-sm border-8 border-white aspect-[3/4] bg-black">
                                <iframe 
                                    src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F3941295516004637&show_text=false&autoplay=1&mute=1"
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 'none', overflow: 'hidden', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                                    scrolling="no" 
                                    frameBorder="0" 
                                    allowFullScreen={true} 
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    title="Premium Hijab Video"
                                ></iframe>
                                <div className="absolute bottom-4 left-0 right-0 text-center bg-black/50 backdrop-blur-sm py-2 text-[10px] font-bold text-white uppercase tracking-widest">Product Video</div>
                            </div>
                        </div>
                        
                        {/* Instant Design & Color Selection */}
                        <div className="mt-8 space-y-8">
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">১. ডিজাইন সিলেক্ট করুন:</p>
                                <div className="flex gap-4">
                                    {designs?.map(d => (
                                        <button 
                                            key={d.id} 
                                            onClick={() => setSelectedDesign(d.id)}
                                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${selectedDesign === d.id ? 'bg-[#111827] hover:bg-[#1F2937] border-[#111827] text-white shadow-sm border border-slate-200' : 'bg-white border-slate-200 text-slate-500 dark:text-zinc-300 hover:border-blue-300'}`}
                                        >
                                            {d.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">২. কালার সিলেক্ট করুন:</p>
                                <div className="flex justify-center gap-4">
                                    {colors?.map(c => (
                                        <button 
                                            key={c.name} 
                                            onClick={() => setSelectedColor(c.name)} 
                                            className={`w-10 h-10 rounded-full transition-all shadow-md ${selectedColor === c.name ? 'ring-4 ring-blue-600 scale-125 z-10' : 'opacity-70 hover:opacity-100'} ${c.class}`}
                                            title={c.name}
                                        ></button>
                                    ))}
                                </div>
                            </div>

                            {/* Collective View Banner */}
                            <motion.div 
                                key={selectedDesign}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pt-4"
                            >
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center mb-4">ডিজাইনের সবগুলো কালার একনজরে:</p>
                                <div className="rounded overflow-hidden shadow-sm border-4 border-white aspect-[16/9] w-full max-w-md mx-auto bg-slate-100 dark:bg-[#09090B]">
                                    <img loading="lazy" 
                                        src={selectedDesign === 'lota' ? '/lota-all.jpg' : '/premium-hijab.jpg'} 
                                        alt="All Colors" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>
            {/* Full Gallery Section */}
            <section className="py-24 bg-[#0f172a]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white uppercase tracking-tighter">সবগুলো কালার ও ডিজাইন একনজরে</h2>
                        <p className="text-slate-400 font-bold">নিচ থেকে আপনার পছন্দেরটি বেছে নিন</p>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                        {designs.flatMap(d => colors?.map(c => ({ design: d, color: c.name })))?.map((item, idx) => (
                            <motion.div 
                                key={idx} 
                                whileHover={{ scale: 1.05 }}
                                onClick={() => {
                                    setSelectedDesign(item.design.id);
                                    setSelectedColor(item.color);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="group cursor-pointer"
                            >
                                <div className="relative rounded overflow-hidden shadow-sm border border-slate-200 border-2 border-white/10 aspect-[3/4]">
                                    <img loading="lazy" src={getImageUrl(item.design.id, item.color)} alt={`${item.color} ${item.design.name}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <p className="text-[10px] font-bold text-blue-400 uppercase">{item.design.name}</p>
                                        <p className="text-white font-bold text-xs">{item.color}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-center text-white/60 text-[10px] font-bold uppercase">{item.color}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-12 px-6 bg-slate-50 dark:bg-[#09090B]">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="text-center">
                        <h2 className="text-[#111827] dark:text-white text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">কাস্টমারদের মতামত</h2>
                        <p className="text-sm text-slate-500 dark:text-zinc-300">আমাদের হিজাব পড়ে কাস্টমাররা যা বলছেন</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: "সুমাইয়া আক্তার", text: "হিজাবটার কাপড় অনেক ভালো, একদম যেমনটা চেয়েছিলাম। ধন্যবাদ!", stars: 5, img: "/reviews/review1.jpg" },
                            { name: "ফারহানা রহমান", text: "অর্ডার করার ২ দিনের মধ্যেই পেয়ে গেছি। কালারটা খুব সুন্দর।", stars: 5, img: "/reviews/review2.jpg" },
                            { name: "নাসরিন সুলতানা", text: "এরকম প্রিমিয়াম হিজাব এই দামে পাবো ভাবিনি। খুবই আরামদায়ক।", stars: 5, img: "/reviews/review3.jpg" }
                        ]?.map((review, i) => (
                            <div key={i} className="bg-white p-4 rounded shadow-sm border border-slate-100 space-y-3 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="flex gap-1">
                                    {[...Array(review.stars)]?.map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-zinc-300 italic">"{review.text}"</p>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden dark:bg-[#09090B]">
                                        <img loading="lazy" src={review.img} alt={review.name} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-xs text-slate-800 dark:text-white">{review.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="products" className="py-24 bg-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-[#111827] dark:text-white text-xl md:text-6xl font-bold mb-6 tracking-tighter uppercase">আমাদের ৩টি বিশেষ সাইজ</h2>
                        <div className="w-24 h-3 bg-[#111827] hover:bg-[#1F2937] mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {hijabSizes?.map((size) => (
                            <motion.div key={size.id} whileHover={{ y: -15 }} className="bg-slate-50 p-10 rounded-lg border border-slate-100 flex flex-col text-center space-y-6 dark:bg-[#09090B]">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                    <ShoppingBag size={40} className="text-[#111827] dark:text-white" />
                                </div>
                                <h3 className="text-[#111827] dark:text-white text-xl font-bold">{size.label}</h3>
                                <p className="text-[#111827] dark:text-white text-xl font-bold text-[#111827] dark:text-white">৳ {size.price}</p>
                                <button
                                    onClick={() => {
                                        setSelectedSize(size.label);
                                        scrollToForm();
                                    }}
                                    className="bg-white text-slate-900 dark:text-white tracking-tight py-4 rounded font-bold uppercase tracking-widest border-2 border-slate-900 hover:bg-[#0f172a] hover:text-white transition-all dark:text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                >
                                    Select Size
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Order Modal */}
            <AnimatePresence>
                {showOrderModal && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
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

                            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">হিজাব অর্ডার ফর্ম</h3>
                            <p className="text-xs text-slate-500 text-center mb-6">নিচের ফর্মটি পূরণ করে অর্ডার নিশ্চিত করুন</p>

                            <form onSubmit={handleOrderSubmit} className="space-y-6">
                                {/* Options Selection */}
                                <div className="space-y-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                                    {/* Design Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">ডিজাইন নির্বাচন করুন:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {designs.map(d => (
                                                <button
                                                    type="button"
                                                    key={d.id}
                                                    onClick={() => setSelectedDesign(d.id)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedDesign === d.id ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    {d.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">কালার নির্বাচন করুন:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(c => (
                                                <button
                                                    type="button"
                                                    key={c.name}
                                                    onClick={() => setSelectedColor(c.name)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${selectedColor === c.name ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full ${c.class}`} />
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Size Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">হিজাবের সাইজ:</label>
                                        <select
                                            value={selectedSize}
                                            onChange={(e) => {
                                                const size = hijabSizes.find(s => s.label === e.target.value);
                                                if (size) setSelectedSize(size.label);
                                            }}
                                            className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:border-rose-600 outline-none text-sm font-bold text-slate-700 cursor-pointer"
                                        >
                                            {hijabSizes.map(size => (
                                                <option key={size.id} value={size.label}>
                                                    {size.label} - ৳{size.price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Delivery & Quantity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">ডেলিভারি এলাকা:</label>
                                        <div className="grid grid-cols-1 gap-2">
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
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">পরিমাণ (Quantity):</label>
                                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="font-bold text-lg">{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
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
                                        <span>পণ্য মূল্য ({quantity}টি):</span>
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
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">অর্ডার সফল হয়েছে!</h3>
                            <p className="text-sm text-slate-600">
                                ধন্যবাদ <span className="font-bold text-slate-900">{formData.name}</span>! আপনার হিজাব অর্ডারটি নিশ্চিত করা হয়েছে।
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
        </div>
    );
};

export default HijabCollection;
