import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Phone, MapPin, CheckCircle, ArrowRight, ShieldCheck, Truck, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderSubmit } from './hooks/useOrderSubmit';

const MaCollection = () => {
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState('50');
    const [selectedColor, setSelectedColor] = useState('Black');
    const [quantity, setQuantity] = useState(1);

    const [showOrderModal, setShowOrderModal] = useState(false);
    const [withHijab, setWithHijab] = useState(false);
    const [deliveryArea, setDeliveryArea] = useState('inside');

    const deliveryCharges = {
        inside: 70,
        outside: 130
    };

    const currentPrice = withHijab ? 1680 : 1190;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    const colors = [
        { name: 'Black', code: '#000000' },
        { name: 'Maroon', code: '#800000' },
        { name: 'Navy', code: '#000080' },
        { name: 'Bottle Green', code: '#006a4e' },
        { name: 'Coffee', code: '#4b3621' }
    ];

    const colorImages = {
        'Black': '/ma_cherry_black.png',
        'Maroon': '/ma_cherry_maroon.jpg',
        'Navy': '/ma_cherry_blue.jpg',
        'Bottle Green': '/ma_cherry_olive.png',
        'Coffee': '/ma_cherry_coffee.png'
    };

    const { submitOrder, isSubmitting, orderSuccess, setOrderSuccess } = useOrderSubmit({
        onSuccess: () => {
            setShowOrderModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
            alert('দুঃখিত, অর্ডারটি সম্পন্ন করতে সমস্যা হচ্ছে। অনুগ্রহ করে ফোন করে অর্ডার দিন।');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const currentOrderData = {
            orderId: "NRZ-" + Date.now().toString().slice(-6),
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            productType: "Ma Collection",
            productName: "Ma Collection Borka",
            color: selectedColor,
            size: selectedSize,
            quantity: Number(quantity),
            total: currentTotal,
            withHijab: withHijab,
            deliveryArea: deliveryArea,
            landingPage: "Ma Collection",
            sourceWebsite: 'NRZOONE.COM'
        };

        await submitOrder(currentOrderData);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2D2D2D] overflow-x-hidden">
            {/* Header / Navigation */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#E8E1D5] py-4 px-6 md:px-12 flex items-center justify-between dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img loading="lazy" src="/logo.jpg" alt="Logo" className="h-10 md:h-14 mix-blend-multiply" />
                    <span className="text-xl md:text-[#111827] dark:text-white text-xl font-bold tracking-tighter text-[#1A1A1A]">NRZOONE</span>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="text-sm font-bold bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full hover:bg-black transition-all flex items-center gap-2"
                >
                    অন্যান্য কালেকশন <ArrowRight size={16} />
                </button>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-start">
                    
                    {/* Left: Visual Content */}
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative group rounded-lg overflow-hidden border-4 border-white shadow-sm"
                        >
                            <img loading="lazy" 
                                src={colorImages[selectedColor] || '/ma_cherry_black.png'} 
                                alt={`Ma Collection Borka - ${selectedColor}`} 
                                className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            

                            <div className="absolute top-6 left-6 flex flex-col gap-3">
                                <span className="bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">Best Seller</span>
                                <span className="bg-[#D4AF37] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">Premium Cherry</span>
                            </div>
                        </motion.div>
                        
                        {/* Benefits Icons */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded text-center shadow-sm border border-[#E8E1D5] dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <ShieldCheck className="mx-auto text-[#D4AF37] mb-2" size={24} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">অরিজিনাল চেরি</span>
                            </div>
                            <div className="bg-white p-4 rounded text-center shadow-sm border border-[#E8E1D5] dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <Truck className="mx-auto text-[#D4AF37] mb-2" size={24} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">সারা দেশে ডেলিভারি</span>
                            </div>
                            <div className="bg-white p-4 rounded text-center shadow-sm border border-[#E8E1D5] dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <Star className="mx-auto text-[#D4AF37] mb-2" size={24} />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">প্রিমিয়াম কোয়ালিটি</span>
                            </div>
                        </div>

                        {/* Vertical Image Gallery (Landing Page Style) */}
                        <div className="space-y-6 mt-8">
                            <h4 className="text-xl font-bold text-center uppercase tracking-widest text-[#1A1A1A] mb-8 text-slate-900 dark:text-white">
                                <span className="bg-[#1A1A1A] text-white px-6 py-2 rounded-full">আমাদের সবকটি কালার দেখুন</span>
                            </h4>
                            {Object.entries(colorImages)?.map(([color, img]) => (
                                <motion.div 
                                    key={color}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="relative group rounded-lg overflow-hidden border-4 border-white shadow-sm"
                                >
                                    <img loading="lazy" 
                                        src={img} 
                                        alt={`Ma Collection Borka - ${color}`} 
                                        className="w-full aspect-[4/5] object-cover"
                                    />
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                        <button 
                                            onClick={() => {
                                                setSelectedColor(color);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="bg-white/90 backdrop-blur-md text-black px-8 py-3 rounded font-bold text-sm shadow-sm border border-white hover:bg-black hover:text-white transition-all dark:text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                        >
                                            {color} কালারটি কিনুন
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Customer Reviews Section */}
                        <div className="mt-16 bg-white p-8 rounded-lg shadow-sm border border-[#E8E1D5] dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <div className="text-center mb-10">
                                <h4 className="text-[#111827] dark:text-white text-xl font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">আমাদের কাস্টমার রিভিউ</h4>
                                <div className="flex justify-center gap-1 text-[#D4AF37]">
                                    {[...Array(5)]?.map((_, i) => <Star key={i} fill="#D4AF37" size={20} />)}
                                </div>
                                <p className="text-gray-400 text-sm mt-2">৫০০+ এর বেশি কাস্টমার আমাদের ড্রেস পছন্দ করেছেন</p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { name: "সামিয়া আক্তার", comment: "বোরকাটির কাপড় অনেক সফট এবং ডিজাইনটি একদম ইউনিক। মা কালেকশন সত্যি প্রিমিয়াম!", date: "২ দিন আগে" },
                                    { name: "ফারিয়া ইসলাম", comment: "হিজাবসহ সেটটি অনেক সাশ্রয়ী মনে হয়েছে। কালারটা একদম ছবির মতোই সুন্দর।", date: "৫ দিন আগে" },
                                    { name: "নুসরাত জাহান", comment: "ডেলিভারি অনেক ফাস্ট ছিল। কোয়ালিটি নিয়ে কোনো সন্দেহ নেই। ধন্যবাদ NRZOONE!", date: "১ সপ্তাহ আগে" }
                                ]?.map((review, idx) => (
                                    <div key={idx} className="p-6 rounded bg-gray-50 border border-gray-100 flex flex-col gap-3 dark:bg-[#09090B]">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-[#1A1A1A]">{review.name}</span>
                                            <span className="text-[10px] text-gray-400">{review.date}</span>
                                        </div>
                                        <div className="flex gap-1 text-[#D4AF37]">
                                            {[...Array(5)]?.map((_, i) => <Star key={i} fill="#D4AF37" size={12} />)}
                                        </div>
                                        <p className="text-sm text-gray-600 italic dark:text-zinc-300">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 text-center">
                                <button className="bg-[#1A1A1A] text-white px-8 py-4 rounded font-bold text-sm hover:scale-105 transition-all shadow-sm">
                                    আরও ৫৭০টি রিভিউ দেখুন
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Details & Order Form */}
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h1 className="text-[#111827] dark:text-white text-xl md:text-6xl font-bold text-[#1A1A1A] leading-[1.1] tracking-tighter">
                                মা কালেকশন <br/> 
                                <span className="text-[#D4AF37]">প্রিমিয়াম বোরকা</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                                দুবাই থেকে আমদানিকৃত ১০০% অরিজিনাল চেরি জর্জেট ফেব্রিক দিয়ে তৈরি। মডেস্টি এবং আভিজাত্যের এক অনন্য মেলবন্ধন।
                            </p>
                            
                            <div className="py-2">
                                <div className="bg-gray-50 border border-[#E8E1D5] rounded-xl p-4 md:p-5 space-y-2 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                    <div className="flex justify-between items-center text-sm md:text-base">
                                        <span className="text-gray-500 font-bold uppercase tracking-wider">শুধু বোরকা:</span>
                                        <span className="font-bold text-[#1A1A1A] dark:text-white">৳ ১,১৯০</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base border-t border-gray-200 pt-2 dark:border-white/10">
                                        <span className="text-gray-500 font-bold uppercase tracking-wider">বোরকা + হিজাব কম্বো:</span>
                                        <span className="font-black text-[#D4AF37] text-lg md:text-xl">৳ ১,৬৮০</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-400 pt-1">
                                        <span>(ম্যাচিং হিজাব: +৳৪৯০)</span>
                                        <span className="line-through text-red-400">রেগুলার ৳১,৬৯০</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-[#111827] dark:text-white text-3xl md:text-4xl font-black text-[#1A1A1A]">
                                        ৳{selectedSize === 'বোরকা + হিজাব (Combo)' ? '১,৬৮০' : '১,১৯০'}
                                    </div>
                                    <div className="bg-[#FFF4E5] text-[#D4AF37] px-4 py-2 rounded-xl font-bold text-sm md:text-base animate-pulse">
                                         স্পেশাল অফার!
                                    </div>
                                </div>
                            </div>

                            {/* Video Review Section */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border border-pink-100 mb-8 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 dark:text-white">
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                                    রিয়েল ভিডিও রিভিউ দেখুন
                                </h4>
                                <div className="aspect-video rounded overflow-hidden bg-black relative group">
                                    <iframe 
                                        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent('https://www.facebook.com/facebook/videos/835249912617282/')}&show_text=0&width=560`} 
                                        className="absolute inset-0 w-full h-full border-0"
                                        allowFullScreen={true}
                                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    ></iframe>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-3 text-center italic">ভিডিওতে বোরকাটির মান এবং কাপড় ভালো করে দেখে নিন</p>
                            </div>
                        </div>

                        {/* Customization Options */}
                        <div className="space-y-8 bg-white p-6 md:p-10 rounded-[40px] shadow-sm border border-[#E8E1D5] dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            {/* Color Selector */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">পছন্দের কালার সিলেক্ট করুন</label>
                                <div className="flex flex-wrap gap-4">
                                    {colors?.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setSelectedColor(color.name)}
                                            className={`group relative flex flex-col items-center gap-2 p-2 rounded transition-all ${
                                                selectedColor === color.name ? 'bg-gray-50 scale-105' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div 
                                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 shadow-inner transition-all ${
                                                    selectedColor === color.name ? 'border-[#1A1A1A] scale-110' : 'border-white'
                                                }`}
                                                style={{ backgroundColor: color.code }}
                                            />
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${selectedColor === color.name ? 'text-black' : 'text-gray-400'}`}>
                                                {color.name}
                                            </span>
                                            {selectedColor === color.name && (
                                                <div className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white rounded-full p-1 shadow-sm border border-slate-200">
                                                    <CheckCircle size={10} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Selector */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">সাইজ নির্বাচন করুন</label>
                                <select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    className="w-full p-4 rounded bg-gray-50 border-2 border-transparent focus:border-black outline-none transition-all font-bold text-lg cursor-pointer appearance-none dark:bg-[#09090B]"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                                >
                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="" disabled>সাইজ সিলেক্ট করুন</option>
                                    {['50', '52', '54', '56', 'বোরকা + হিজাব (Combo)']?.map((size) => (
                                        <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Order Button */}
                            <div className="pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => setShowOrderModal(true)}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-5 rounded-2xl text-xl shadow-lg transition-all animate-pulse"
                                >
                                    অর্ডার করতে ক্লিক করুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

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

                            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">মা কালেকশন অর্ডার ফর্ম</h3>
                            <p className="text-xs text-slate-500 text-center mb-6">নিচের ফর্মটি পূরণ করে অর্ডার নিশ্চিত করুন</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                        <label className="block text-xs font-bold text-slate-700 mb-2">মায়ের সাইজ (Ma Size):</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['50', '52', '54', '56'].map(s => (
                                                <button
                                                    type="button"
                                                    key={s}
                                                    onClick={() => setSelectedSize(s)}
                                                    className={`w-12 h-10 rounded-xl text-xs font-bold transition-all ${selectedSize === s ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
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
                                            <p className="text-xs text-slate-500">হিজাব মূল্য: ৳৪৯০</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setWithHijab(!withHijab)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${withHijab ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                        >
                                            {withHijab ? 'হ্যাঁ (হিজাব সহ ৳১৬৮০)' : 'না (শুধু বোরকা ৳১১৯০)'}
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
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">অর্ডার সফল হয়েছে!</h3>
                            <p className="text-sm text-slate-600">
                                ধন্যবাদ <span className="font-bold text-slate-900">{formData.name}</span>! আপনার মা কালেকশনের অর্ডারটি নিশ্চিত করা হয়েছে।
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

export default MaCollection;
