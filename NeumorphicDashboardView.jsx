import React, { useMemo, useState } from 'react';
import {
    ArrowUpCircle, TrendingDown, Wallet, Clock, Package, CheckCircle,
    Truck, ShoppingBag, RefreshCw, AlertTriangle, PlusCircle, ClipboardList,
    BarChart2, Zap, DollarSign, TrendingUp, XCircle, Eye, Star, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

const NeumorphicDashboardView = ({ orders, expenses, products, userRole, setActiveTab }) => {
    const allProducts = products || [];

    // ── 1. Financial & Margin Calculations ──────────────────────
    const deliveredOrders = useMemo(() => {
        return orders?.filter(o => o.status === 'delivered' || o.courierStatus?.includes('পেমেন্ট') || o.courierStatus?.includes('ডেলিভারি'));
    }, [orders]);

    const totalCOD = useMemo(() => {
        return deliveredOrders?.reduce((a, o) => a + (o.total || 0), 0);
    }, [deliveredOrders]);

    const totalDeliveryCharge = useMemo(() => {
        return deliveredOrders?.reduce((a, o) => a + (o.deliveryCharge || 0), 0);
    }, [deliveredOrders]);

    const totalReturnCharge = useMemo(() => {
        return orders
            ?.filter(o => o.courierStatus?.includes('রিটার্ন'))
            ?.reduce((a, o) => a + (o.returnCharge || 120), 0);
    }, [orders]);

    const totalLoss = useMemo(() => {
        return orders
            ?.filter(o => o.courierStatus?.includes('হারিয়ে'))
            ?.reduce((a, o) => a + (o.total || 0), 0);
    }, [orders]);

    const totalExpenses = useMemo(() => {
        return expenses?.reduce((a, e) => a + (parseInt(e.amount) || 0), 0);
    }, [expenses]);

    // Product Production Costs for delivered orders
    const totalProductCost = useMemo(() => {
        return deliveredOrders?.reduce((acc, o) => {
            const prod = allProducts.find(p => p.firebaseId === o.selectedProductId || p.name === o.productName);
            const cost = prod?.costPrice || 800; // Fallback default cost is 800
            return acc + cost;
        }, 0);
    }, [deliveredOrders, allProducts]);

    // Net profit = COD Revenue - Delivery Charges - Return Charges - Total Expenses - Total Product Costs - Loss of lost items
    const netIncome = totalCOD - totalDeliveryCharge - totalReturnCharge - totalExpenses - totalProductCost - totalLoss;
    const marginPercent = totalCOD > 0 ? Math.round((netIncome / totalCOD) * 100) : 0;

    // ── 2. Order Status Counts ──────────────────────────────────
    const countByStatus = (status) => orders?.filter(o => o.status === status).length;
    const countByCourier = (keyword) => orders?.filter(o => o.courierStatus?.includes(keyword)).length;

    const processing   = countByCourier('প্রসেসিং') + countByStatus('confirmed');
    const inTransit    = countByCourier('কুরিয়ারে') + countByStatus('shipped');
    const delivered    = countByCourier('ডেলিভারি') + countByStatus('delivered');
    const returned     = countByCourier('রিটার্ন');
    const lost         = countByCourier('হারিয়ে');
    const failedDel    = countByCourier('ফেইল');
    const payReceived  = countByCourier('পেমেন্ট');
    const newOrders    = countByStatus('pending');
    const cancelled    = countByStatus('cancelled');

    // ── 3. Stock Status Counters ──
    const liveProducts = allProducts?.filter(p => p.stock === 'available' && (p.stockCount || 0) > 20).length;
    const lowProducts  = allProducts?.filter(p => p.stock === 'available' && (p.stockCount || 0) > 0 && (p.stockCount || 0) <= 20).length;
    const outProducts  = allProducts?.filter(p => p.stock === 'out_of_stock' || (p.stockCount || 0) === 0).length;
    const lowStockList = allProducts?.filter(p => p.stock === 'available' && (p.stockCount || 0) <= 20 && (p.stockCount || 0) > 0).slice(0, 5);

    // ── 4. Today Stats ──
    const todayStr = new Date().toLocaleDateString('en-GB');
    const todayOrders  = orders?.filter(o => o.date === todayStr).length;
    const todayRevenue = orders?.filter(o => o.date === todayStr && o.status === 'delivered')?.reduce((a, o) => a + (o.total || 0), 0);

    // ── 5. AI Actionable Alerts Generation ──────────────────────
    const aiAlerts = useMemo(() => {
        const alerts = [];
        
        // Low stock alerts
        allProducts.forEach(p => {
            if ((p.stockCount || 0) <= 10 && p.stock === 'available') {
                alerts.push({
                    type: 'warning',
                    text: `লো স্টক সতর্কতা: "${p.name}" এর স্টক মাত্র ${p.stockCount || 0} পিস বাকি! এখনই রিস্টক করুন।`,
                });
            }
        });

        // Courier delays (shipped for > 3 days)
        orders.forEach(o => {
            if (o.status === 'shipped' || o.courierStatus?.includes('কুরিয়ারে')) {
                const createdTime = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (o.createdAt ? new Date(o.createdAt).getTime() : 0);
                if (createdTime) {
                    const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
                    if (diffDays > 3) {
                        alerts.push({
                            type: 'delay',
                            text: `শিপিং বিলম্ব: অর্ডার #${o.firebaseId?.slice(-6).toUpperCase()} (${o.name}) ৩ দিনের বেশি কুরিয়ারে আটকে আছে!`,
                        });
                    }
                }
            }
        });

        // Return damage warning
        const returnedOrdersList = orders?.filter(o => o.courierStatus?.includes('রিটার্ন'));
        if (returnedOrdersList.length > 3) {
            alerts.push({
                type: 'loss',
                text: `রিটার্ন ক্ষতি: এই সপ্তাহে ${returnedOrdersList.length}টি রিটার্ন এসেছে — চার্জ ক্ষতি প্রায় ৳${returnedOrdersList.length * 120}!`,
            });
        }

        return alerts.slice(0, 4);
    }, [allProducts, orders]);

    // ── 6. Best-Selling Products calculations ───────────────────
    const bestSellers = useMemo(() => {
        const counts = {};
        deliveredOrders.forEach(o => {
            const key = o.selectedProductId || o.productName || o.productType;
            if (!key) return;
            if (!counts[key]) {
                counts[key] = { count: 0, revenue: 0, name: o.productName || o.productType, id: o.selectedProductId };
            }
            counts[key].count += 1;
            counts[key].revenue += (o.total || 0);
        });

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            ?.map(item => {
                const prod = allProducts.find(p => p.firebaseId === item.id);
                return {
                    ...item,
                    imageUrl: prod?.imageUrl || 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?w=100&auto=format&fit=crop',
                    category: prod?.category || 'General'
                };
            });
    }, [deliveredOrders, allProducts]);

    // Sales chart data
    const salesData = useMemo(() => {
        const last7 = [...Array(7)]?.map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
        const map = {}; last7.forEach(d => map[d] = 0);
        orders.forEach(o => {
            if (o.status === 'delivered') {
                const dt = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt || 0);
                const ds = dt.toISOString().split('T')[0];
                if (map[ds] !== undefined) map[ds] += (o.total || 0);
            }
        });
        return last7?.map(d => ({ name: new Date(d).toLocaleDateString('bn-BD', { weekday: 'short' }), sales: map[d] }));
    }, [orders]);

    const profitData = useMemo(() => {
        const last7 = [...Array(7)]?.map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const profitMap = {}; last7.forEach(d => profitMap[d] = 0);
        
        // Loop over orders
        orders.forEach(o => {
            const dt = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt || 0);
            const ds = dt.toISOString().split('T')[0];
            if (profitMap[ds] !== undefined) {
                if (o.status === 'delivered') {
                    // Find product cost
                    const prod = allProducts.find(p => p.firebaseId === o.selectedProductId || p.name === o.productName);
                    const prodCost = prod?.costPrice || 800;
                    const codValue = o.total || 0;
                    const delCharge = o.deliveryCharge || 80;
                    const orderProfit = codValue - delCharge - prodCost;
                    profitMap[ds] += orderProfit;
                } else if (o.status === 'returned' || o.courierStatus?.includes('রিটার্ন')) {
                    // Return charge is loss
                    const retLoss = o.returnCharge || 120;
                    profitMap[ds] -= retLoss;
                } else if (o.courierStatus?.includes('হারিয়ে')) {
                    // Lost package is loss of total amount
                    profitMap[ds] -= (o.total || 0);
                }
            }
        });

        // Loop over expenses
        expenses.forEach(e => {
            const dt = e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.date || e.createdAt || 0);
            const ds = dt.toISOString().split('T')[0];
            if (profitMap[ds] !== undefined) {
                profitMap[ds] -= (parseInt(e.amount) || 0);
            }
        });

        return last7?.map(d => ({
            name: new Date(d).toLocaleDateString('bn-BD', { weekday: 'short' }),
            profit: profitMap[d]
        }));
    }, [orders, expenses, allProducts]);

    // Pie chart data
    const statusData = useMemo(() => [
        { name: 'ডেলিভারড', value: delivered, color: '#10b981' },
        { name: 'ট্রানজিট', value: inTransit, color: '#f59e0b' },
        { name: 'প্রসেসিং', value: processing, color: '#6366f1' },
        { name: 'রিটার্ন',  value: returned,  color: '#ef4444' },
        { name: 'বাতিল',    value: cancelled,  color: '#94a3b8' },
    ]?.filter(d => d.value > 0), [delivered, inTransit, processing, returned, cancelled]);

    const fmt = n => n >= 1000 ? `৳${(n/1000).toFixed(1)}k` : `৳${n}`;

    return (
        <div className="space-y-8 animate-fade-in no-print text-slate-800 dark:text-white pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-[#111827] dark:text-white text-xl font-black tracking-tight text-slate-900 dark:text-white tracking-tight">📊 ড্যাশবোর্ড ওভারভিউ</h2>
                    <p className="text-slate-500 dark:text-zinc-300 font-semibold mt-1 text-sm">লগইন: <span className="text-indigo-600 dark:text-blue-500 font-bold">{userRole}</span> &nbsp;|&nbsp; আজ: {todayOrders} অর্ডার &nbsp;|&nbsp; আয়: <span className="text-emerald-600 font-bold">৳{todayRevenue}</span></p>
                </div>
                <div className="flex gap-2 flex-wrap w-full md:w-auto">
                    <button onClick={() => setActiveTab('add-order')} className="px-5 py-2.5 bg-[#0f172a] text-white font-bold rounded-xl hover:bg-slate-700 transition-all text-sm flex items-center gap-2 shadow-sm">
                        <PlusCircle size={16} /> নতুন অর্ডার
                    </button>
                    <button onClick={() => setActiveTab('orders')} className="px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-700 dark:text-white font-bold rounded-xl hover:border-slate-300 transition-all text-sm flex items-center gap-2 shadow-sm neo-card dark:border-white/5 ">
                        <ClipboardList size={16} /> সব অর্ডার
                    </button>
                    <button onClick={() => setActiveTab('courier-tracking')} className="px-5 py-2.5 bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-zinc-200 transition-all text-sm flex items-center gap-2 shadow-sm">
                        <Truck size={16} /> কুরিয়ার
                    </button>
                </div>
            </div>

            {/* ── 🤖 AI Smart Actionable Alerts Drawer ── */}
            {aiAlerts.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-wider">
                        <Sparkles size={18} className="animate-spin duration-1000" />
                        🤖 AI Smart Assistant Recommendations
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiAlerts?.map((alert, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 bg-white/70 p-3.5 rounded-xl border border-blue-50 text-xs font-bold text-slate-700 dark:text-white neo-card dark:border-white/5 ">
                                <span className="text-base">
                                    {alert.type === 'warning' ? '⚠️' : alert.type === 'delay' ? '⏳' : '💸'}
                                </span>
                                <p className="leading-relaxed">{alert.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Row 1: Order Status Cards ── */}
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-3 h-[2px] bg-slate-300 inline-block"></span> অর্ডার স্ট্যাটাস
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'নতুন অর্ডার',   val: newOrders,   icon: '🆕', bg: 'bg-indigo-50', val_cls: 'text-indigo-700', tab: 'orders' },
                        { label: 'প্রসেসিং',      val: processing,  icon: '⚙️', bg: 'bg-purple-50 dark:bg-purple-500/10 border border-transparent dark:border-purple-500/20', val_cls: 'text-purple-700 dark:text-purple-400', tab: 'orders' },
                        { label: 'কুরিয়ারে আছে', val: inTransit,   icon: '🚚', bg: 'bg-amber-50 dark:bg-amber-500/10 border border-transparent dark:border-amber-500/20', val_cls: 'text-amber-700 dark:text-amber-400',  tab: 'courier-tracking' },
                        { label: 'ডেলিভারি সফল',  val: delivered,   icon: '✅', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border border-transparent dark:border-emerald-500/20', val_cls: 'text-emerald-700 dark:text-emerald-400',tab: 'orders' },
                        { label: 'রিটার্ন',       val: returned,    icon: '🔄', bg: 'bg-rose-50',   val_cls: 'text-rose-700',   tab: 'courier-tracking' },
                        { label: 'বাতিল',         val: cancelled,   icon: '❌', bg: 'bg-slate-50 neo-inset',  val_cls: 'text-slate-600 dark:text-zinc-300',  tab: 'orders' },
                    ]?.map((s, i) => (
                        <button key={i} onClick={() => setActiveTab(s.tab)}
                            className={`${s.bg} rounded-2xl p-4 text-left hover:scale-105 transition-all shadow-sm border border-white group cursor-pointer`}>
                            <div className="text-[#111827] dark:text-white text-xl mb-2">{s.icon}</div>
                            <div className={`text-3xl font-black ${s.val_cls}`}>{s.val}</div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-300 uppercase mt-1 leading-tight">{s.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Row 2: Financial Summary with Margin Analyzer ── */}
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-3 h-[2px] bg-slate-300 inline-block"></span> আর্থিক সারাংশ ও মুনাফার হার
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: 'মোট COD আদায়',     val: fmt(totalCOD),        icon: <DollarSign size={18}/>, cls: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
                        { label: 'ডেলিভারি চার্জ',   val: fmt(totalDeliveryCharge), icon: <Truck size={18}/>,  cls: 'text-indigo-700',   bg: 'bg-indigo-50/50',   border: 'border-blue-100' },
                        { label: 'প্রোডাক্ট মোট খরচ', val: fmt(totalProductCost),   icon: <Package size={18}/>,cls: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20' },
                        { label: 'নেট প্রফিট (লাভ)',   val: fmt(netIncome),       icon: <TrendingUp size={18}/>, cls: netIncome >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-700', bg: netIncome >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-rose-50', border: 'border-emerald-200 dark:border-emerald-500/30' },
                        { label: 'নেট প্রফিট মার্জিন',  val: `${marginPercent}%`,  icon: <Star size={18}/>,       cls: marginPercent >= 20 ? 'text-indigo-800 dark:text-indigo-200' : 'text-amber-700', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-indigo-200 dark:border-indigo-500/30' },
                    ]?.map((f, i) => (
                        <div key={i} className={`${f.bg} border ${f.border} rounded-2xl p-5 shadow-sm`}>
                            <div className={`${f.cls} mb-3`}>{f.icon}</div>
                            <div className={`text-[#111827] dark:text-white text-xl font-black ${f.cls}`}>{f.val}</div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-300 uppercase mt-1">{f.label}</div>
                        </div>
                    ))}
                </div>
                {/* Additional expenses, lost counts, and return fees details */}
                <div className="flex gap-4 mt-3 bg-white border border-slate-100 p-4 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-300 flex-wrap neo-card dark:border-white/5 ">
                    <div>অন্যান্য ফ্যাক্টরি খরচ: <span className="text-slate-800 dark:text-white font-extrabold">৳{totalExpenses}</span></div>
                    <div>•</div>
                    <div>রিটার্ন কুরিয়ার অপচয়: <span className="text-rose-600 font-extrabold">৳{totalReturnCharge}</span></div>
                    <div>•</div>
                    <div>হারানো মালামাল ক্ষতি: <span className="text-red-600 font-extrabold">৳{totalLoss}</span></div>
                </div>
            </div>

            {/* ── Row 3: Sales Trend & Net Profit Chart Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Sales Line Chart */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm neo-card dark:border-white/5 ">
                    <h3 className="text-sm font-black text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> গত ৭ দিনের সেলস ট্রেন্ড
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="sales" name="বিক্রি (৳)" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Net Profit Chart */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm neo-card dark:border-white/5 ">
                    <h3 className="text-sm font-black text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-50/500 rounded-full animate-pulse"></span> গত ৭ দিনের নীট লাভ (Net Profit)
                    </h3>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profitData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="profit" name="নীট লাভ (৳)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Row 4: Best Sellers, Stock Status & Order Share Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Best Sellers Panel */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between neo-card dark:border-white/5 ">
                    <div>
                        <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2 mb-4">
                            🏆 বেস্ট সেলিং প্রোডাক্ট (Best Sellers)
                        </h3>
                        <div className="space-y-3">
                            {bestSellers.length > 0 ? bestSellers?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 neo-inset hover:bg-indigo-50/50 rounded-xl transition-all border border-transparent hover:border-blue-100 neo-bg">
                                    <img loading="lazy" src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-200" alt={item.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-black text-slate-800 dark:text-white truncate">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.category}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-emerald-700">{item.count} পিস</div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-0.5">৳{item.revenue}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-xs font-bold text-slate-400">কোনো সফল ডেলিভারি নেই</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 2: Stock Alert Card */}
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between neo-card dark:border-white/5 ">
                    <div>
                        <div className="flex items-center justify-between p-4 border-b border-slate-50">
                            <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2"><Package size={14} /> স্টক অবস্থা</h3>
                            <div className="flex gap-1.5 text-[10px] font-bold">
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 rounded-full">{liveProducts} LIVE</span>
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">{outProducts} OUT</span>
                            </div>
                        </div>
                        <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                            {lowStockList.length > 0 ? lowStockList?.map(p => (
                                <div key={p.firebaseId} className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl border border-amber-100">
                                    <img loading="lazy" src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover" alt={p.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{p.name}</div>
                                        <div className="text-[10px] font-bold text-amber-600">স্টক: {p.stockCount || 0} পিস</div>
                                    </div>
                                    <span className="text-[9px] font-bold bg-amber-200 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full animate-pulse">LOW</span>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-xs font-bold text-emerald-600">✅ সব স্টক ঠিক আছে</div>
                            )}
                        </div>
                    </div>
                    <div className="p-3 border-t border-slate-50">
                        <button onClick={() => setActiveTab('products')} className="w-full text-xs font-bold text-slate-500 dark:text-zinc-300 hover:text-slate-900 dark:text-white tracking-tight transition-all bg-slate-50 neo-inset hover:bg-slate-100 neo-inset py-2 rounded-xl flex items-center justify-center gap-1 neo-bg">
                            <Package size={12} /> সব প্রোডাক্ট দেখুন
                        </button>
                    </div>
                </div>

                {/* Column 3: Order share Pie Chart */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between neo-card dark:border-white/5 ">
                    <div>
                        <h3 className="text-sm font-black text-slate-700 dark:text-white mb-2">অর্ডার ভাগ</h3>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                                        {statusData?.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                                    <Legend height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
            {/* ── Row 5: Recent Orders ── */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm neo-card dark:border-white/5 ">
                <div className="flex items-center justify-between p-5 border-b border-slate-50">
                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><ShoppingBag size={16} /> সাম্প্রতিক অর্ডার</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-indigo-600 dark:text-blue-500 hover:underline">সব দেখুন →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 neo-inset text-[10px] text-slate-500 dark:text-zinc-300 font-black uppercase tracking-widest neo-bg">
                            <tr>
                                <th className="px-5 py-3 text-left">অর্ডার</th>
                                <th className="px-5 py-3 text-left">কাস্টমার</th>
                                <th className="px-5 py-3 text-left">পণ্য</th>
                                <th className="px-5 py-3 text-left">বিল</th>
                                <th className="px-5 py-3 text-left">স্ট্যাটাস</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders.slice(0, 7)?.map(o => (
                                <tr key={o.firebaseId} className="hover:bg-slate-50 neo-inset/50 transition-colors neo-bg">
                                    <td className="px-5 py-3">
                                        <div className="font-black text-slate-800 dark:text-white text-xs">#{o.firebaseId?.slice(-6).toUpperCase()}</div>
                                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{o.date}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{o.name}</div>
                                        <div className="text-[10px] text-indigo-500 font-semibold">{o.phone}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-1 flex-wrap">
                                            <span className="text-[10px] bg-slate-100 neo-inset text-slate-700 dark:text-white px-2 py-0.5 rounded-full font-bold neo-bg">{o.productType}</span>
                                            <span className="text-[10px] bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{o.color}</span>
                                            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">Sz:{o.size}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 font-black text-emerald-700">৳{o.total}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-emerald-500/30' :
                                            o.status === 'pending'   ? 'bg-indigo-50  text-indigo-700  border-indigo-200 dark:border-indigo-500/30' :
                                            o.status === 'shipped'   ? 'bg-amber-50   text-amber-700   border-amber-200 dark:border-amber-500/30' :
                                            o.status === 'cancelled' ? 'bg-slate-50 neo-inset   text-slate-500 dark:text-zinc-300   border-slate-200' :
                                            'bg-indigo-50/50 text-indigo-700 border-indigo-200 dark:border-indigo-500/30'
                                        }`}>
                                            {o.status === 'delivered' ? 'ডেলিভারড' : o.status === 'pending' ? 'নতুন' : o.status === 'shipped' ? 'শিপিং' : o.status === 'cancelled' ? 'বাতিল' : o.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <div className="p-16 text-center text-slate-400 font-bold">কোনো অর্ডার নেই</div>}
                </div>
            </div>

        </div>
    );
};

export default NeumorphicDashboardView;
