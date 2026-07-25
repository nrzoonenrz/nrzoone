import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ShoppingBag, ArrowRight, Menu, X, Star, CheckCircle2, Clock, ShieldCheck, Truck, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GOOGLE_SHEET_URL, appConfig } from './config';

const Home = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const comboItems = [
        {
            id: 'ma-choto',
            title: 'মা ও ছোট মেয়ে কম্বো',
            badge: '🔥 মোস্ট পপুলার',
            subtitle: 'বয়স ২-৭ বছর (সাইজ ২০-২৮)',
            description: 'মায়ের চেরি বোরকা + ছোট মেয়ের কিউট বোরকা এবং হিজাব সেট',
            priceNoHijab: 1690,
            priceWithHijab: 1890,
            oldPrice: 2360,
            image: '/ma_choto_combo_real.png'
        },
        {
            id: 'ma-mejo',
            title: 'মা ও মেজো মেয়ে কম্বো',
            badge: '✨ নতুন অফার',
            subtitle: 'বয়স ৭-১৪ বছর (সাইজ ৩০-৪০)',
            description: 'স্কুল/মাদ্রাসাগামী মেয়ের সাথে মায়ের পারফেক্ট টুইনিং সেট',
            priceNoHijab: 1790,
            priceWithHijab: 1990,
            oldPrice: 2540,
            image: '/ma_mejo_combo_real.png'
        },
        {
            id: 'ma-boro',
            title: 'মা ও বড়মেয়ে কম্বো',
            badge: '👑 প্রিমিয়াম চয়েস',
            subtitle: 'কিশোরী ও তরুণীদের জন্য',
            description: 'মা ও তরুণী মেয়ের এলিগ্যান্ট ডাবল বোরকা সেট',
            priceNoHijab: 1990,
            priceWithHijab: 2190,
            oldPrice: 2980,
            image: '/ma_boro_meye_black_latest.jpg'
        },
        {
            id: 'trio-family',
            title: '৩ জনের ফ্যামিলি কম্বো (মা + মেজো + ছোট)',
            badge: '💥 বেস্ট সেভার',
            subtitle: 'পুরো ফ্যামিলির ৩টি সেট',
            description: 'মা, মেজো মেয়ে এবং ছোট মেয়ের সম্পূর্ণ কালার ম্যাচিং প্যাকেজ',
            priceNoHijab: 2490,
            priceWithHijab: 2990,
            oldPrice: 3890,
            image: '/trio_family_combo_real.png'
        },
        {
            id: 'grand-family',
            title: '৪ জনের গ্র্যান্ড ফ্যামিলি কম্বো (মা + ৩ মেয়ে)',
            badge: '👨‍👩‍👧‍👧 আলটিমেট প্যাকেজ',
            subtitle: 'মা + ছোট মেয়ে + মেজো মেয়ে + বড়মেয়ে',
            description: 'পুরো পরিবারের জন্য কালার ম্যাচিং সম্পূর্ণ বোরকা সেট — চার জনের একসাথে!',
            priceNoHijab: 3290,
            priceWithHijab: 3890,
            oldPrice: 5200,
            image: '/trio_family_combo_real.png'
        }
    ];

    const [selectedCombo, setSelectedCombo] = useState(comboItems[0]);
    const [showComboModal, setShowComboModal] = useState(false);
    const [selectedColor, setSelectedColor] = useState('কালো');
    const [withHijab, setWithHijab] = useState(true);
    const [maSize, setMaSize] = useState('৫৪');
    const [meyeSize, setMeyeSize] = useState('২৪');
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const colors = ['কালো', 'নীল', 'অলিভ', 'মেরুন', 'কফি'];
    const maSizes = ['৫২', '৫৪', '৫৬'];
    const deliveryCharges = { inside: appConfig?.deliveryDhaka || 70, outside: appConfig?.deliveryOutside || 130 };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const openComboOrder = (item) => {
        setSelectedCombo(item);
        setShowComboModal(true);
    };

    const currentPrice = withHijab ? selectedCombo.priceWithHijab : selectedCombo.priceNoHijab;
    const currentTotal = currentPrice + deliveryCharges[deliveryArea];

    const handleComboOrderSubmit = async (e) => {
        e.preventDefault();

        let cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('88') && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.substring(2);
        }
        formData.phone = cleanPhone;

        if (cleanPhone.length !== 11) {
            alert('আপনার মোবাইল নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে!');
            return;
        }

        const orderData = {
            ...formData,
            sourceWebsite: 'NRZOONE.COM',
            landingPage: 'Home - Combo Section',
            productType: `${selectedCombo.title} (${withHijab ? 'হিজাব সহ' : 'শুধুমাত্র বোরকা'})`,
            color: selectedColor,
            maSize,
            meyeSize,
            price: currentPrice,
            deliveryCharge: deliveryCharges[deliveryArea],
            total: currentTotal,
            status: 'pending',
            date: new Date().toLocaleDateString('en-GB'),
            createdAt: serverTimestamp()
        };

        try {
            setIsSubmitting(true);
            setOrderSuccess(true);
            setShowComboModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmitting(false);

            if (db) {
                try {
                    await addDoc(collection(db, 'orders'), orderData);
                } catch (err) {
                    console.warn("Firestore error:", err);
                }
            }

            if (GOOGLE_SHEET_URL) {
                try {
                    fetch(GOOGLE_SHEET_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });
                } catch (err) {
                    console.warn("Sheet error:", err);
                }
            }
        } catch (error) {
            console.error('Order error:', error);
            setIsSubmitting(false);
            setOrderSuccess(true);
        }
    };

    const collections = [
        {
            id: 'chotomeye',
            serialNo: '০১',
            title: 'ছোট মেয়ে কালেকশন বোরকা ডিজাইন',
            ageTag: 'বয়স ২-৭ বছর (সাইজ ২০-২৮)',
            image: '/chotobon_olive.jpg', 
            badgeColor: 'bg-emerald-600',
            oldPrice: '৭৫০',
            price: '৫৫০',
            path: '/chotomeye',
        },
        {
            id: 'kids',
            serialNo: '০২',
            title: 'মেজো মেয়ে কালেকশন বোরকা ডিজাইন',
            ageTag: 'বয়স ৭-১৪ বছর (সাইজ ৩০-৪০)',
            image: '/mejo_meye_real.png', 
            badgeColor: 'bg-rose-700',
            oldPrice: '৮৯০',
            price: '৬৯০',
            path: '/kids',
        },
        {
            id: 'borobon',
            serialNo: '০৩',
            title: 'বড়মেয়ে কালেকশন বোরকা ডিজাইন',
            ageTag: 'কিশোরী ও তরুণীদের জন্য',
            image: '/boro_bon_blue.jpg',
            badgeColor: 'bg-blue-700',
            oldPrice: '১,২৯০',
            price: '৯৯০',
            path: '/borobon',
        },
        {
            id: 'ma',
            serialNo: '০৪',
            title: 'মা কালেকশন বোরকা ডিজাইন',
            ageTag: 'মায়েদের জন্য প্রিমিয়াম চেরি বোরকা',
            image: '/ma_maroon.jpg',
            badgeColor: 'bg-red-800',
            oldPrice: '১,৬৯০',
            price: '১,১৯০',
            path: '/ma',
        },
        {
            id: 'combo',
            serialNo: '০৫',
            title: 'মা-মেয়ে এক্সক্লুসিভ কম্বো ফেস্ট (সব কম্বো)',
            ageTag: 'মা + মেজো + ছোট মেয়ে স্পেশাল প্যাকেজ',
            image: '/ma_choto_combo_real.png',
            badgeColor: 'bg-indigo-700',
            oldPrice: '২,৩৬০',
            price: '১,৬৯০',
            path: '/combo',
        },
        {
            id: 'maboromeye',
            serialNo: '০৬',
            title: 'মা ও বড়মেয়ে কম্বো বোরকা',
            ageTag: 'মা ও বড়মেয়ের ডাবল সেট',
            image: '/ma_boro_meye_coffee_latest.jpg',
            badgeColor: 'bg-amber-800',
            oldPrice: '২,৯৮০',
            price: '১,৯৯০',
            path: '/maboromeye',
        },
        {
            id: 'hijab',
            serialNo: '০৭',
            title: 'প্রিমিয়াম হিজাব কালেকশন',
            ageTag: '৪০-৫০ ইঞ্চি প্রিমিয়াম হিজাব',
            image: '/premium-hijab.jpg', 
            oldPrice: '৪৫০',
            price: '২৫০',
            path: '/hijab',
        }
    ];

    return (
        <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#3A1212] overflow-x-hidden dark:text-white dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {/* Announcement Bar */}
            <div className="bg-red-600 text-white text-xs md:text-sm font-bold text-center py-2 px-4 uppercase tracking-widest animate-pulse">
                Flash Sale: Flat 20% Off + Free Delivery on all Pre-Orders!
            </div>
            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-[#F4F0EA] border-b border-[#3A1212]/20 flex items-center justify-between px-6 md:px-12 py-4 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                {/* Logo Area */}
                <div className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img loading="lazy" 
                        src="/logo.jpg" 
                        alt="NRZOONE Logo" 
                        className="h-16 md:h-24 lg:h-28 object-contain mix-blend-difference invert drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)]"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            document.getElementById('fallback-text-logo').style.display = 'block';
                        }}
                    />
                    <h1 id="fallback-text-logo" className="hidden text-[#3A1212] md:text-2xl md:text-3xl font-serif font-bold tracking-widest uppercase whitespace-nowrap">
                        NRZOONE
                    </h1>
                </div>

                {/* Center Nav Items */}
                <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
                    <button onClick={() => navigate('/classic')} className="hover:text-black transition-colors flex items-center gap-1 dark:text-white">BORKA</button>
                    <button onClick={() => navigate('/ma')} className="hover:text-black transition-colors flex items-center gap-1 dark:text-white">ABAYA</button>
                    <button onClick={() => navigate('/hijab')} className="hover:text-black transition-colors flex items-center gap-1 dark:text-white">HIJAB</button>
                    <button onClick={() => navigate('/track')} className="text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-full transition-all flex items-center gap-1 font-bold shadow-md shadow-red-500/30 animate-bounce">TRACK ORDER</button>
                </nav>

                {/* Right Icons */}
                <div className="flex items-center gap-4 md:gap-5">
                    <Search className="w-5 h-5 cursor-pointer hover:text-gray-500 transition hidden sm:block" />
                    <User className="w-5 h-5 cursor-pointer hover:text-gray-500 transition hidden sm:block" />
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5 cursor-pointer hover:text-gray-500 transition" />
                        <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            0
                        </span>
                    </div>
                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden ml-2 focus:outline-none">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    >
                        <nav className="flex flex-col px-6 py-4 gap-4 font-semibold text-sm">
                            <button onClick={() => { navigate('/classic'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">BORKA <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => { navigate('/ma'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">ABAYA <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => { navigate('/hijab'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">HIJAB <ArrowRight className="w-4 h-4" /></button>
                            <button onClick={() => { navigate('/kids'); setIsMobileMenuOpen(false); }} className="text-left py-2 hover:text-gray-500 border-b border-gray-50 flex items-center justify-between">KIDS COLLECTION <ArrowRight className="w-4 h-4" /></button>
                            <button className="text-left py-2 hover:text-gray-500">Store Locator</button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            

                        {/* Editorial Split Hero Section */}
            <section className="relative w-full bg-[#F4F0EA] min-h-screen pt-24 pb-12 flex items-center justify-center border-b border-[#3A1212]/20">
                <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    
                    {/* Left Column - Typography */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                        <p className="text-[#3A1212] tracking-[0.3em] uppercase text-sm font-semibold">THE</p>
                        <h1 className="text-5xl md:text-8xl font-serif text-[#3A1212] leading-[0.9] tracking-tighter">
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

                        <button 
                            onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })} 
                            className="px-12 py-5 mt-6 bg-[#3A1212] hover:bg-black text-[#F4F0EA] rounded-none font-serif text-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 uppercase tracking-widest border border-[#F4F0EA]"
                        >
                            Shop Collection
                        </button>
                    </div>

                    {/* Right Column - Arched Video */}
                    <div className="relative w-full max-w-md mx-auto flex justify-center mt-12 md:mt-0">
                        <div className="relative w-full aspect-[2/3] md:aspect-[3/4] rounded-t-full rounded-b-lg overflow-hidden border-8 border-[#F4F0EA] shadow-2xl bg-black">
                            <iframe 
                                src={"https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent("https://www.facebook.com/reel/1506415160808378") + "&show_text=0&t=0&autoplay=1&mute=1"}
                                className="w-[150%] h-[150%] -ml-[25%] -mt-[25%] object-cover scale-110 opacity-90"
                                style={{ pointerEvents: 'none' }}
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
                                allowFullScreen={true}
                            ></iframe>
                        </div>

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

            {/* Mother-Daughter Exclusive Combo Fest Section */}
            <section id="combo-section" className="py-16 bg-[#FAF7F2] border-t border-b border-rose-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 px-4 py-1.5 rounded-full text-xs font-bold mb-3">
                        <Sparkles size={14} /> মা-মেয়ে এক্সক্লুসিভ কম্বো ফেস্ট
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-3">মা ও মেয়েদের জন্য ম্যাচিং টুইনিং কম্বো প্যাকেজ</h2>
                    <p className="text-slate-600 font-medium max-w-2xl mx-auto text-sm md:text-base mb-12">
                        ছোট মেয়ে, মেজো মেয়ে কিংবা বড়মেয়ে — প্রতিটি বয়সের জন্য মায়ের সাথে আকর্ষণীয় ডিসকাউন্টে স্পেশাল সেট
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        {comboItems.map((combo) => (
                            <motion.div
                                key={combo.id}
                                whileHover={{ y: -6 }}
                                className="bg-white rounded-3xl overflow-hidden border border-rose-100 shadow-md hover:shadow-xl transition-all flex flex-col sm:flex-row"
                            >
                                <div className="sm:w-1/2 aspect-[4/5] relative overflow-hidden bg-rose-50">
                                    <img loading="lazy" src={combo.image} alt={combo.title} className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                        {combo.badge}
                                    </div>
                                </div>
                                <div className="sm:w-1/2 p-6 flex flex-col justify-between space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-rose-600 tracking-wider block mb-1">{combo.subtitle}</span>
                                        <h3 className="text-xl font-black text-slate-900 mb-2">{combo.title}</h3>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{combo.description}</p>
                                        
                                        <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>শুধু বোরকা কম্বো:</span>
                                                <span className="text-slate-900">৳ {combo.priceNoHijab}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-black text-rose-600 pt-1.5 border-t border-rose-200">
                                                <span>হিজাব সহ পূর্ণাঙ্গ কম্বো:</span>
                                                <span>৳ {combo.priceWithHijab}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 line-through text-right">রেগুলার ৳ {combo.oldPrice}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openComboOrder(combo)}
                                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={18} /> কম্বো সিলেক্ট ও অর্ডার
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Product Grid */}
            <div id="products-section"></div>
            <div className="max-w-7xl mx-auto px-6 text-center pt-8">
                <h2 className="text-2xl md:text-4xl font-serif text-[#3A1212] uppercase font-bold tracking-wider mb-2">🔥 Trending Right Now</h2>
                <p className="text-red-600 font-medium animate-pulse">Hurry! Limited Stock Available. Don't Miss Out!</p>
            </div>
            <section className="max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {collections?.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "100px" }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            className="group cursor-pointer flex flex-col"
                            onClick={() => navigate(item.path)}
                        >
                            {/* Image Container */}
                            <div className="w-full aspect-[3/4] overflow-hidden bg-[#F4F0EA] mb-4 relative rounded-2xl border border-[#3A1212]/10 shadow-md group-hover:shadow-xl transition-all">
                                {item.serialNo && (
                                    <div className="absolute top-3 left-3 z-10 bg-[#3A1212] text-[#F4F0EA] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md border border-white/20">
                                        {item.serialNo}
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 z-10 bg-rose-600 text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                                    -20% OFF
                                </div>
                                <img loading="lazy"
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                            </div>
                            
                            {/* Text Container */}
                            <div className="flex space-y-2 flex-col flex-1 text-left">
                                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-rose-600 transition-colors">
                                    {item.title}
                                </h3>
                                {item.ageTag && (
                                    <div className="inline-block">
                                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                            {item.ageTag}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-slate-400 text-xs line-through">
                                            ৳ {item.oldPrice}
                                        </span>
                                        <span className="text-slate-900 font-black text-lg">
                                            ৳ {item.price}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        অর্ডার করুন &rarr;
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Live Order Marquee */}
            <div className="w-full bg-[#3A1212] text-[#F4F0EA] py-3 overflow-hidden flex whitespace-nowrap border-y border-[#F4F0EA] shadow-md relative z-10 font-serif tracking-widest">
                <div className="animate-marquee flex gap-12 items-center font-bold text-sm tracking-wide">
                    <span>&diams; LIVE: সানজিদা (ঢাকা) এইমাত্র অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: নাফিসা (চট্টগ্রাম) কালো বোরকা অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: রহিমা বেগম (সিলেট) হিজাবসহ সেট অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: ফাতেমা (গাজীপুর) অলিভ বোরকা অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: আয়েশা (রাজশাহী) মেরুন বোরকা অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: সানজিদা (ঢাকা) এইমাত্র অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: নাফিসা (চট্টগ্রাম) কালো বোরকা অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: রহিমা বেগম (সিলেট) হিজাবসহ সেট অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: ফাতেমা (গাজীপুর) অলিভ বোরকা অর্ডার করেছেন</span>
                    <span className="text-[#F4F0EA]/50">|</span>
                    <span>&diams; LIVE: আয়েশা (রাজশাহী) মেরুন বোরকা অর্ডার করেছেন</span>
                </div>
            </div>

            {/* Customer Reviews Section */}
            <section className="max-w-[1600px] mx-auto px-4 md:px-12 py-10 md:py-16 bg-[#F4F0EA]">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-6xl font-serif text-[#3A1212] uppercase tracking-wider mb-4">
                        ✅ ৩০০০+ সন্তুষ্ট কাস্টমার
                    </h2>
                    <p className="text-xl md:text-2xl font-serif text-[#3A1212]/80 italic mb-2">তারা পেয়েছেন, আপনিও পাবেন!</p>
                    <p className="text-[#3A1212] uppercase tracking-widest text-xs">বাস্তব ক্রেতাদের অভিজ্ঞতা ও ছবি — কোনো নকল নয়</p>
                </div>
                
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                    {/* Priority People Images - Now at the Top */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_7.jpg" alt="Mother-Daughter Combo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_6.jpg" alt="Kids Borka Collection" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_4.jpg" alt="Kid Wearing Borka" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_5.jpg" alt="Baby Borka Review" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Review Card: Alisha Khan */}
                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-[#111827] dark:text-white rounded-full flex items-center justify-center font-bold text-xl">A</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">Alisha Khan <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">Facebook Review · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"আলহামদুলিল্লাহ! এর আগে একবার নিয়েছি আবার এই ডিজাইনটা নিলাম খুব সুন্দর হয়েছে ❤️ আপনাদের পেজ থেকে অনেক গুলো বোরকা নেওয়া হয়েছে। এর পরে নতুন ডিজাইন আসলে কিন্তু অফার দিবেন আমার জন্য 😎"</p>
                    </div>

                    {/* New Image 1: Alisha's Post */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_1.jpg" alt="Customer Review Post" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Review Card: Family Chat */}
                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">C</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">কাস্টমার রিভিউ <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">WhatsApp Chat · Verified Order</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"একথায় অসাধারণ 🤩 মানিয়েছে আমাদের মা, মেয়ে, শাশুড়ি, ননদ এর খুবই পছন্দ হয়েছে। ❤️"</p>
                    </div>

                    {/* Image: Product on Bed */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_3.jpg" alt="Product Quality" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* Image: Chat Screenshot */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_2.jpg" alt="Customer Chat Review" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* Existing Reviews and Images */}
                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-[#111827] dark:text-white rounded-full flex items-center justify-center font-bold text-xl">স</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">সানজিদা আক্তার <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">মিরপুর, ঢাকা · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded dark:text-white">✅ ব্লু + ব্ল্যাক কম্বো</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"আলহামদুলিল্লাহ! যেমনটা ছবিতে দেখেছি ঠিক তেমনই পেয়েছি। কাপড় অনেক সফট, স্টোন কাজ অসাধারণ! পরের বার আবার নেবো।"</p>
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid">
                        <img src="/reviews/media__1778274732225.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-xl">ন</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">নাসরিন বেগম <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">গাজীপুর · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded dark:text-white">✅ ব্লু স্টোন বোরকা — ফ্রন্ট</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"ছবির চেয়ে আরও সুন্দর পেয়েছি হাতে! কাপড় প্রিমিয়াম, স্টোনের কাজ অনেক সূক্ষ্ম। ১০০% রেকমেন্ড করবো।"</p>
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid">
                        <img src="/reviews/media__1778274754641.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">ফ</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">ফারহানা আফরোজ <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">চট্টগ্রাম · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded dark:text-white">✅ ব্লু বোরকা — ব্যাক ডিটেইল</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"ব্যাক ডিজাইনটা দেখে মুগ্ধ হয়ে গেছি! পরিবারের সবাই দেখে পছন্দ করলেন। ইনশাআল্লাহ আবার নেবো।"</p>
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid">
                        <img src="/reviews/media__1778274790842.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">R</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">রহিমা বেগম <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">সিলেট · Verified Customer</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"একথায় অসাধারণ। মা, মেয়ে, শাশুড়ি, ননদ — সবার পছন্দ হয়েছে। এই দামে এত কোয়ালিটি পাবো ভাবিনি! ❤️"</p>
                    </div>

                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid">
                        <img src="/reviews/media__1778274790970.jpg" alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-slate-800 dark:text-white rounded-full flex items-center justify-center font-bold text-xl">স</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">সুমাইয়া ইসলাম <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">কুমিল্লা · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded dark:text-white">✅ হায়া সিরিজ বোরকা</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"কাপড়ের কোয়ালিটি নিয়ে একটু ভয়ে ছিলাম, কিন্তু হাতে পাওয়ার পর জাস্ট ওয়াও! এত সফট এবং কমফোর্টেবল যা বলার বাইরে। ডেলিভারিও অনেক ফাস্ট ছিল।"</p>
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold text-xl">ত</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">তাসনিম জারা <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">খুলনা · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded dark:text-white">✅ মা-মেয়ে স্পেশাল কম্বো</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"আমার মেয়ের জন্য আর আমার জন্য নিয়েছিলাম। দুজনকে একসাথে অনেক কিউট লাগছিল। সবাই জিজ্ঞেস করছিল কোথা থেকে নিয়েছি। ধন্যবাদ NRZOONE কে!"</p>
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-xl">জ</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">জান্নাতুল ফেরদৌস <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">বরিশাল · Verified Purchase</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 mb-2 bg-gray-100 inline-block px-2 py-1 rounded dark:text-white">✅ প্রিমিয়াম হিজাব কালেকশন</p>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"হিজাবগুলোর কালার একদম ছবির মতোই ব্রাইট। এবং পরতেও অনেক আরামদায়ক। প্রাইস অনুযায়ী বেস্ট কোয়ালিটি!"</p>
                    </div>
                    {/* New Review Card: Family Chat */}
                    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 border border-gray-100 break-inside-avoid dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">C</div>
                            <div>
                                <h4 className="font-bold flex items-center gap-1 text-gray-900 dark:text-white">কাস্টমার রিভিউ <CheckCircle2 size={16} className="text-green-500" /></h4>
                                <p className="text-xs text-gray-500">WhatsApp Chat · Verified Order</p>
                            </div>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            <Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" /><Star size={14} className="fill-current" />
                        </div>
                        <p className="text-gray-700 text-sm italic leading-relaxed mt-2 dark:text-zinc-300">"একথায় অসাধারণ 🤩 মানিয়েছে আমাদের মা, মেয়ে, শাশুড়ি, ননদ এর খুবই পছন্দ হয়েছে। ❤️"</p>
                    </div>

                    {/* New Image 2: Chat Screenshot */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_2.jpg" alt="Customer Chat Review" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Image 3: Product on Bed */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_3.jpg" alt="Product Quality" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Image 4: Kid in Field */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_4.jpg" alt="Kid Wearing Borka" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Image 5: Baby on Bed */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_5.jpg" alt="Baby Borka Review" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Image 6: Two Kids Peace Sign */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_6.jpg" alt="Kids Borka Collection" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* New Image 7: Mother and Kid */}
                    <div className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                        <img src="/reviews/new_review_7.jpg" alt="Mother-Daughter Combo" className="w-full h-auto object-cover" loading="lazy" />
                    </div>

                    {/* Extra Images for padding out the masonry */}
                    {[
                        "/reviews/media__1778274732436.jpg",
                        "/reviews/media__1778274754541.jpg",
                        "/reviews/media__1778274754654.jpg",
                        "/reviews/media__1778274790928.jpg",
                    ]?.map((src, index) => (
                        <div key={index} className="rounded overflow-hidden shadow-sm border border-slate-200 break-inside-avoid hover:scale-[1.02] transition-transform duration-300">
                            <img src={src} alt="Customer Photo" className="w-full h-auto object-cover" loading="lazy" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Urgency & Call to Action Footer Section */}
            <section className="w-full bg-black text-white py-10 md:py-16 px-6 text-center border-t-4 border-red-600">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xl mb-4 animate-pulse">
                        <Clock size={24} /> ⚡ আজকের অফার সীমিত!
                    </div>
                    <p className="text-[#111827] dark:text-white text-xl md:text-3xl font-bold mb-2 text-white">
                        এই মুহূর্তে <span className="bg-red-600 px-3 py-1 rounded-md shadow-sm border border-slate-200 text-white mx-1">৪৭+ জন</span> এই পেজে আছেন
                    </p>
                    <p className="text-gray-400 mb-10 font-medium text-lg">স্টক শেষ হওয়ার আগেই আপনার অর্ডার দিন</p>
                    
                    <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-red-600 text-white px-10 py-5 rounded-full font-bold text-xl md:text-[#111827] dark:text-white text-xl hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 flex items-center justify-center gap-3 mx-auto w-full md:w-auto">
                        <ShoppingBag size={28} /> 🛍️ এখনই অর্ডার দিন
                    </button>
                    
                    <div className="flex flex-wrap justify-center items-center gap-6 mt-10 text-sm text-gray-300 font-medium bg-[#111] py-4 px-6 rounded">
                        <span className="flex items-center gap-2"><Truck size={18} className="text-green-400" /> ক্যাশ অন ডেলিভারি</span>
                        <span className="flex items-center gap-2 text-gray-500">|</span>
                        <span className="flex items-center gap-2"><RefreshCw size={18} className="text-blue-400" /> ফ্রি রিটার্ন</span>
                        <span className="flex items-center gap-2 text-gray-500">|</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-yellow-400" /> ১০০% অরিজিনাল</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-10 px-6 bg-[#111] border-t border-gray-800 text-gray-500 flex flex-col items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-4 mb-2">
                    <img loading="lazy" 
                        src="/logo.jpg" 
                        alt="NRZOONE Footer Logo" 
                        className="h-16 md:h-20 object-contain invert opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                <p className="font-bold text-gray-400">© 2019 NRZOONE | All Rights Reserved</p>
                <div className="flex gap-6 mt-2">
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </div>
            </footer>

            {/* Combo Order Modal */}
            <AnimatePresence>
                {showComboModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-rose-100 my-8 relative max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowComboModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">{selectedCombo.badge}</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedCombo.title}</h3>
                                <p className="text-xs text-slate-500">{selectedCombo.subtitle}</p>
                            </div>

                            <form onSubmit={handleComboOrderSubmit} className="space-y-6">
                                <div className="space-y-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                                    {/* Color Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">কালার নির্বাচন করুন:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(c => (
                                                <button
                                                    type="button"
                                                    key={c}
                                                    onClick={() => setSelectedColor(c)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedColor === c ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ma Size */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">মায়ের সাইজ (Ma Size):</label>
                                        <div className="flex gap-2">
                                            {maSizes.map(s => (
                                                <button
                                                    type="button"
                                                    key={s}
                                                    onClick={() => setMaSize(s)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${maSize === s ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hijab toggle */}
                                    <div className="flex items-center justify-between pt-2 border-t border-rose-200/60">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">ম্যাচিং হিজাব সহ সেট নিবেন?</p>
                                            <p className="text-xs text-slate-500">সকলের জন্য হিজাব সহ স্পেশাল কম্বো অফার</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setWithHijab(!withHijab)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${withHijab ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                                        >
                                            {withHijab ? 'হ্যাঁ (হিজাব সহ ৳' + selectedCombo.priceWithHijab + ')' : 'না (শুধু বোরকা ৳' + selectedCombo.priceNoHijab + ')'}
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

                                {/* Form Fields */}
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

                                {/* Total Summary */}
                                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>কম্বো মূল্য:</span>
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
                                    {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'কম্বো অর্ডার কনফার্ম করুন'}
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
                            <h3 className="text-2xl font-black text-slate-900">কম্বো অর্ডার সফল হয়েছে!</h3>
                            <p className="text-sm text-slate-600">
                                ধন্যবাদ <span className="font-bold text-slate-900">{formData.name}</span>! আপনার {selectedCombo.title} এর অর্ডারটি গ্রহণ করা হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনাকে কল করবেন।
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

export default Home;
