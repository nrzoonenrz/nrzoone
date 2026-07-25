import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const OrderTracking = () => {
    const [phone, setPhone] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const phoneParam = params.get('phone');
        if (phoneParam) {
            setPhone(phoneParam);
            performSearch(phoneParam);
        }
    }, [location]);

    const performSearch = async (searchPhone) => {
        if (!searchPhone || searchPhone.length < 11) {
            setError("সঠিক ১১ ডিজিটের ফোন নাম্বার দিন");
            return;
        }

        setLoading(true);
        setError("");
        setHasSearched(true);
        setOrders([]);

        try {
            const q = query(collection(db, "orders"), where("phone", "==", searchPhone));
            const querySnapshot = await getDocs(q);
            
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });

            results.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
            
            setOrders(results);
        } catch (err) {
            console.error(err);
            setError("অর্ডার খুঁজতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(phone);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "Pending": return <Clock className="text-yellow-500" />;
            case "Processing": return <Package className="text-indigo-500" />;
            case "Shipped": return <Truck className="text-purple-500" />;
            case "Delivered": return <CheckCircle className="text-green-500" />;
            default: return <Clock className="text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Processing": return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 border-indigo-200 dark:border-indigo-500/30";
            case "Shipped": return "bg-purple-100 text-purple-700 border-purple-200";
            case "Delivered": return "bg-green-100 dark:bg-green-900/30 text-green-700 border-green-200 dark:border-green-500/30";
            default: return "bg-slate-100 text-slate-700 dark:text-white border-slate-200";
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "অজানা";
        return timestamp.toDate().toLocaleDateString("bn-BD", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="min-h-screen bg-light-bg font-bengali text-light-text py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-light-purple tracking-tight text-slate-900 dark:text-white">অর্ডার ট্র্যাকিং</h1>
                    <p className="text-light-textMuted font-medium">আপনার ফোন নাম্বার দিয়ে অর্ডারের বর্তমান অবস্থা জানুন</p>
                </div>

                <div className="bg-light-bg p-8 rounded-3xl shadow-neu-flat">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="tel"
                            placeholder="আপনার ফোন নাম্বার দিন (যেমন: 017...)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="flex-1 px-6 py-4 bg-light-bg rounded-2xl outline-none font-bold text-light-text shadow-neu-pressed focus:shadow-[inset_2px_2px_5px_#b8bcc2,inset_-2px_-2px_5px_#ffffff] transition-all text-lg border-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-4 bg-light-bg text-light-purple font-black rounded-2xl flex items-center justify-center gap-2 shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Search size={20} />
                                    অর্ডার খুঁজুন
                                </>
                            )}
                        </button>
                    </form>
                    {error && <p className="mt-4 text-red-500 font-medium text-center">{error}</p>}
                </div>

                <AnimatePresence>
                    {hasSearched && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {orders.length === 0 ? (
                                <div className="bg-white p-12 rounded-lg shadow-sm border border-slate-100 text-center space-y-4 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto dark:bg-[#09090B]">
                                        <Package className="text-slate-400" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">কোনো অর্ডার পাওয়া যায়নি</h3>
                                        <p className="text-slate-500 dark:text-zinc-300">এই ফোন নাম্বার দিয়ে কোনো অর্ডার করা হয়নি</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight px-2 dark:text-white">আপনার অর্ডারসমূহ ({orders.length})</h3>
                                    {orders?.map((order) => (
                                        <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6 dark:bg-white/[0.04] dark:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-6">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-400">অর্ডার আইডি</p>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">#{order.orderId || order.id.slice(0, 8)}</p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 w-fit ${getStatusColor(order.status || "Pending")}`}>
                                                    {getStatusIcon(order.status || "Pending")}
                                                    <span className="font-bold">{order.status || "Pending"}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-400">প্রোডাক্ট</p>
                                                    <p className="font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{order.productType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-400">রং ও সাইজ</p>
                                                    <p className="font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{order.color}, {order.size}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-400">পরিমাণ</p>
                                                    <p className="font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{order.quantity} টি</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-400">মোট বিল</p>
                                                    <p className="font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">৳{order.total}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                                <p className="text-sm text-slate-500 dark:text-zinc-300 font-medium">অর্ডার সময়: {formatDate(order.createdAt)}</p>
                                                {order.sourceWebsite && (
                                                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 dark:text-zinc-300 rounded-lg dark:bg-[#09090B]">
                                                        From {order.sourceWebsite}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OrderTracking;
