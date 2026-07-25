import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderSubmit } from './hooks/useOrderSubmit';
import {
    ShoppingBag,
    Phone,
    CheckCircle2,
    Truck,
    ShieldCheck,
    Headphones,
    Sparkles,
    X,
    Star,
    Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_SHEET_URL, appConfig } from './config';
import { useCart } from './CartContext';

const ComboCollection = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const combos = [
        {
            id: 'ma-choto',
            title: 'মা ও ছোট মেয়ে কম্বো',
            subtitle: 'বয়স ২-৭ বছর (সাইজ ২০-২৮)',
            image: '/ma_choto_combo_real.png',
            priceNoHijab: 1690,
            priceWithHijab: 1890,
            oldPrice: 2360,
            badge: '🔥 মোস্ট পপুলার',
            description: 'মায়ের চেরি বোরকা + ছোট মেয়ের কিউট বোরকা এবং হিজাব সেট'
        },
        {
            id: 'ma-mejo',
            title: 'মা ও মেজো মেয়ে কম্বো',
            subtitle: 'বয়স ৭-১৪ বছর (সাইজ ৩০-৪০)',
            image: '/ma_mejo_combo_real.png',
            priceNoHijab: 1790,
            priceWithHijab: 1990,
            oldPrice: 2540,
            badge: '✨ নতুন অফার',
            description: 'স্কুল/মাদ্রাসাগামী মেয়ের সাথে মায়ের পারফেক্ট টুইনিং সেট'
        },
        {
            id: 'ma-boro',
            title: 'মা ও বড়মেয়ে কম্বো',
            subtitle: 'কিশোরী ও তরুণীদের জন্য',
            image: '/ma_boro_meye_black_latest.jpg',
            priceNoHijab: 1990,
            priceWithHijab: 2190,
            oldPrice: 2980,
            badge: '👑 প্রিমিয়াম চয়েস',
            description: 'মা ও তরুণী মেয়ের এলিগ্যান্ট ডাবল বোরকা সেট'
        },
        {
            id: 'trio-family',
            title: '৩ জনের ফ্যামিলি কম্বো (মা + মেজো + ছোট)',
            subtitle: 'পুরো ফ্যামিলির ৩টি সেট',
            image: '/trio_family_combo_real.png',
            priceNoHijab: 2490,
            priceWithHijab: 2990,
            oldPrice: 3890,
            badge: '💥 বেস্ট সেভার',
            description: 'মা, মেজো মেয়ে এবং ছোট মেয়ের সম্পূর্ণ কালার ম্যাচিং প্যাকেজ'
        },
        {
            id: 'grand-family',
            title: '৪ জনের গ্র্যান্ড ফ্যামিলি কম্বো (মা + ৩ মেয়ে)',
            subtitle: 'মা + ছোট মেয়ে + মেজো মেয়ে + বড়মেয়ে',
            image: '/trio_family_combo_real.png',
            priceNoHijab: 3290,
            priceWithHijab: 3890,
            oldPrice: 5200,
            badge: '👨‍👩‍👧‍👧 আলটিমেট প্যাকেজ',
            description: 'পুরো পরিবারের জন্য কালার ম্যাচিং সম্পূর্ণ বোরকা সেট — চার জনের একসাথে!'
        }
    ];

    const [selectedCombo, setSelectedCombo] = useState(combos[0]);
    const [selectedColor, setSelectedColor] = useState('কালো');
    const [withHijab, setWithHijab] = useState(true);
    const [maSize, setMaSize] = useState('৫৪');
    const [meyeSize, setMeyeSize] = useState('২৪');
    const [deliveryArea, setDeliveryArea] = useState('inside');
    const [showOrderModal, setShowOrderModal] = useState(false);


    const colors = ['কালো', 'নীল', 'অলিভ', 'মেরুন', 'কফি'];
    const maSizes = ['৫২', '৫৪', '৫৬'];
    const deliveryCharges = { inside: appConfig.deliveryDhaka, outside: appConfig.deliveryOutside };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const openOrderForCombo = (comboObj) => {
        setSelectedCombo(comboObj);
        setShowOrderModal(true);
    };

    const currentPrice = withHijab ? selectedCombo.priceWithHijab : selectedCombo.priceNoHijab;
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
            landingPage: 'Combo Collection',
            productType: `${selectedCombo.title} (${withHijab ? 'হিজাব সহ' : 'শুধুমাত্র বোরকা'})`,
            color: selectedColor,
            maSize,
            meyeSize,
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
                    onClick={() => openOrderForCombo(combos[0])}
                    className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold hover:bg-rose-700 transition-all shadow-md text-sm md:text-base flex items-center gap-2"
                >
                    <ShoppingBag size={18} /> কম্বো বুক করুন
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-6 max-w-7xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 max-w-3xl mx-auto"
                >
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold">
                        <Sparkles size={16} /> মা-মেয়ে এক্সক্লুসিভ কম্বো ফেস্ট
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                        মা ও মেয়েদের জন্য <span className="text-rose-600">ম্যাচিং টুইনিং কম্বো প্যাকেজ</span>
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base font-medium">
                        ছোট মেয়ে, মেজো মেয়ে কিংবা বড়মেয়ে — প্রতিটি বয়সের জন্য মায়ের সাথে আকর্ষণীয় ডিসকাউন্টে স্পেশাল সেট
                    </p>
                </motion.div>
            </section>

            {/* Combos Grid */}
            <section className="py-12 bg-white border-t border-rose-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {combos.map((combo) => (
                            <motion.div
                                key={combo.id}
                                whileHover={{ y: -6 }}
                                className="bg-[#FFFDF9] rounded-3xl overflow-hidden border border-rose-100 shadow-md hover:shadow-2xl transition-all flex flex-col md:flex-row"
                            >
                                <div className="md:w-1/2 aspect-[4/5] relative overflow-hidden bg-rose-50">
                                    <img loading="lazy" src={combo.image} alt={combo.title} className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                        {combo.badge}
                                    </div>
                                </div>
                                <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">{combo.subtitle}</span>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1 mb-2">{combo.title}</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">{combo.description}</p>
                                        
                                        <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-100 space-y-1">
                                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                <span>শুধু বোরকা কম্বো:</span>
                                                <span className="font-bold text-slate-900">৳{combo.priceNoHijab}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-rose-100">
                                                <span>হিজাব সহ পূর্ণাঙ্গ কম্বো:</span>
                                                <span className="text-lg font-black">৳{combo.priceWithHijab}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 line-through text-right">রেগুলার ৳{combo.oldPrice}</div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => openOrderForCombo(combo)}
                                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag size={18} /> কম্বো সিলেক্ট ও অর্ডার
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
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
                            className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-rose-100 my-8 relative max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">{selectedCombo.badge}</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedCombo.title}</h3>
                                <p className="text-xs text-slate-500">{selectedCombo.subtitle}</p>
                            </div>

                            <form onSubmit={handleOrderSubmit} className="space-y-6">
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

                                    {/* Daughter Size */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">মেয়ের সাইজ (Daughter Size):</label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCombo.id === 'ma-choto' && ['২০','২২','২৪','২৬','২৮'].map(s => (
                                                <button type="button" key={s} onClick={() => setMeyeSize(s)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${meyeSize === s ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}>{s}</button>
                                            ))}
                                            {selectedCombo.id === 'ma-mejo' && ['৩০','৩২','৩৪','৩৬','৩৮','৪০'].map(s => (
                                                <button type="button" key={s} onClick={() => setMeyeSize(s)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${meyeSize === s ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}>{s}</button>
                                            ))}
                                            {(selectedCombo.id === 'ma-boro' || selectedCombo.id === 'trio-family' || selectedCombo.id === 'grand-family') && ['৪২','৪৪','৪৬','৪৮','৫০','৫২'].map(s => (
                                                <button type="button" key={s} onClick={() => setMeyeSize(s)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${meyeSize === s ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'}`}>{s}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hijab toggle */}
                                    <div className="flex items-center justify-between pt-2 border-t border-rose-200/60">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">ম্যাচিং হিজাব সহ সেট নিবেন?</p>
                                            <p className="text-xs text-slate-500">সকলের জন্য হিজাব সহ স্পেশাল অফার</p>
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
                                ধন্যবাদ <span className="font-bold text-slate-900">{formData.name}</span>! আপনার {selectedCombo.title} এর অর্ডারটি নিশ্চিত করা হয়েছে।
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

export default ComboCollection;
