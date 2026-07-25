import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, MapPin, Smartphone, Users, ShoppingBag, Calendar, Printer, Database, LayoutGrid } from 'lucide-react';

const SmartAnalyticsView = ({ orders, allProducts = [] }) => {
    const [viewType, setViewType] = useState('charts'); // 'charts' or 'data-sheets'

    // ── 1. Area Analytics (Inside vs Outside Dhaka & Top Cities) ──
    const areaStats = useMemo(() => {
        let insideCount = 0;
        let outsideCount = 0;
        let insideRev = 0;
        let outsideRev = 0;

        // City extraction logic
        const cityMap = {};
        orders.forEach(o => {
            const rev = o.total || 0;
            if (o.deliveryArea === 'inside') {
                insideCount++;
                insideRev += rev;
            } else {
                outsideCount++;
                outsideRev += rev;
            }

            // Extract city
            const addr = o.address?.toLowerCase() || '';
            let city = 'অন্যান্য';
            if (addr.includes('dhaka') || addr.includes('ঢাকা') || addr.includes('মিরপুর') || addr.includes('উত্তরা') || addr.includes('ধানমণ্ডি')) city = 'ঢাকা (Dhaka)';
            else if (addr.includes('chittagong') || addr.includes('চট্টগ্রাম') || addr.includes('ctg')) city = 'চট্টগ্রাম (Chittagong)';
            else if (addr.includes('sylhet') || addr.includes('সিলেট')) city = 'সিলেট (Sylhet)';
            else if (addr.includes('rajshahi') || addr.includes('রাজশাহী')) city = 'রাজশাহী (Rajshahi)';
            else if (addr.includes('khulna') || addr.includes('খুলনা')) city = 'খুলনা (Khulna)';
            else if (addr.includes('barisal') || addr.includes('বরিশাল')) city = 'বরিশাল (Barisal)';
            else if (addr.includes('rangpur') || addr.includes('রংপুর')) city = 'রংপুর (Rangpur)';
            else if (addr.includes('mymensingh') || addr.includes('ময়মনসিংহ')) city = 'ময়মনসিংহ (Mymensingh)';
            else if (addr.includes('comilla') || addr.includes('কুমিল্লা')) city = 'কুমিল্লা (Comilla)';
            else if (addr.includes('gazipur') || addr.includes('গাজীপুর')) city = 'গাজীপুর (Gazipur)';

            if (!cityMap[city]) cityMap[city] = { name: city, count: 0, revenue: 0 };
            cityMap[city].count++;
            cityMap[city].revenue += rev;
        });

        const total = insideCount + outsideCount;
        const topCities = Object.values(cityMap).sort((a, b) => b.count - a.count);

        return {
            summary: [
                { name: 'ঢাকার ভেতরে', count: insideCount, revenue: insideRev, percentage: total > 0 ? Math.round((insideCount / total) * 100) : 0, color: '#10b981' },
                { name: 'ঢাকার বাইরে', count: outsideCount, revenue: outsideRev, percentage: total > 0 ? Math.round((outsideCount / total) * 100) : 0, color: '#f59e0b' }
            ],
            topCities
        };
    }, [orders]);

    // ── 2. Product Category Analytics (Borka vs Hijab) ──
    const categoryStats = useMemo(() => {
        let borkaCount = 0;
        let hijabCount = 0;
        let borkaRev = 0;
        let hijabRev = 0;

        orders.forEach(o => {
            const rev = o.total || 0;
            if (o.productType === 'borka') {
                borkaCount++;
                borkaRev += rev;
            } else if (o.productType === 'hijab') {
                hijabCount++;
                hijabRev += rev;
            }
        });

        return [
            { name: 'বোরকা কালেকশন', count: borkaCount, revenue: borkaRev, color: '#6366f1' },
            { name: 'হিজাব কালেকশন', count: hijabCount, revenue: hijabRev, color: '#ec4899' }
        ];
    }, [orders]);

    // ── 3. Mobile Operator Distribution ──
    const operatorStats = useMemo(() => {
        let gp = 0, robi = 0, airtel = 0, bl = 0, teletalk = 0, other = 0;
        let gpRev = 0, robiRev = 0, airtelRev = 0, blRev = 0, teletalkRev = 0, otherRev = 0;

        orders.forEach(o => {
            const phone = o.phone?.trim() || '';
            const cleanPhone = phone.replace(/^\+88/, '').replace(/^88/, '');
            const rev = o.total || 0;
            
            if (/^(017|013)/.test(cleanPhone)) { gp++; gpRev += rev; }
            else if (/^(018)/.test(cleanPhone)) { robi++; robiRev += rev; }
            else if (/^(016)/.test(cleanPhone)) { airtel++; airtelRev += rev; }
            else if (/^(019|014)/.test(cleanPhone)) { bl++; blRev += rev; }
            else if (/^(015)/.test(cleanPhone)) { teletalk++; teletalkRev += rev; }
            else if (cleanPhone.length > 0) { other++; otherRev += rev; }
        });

        const total = gp + robi + airtel + bl + teletalk + other;
        const pct = val => total > 0 ? Math.round((val / total) * 100) : 0;

        return [
            { name: 'Grameenphone', count: gp, revenue: gpRev, pct: pct(gp), color: '#00c49f' },
            { name: 'Robi', count: robi, revenue: robiRev, pct: pct(robi), color: '#ff8042' },
            { name: 'Airtel', count: airtel, revenue: airtelRev, pct: pct(airtel), color: '#ffbb28' },
            { name: 'Banglalink', count: bl, revenue: blRev, pct: pct(bl), color: '#0088fe' },
            { name: 'Teletalk', count: teletalk, revenue: teletalkRev, pct: pct(teletalk), color: '#8884d8' },
            { name: 'অন্যান্য', count: other, revenue: otherRev, pct: pct(other), color: '#94a3b8' }
        ]?.filter(op => op.count > 0);
    }, [orders]);

    // ── 4. Gender Demographics Guessing ──
    const genderStats = useMemo(() => {
        let male = 0, female = 0, unknown = 0;
        let maleRev = 0, femaleRev = 0, unknownRev = 0;

        const femaleKeywords = [
            'mst', 'most', 'akter', 'begum', 'khatun', 'jahan', 'sultana', 'nahar', 'banu', 
            'riya', 'mim', 'tasnim', 'sadia', 'jannat', 'sumaiya', 'farhana', 'nusrat', 'aisha'
        ];
        const maleKeywords = [
            'md', 'mohammad', 'muhammad', 'islam', 'rahman', 'uddin', 'ahmed', 'hasan', 'khan', 
            'hossain', 'ali', 'hassan', 'alam', 'chowdhury', 'shakil', 'arif', 'rubel'
        ];

        orders.forEach(o => {
            const name = o.name?.toLowerCase() || '';
            const words = name.split(/\s+/);
            const rev = o.total || 0;
            
            let isFemale = words.some(w => femaleKeywords.includes(w));
            let isMale = words.some(w => maleKeywords.includes(w));

            if (isFemale && !isMale) { female++; femaleRev += rev; }
            else if (isMale && !isFemale) { male++; maleRev += rev; }
            else if (isFemale && isMale) { female++; femaleRev += rev; }
            else { unknown++; unknownRev += rev; }
        });

        const total = male + female + unknown;
        return [
            { name: 'মহিলা (Female)', value: female, revenue: femaleRev, pct: total > 0 ? Math.round((female/total)*100) : 0, color: '#ec4899' },
            { name: 'পুরুষ (Male)', value: male, revenue: maleRev, pct: total > 0 ? Math.round((male/total)*100) : 0, color: '#3b82f6' },
            { name: 'অজানা (Unknown)', value: unknown, revenue: unknownRev, pct: total > 0 ? Math.round((unknown/total)*100) : 0, color: '#94a3b8' }
        ]?.filter(g => g.value > 0);
    }, [orders]);

    // ── 5. Age Demographics Guessing (based on sizes and categories) ──
    const ageStats = useMemo(() => {
        let youth = 0, adult = 0, senior = 0, kid = 0;
        let youthRev = 0, adultRev = 0, seniorRev = 0, kidRev = 0;

        orders.forEach(o => {
            const size = o.size || '';
            const type = o.productType || '';
            const rev = o.total || 0;

            const sizeNum = parseInt(size.replace(/\D/g, ''));

            if (type === 'kids' || (sizeNum && sizeNum < 40)) {
                kid++;
                kidRev += rev;
            } else if (sizeNum && sizeNum >= 54) {
                senior++;
                seniorRev += rev;
            } else if (sizeNum && sizeNum >= 50 && sizeNum <= 52) {
                adult++;
                adultRev += rev;
            } else {
                youth++;
                youthRev += rev;
            }
        });

        const total = youth + adult + senior + kid;
        const pct = val => total > 0 ? Math.round((val / total) * 100) : 0;

        return [
            { name: '👶 শিশু ও কিশোর (৫-১৫ বছর)', count: kid, revenue: kidRev, pct: pct(kid), color: '#a855f7' },
            { name: '👩 তরুণ-তরুণী (১৬-২৭ বছর)', count: youth, revenue: youthRev, pct: pct(youth), color: '#ec4899' },
            { name: '👩‍💼 মধ্যবয়সী (২৮-৪৫ বছর)', count: adult, revenue: adultRev, pct: pct(adult), color: '#10b981' },
            { name: '👵 প্রবীণ (৪৬+ বছর)', count: senior, revenue: seniorRev, pct: pct(senior), color: '#f59e0b' }
        ]?.filter(a => a.count > 0);
    }, [orders]);

    // ── 6. Product Attributes Popularity (Top Color, Size, Borka, Hijab name) ──
    const attributeStats = useMemo(() => {
        const colorMap = {};
        const sizeMap = {};
        const borkaNameMap = {};
        const hijabNameMap = {};

        orders.forEach(o => {
            const color = o.color || 'Unspecified';
            const size = o.size || 'Unspecified';
            const name = o.productName || o.productTitle || 'সরাসরি এন্ট্রি / অন্যান্য';
            const isHijab = o.productType === 'hijab' || o.category?.toLowerCase()?.includes('hijab') || name.toLowerCase().includes('hijab') || name.includes('হিজাব');

            colorMap[color] = (colorMap[color] || 0) + 1;
            sizeMap[size] = (sizeMap[size] || 0) + 1;

            if (isHijab) {
                hijabNameMap[name] = (hijabNameMap[name] || 0) + 1;
            } else {
                borkaNameMap[name] = (borkaNameMap[name] || 0) + 1;
            }
        });

        const sortMap = (map) => Object.entries(map)
            ?.map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            colors: sortMap(colorMap),
            sizes: sortMap(sizeMap),
            borkas: sortMap(borkaNameMap),
            hijabs: sortMap(hijabNameMap)
        };
    }, [orders]);

    // ── 7. AI Stock Prediction (Velocity) ──
    const stockWarnings = useMemo(() => {
        if (!allProducts || allProducts.length === 0) return [];
        
        // Calculate rough sales velocity
        const recentSales = {};
        orders.forEach(o => {
            const name = o.productName || o.productTitle || '';
            if (name) {
                recentSales[name] = (recentSales[name] || 0) + 1;
            }
        });

        const warnings = [];
        allProducts.forEach(p => {
            const stock = parseInt(p.quantity) || 0;
            if (stock <= 0) return; // Already out of stock

            const name = p.name || p.title || '';
            const totalSold = recentSales[name] || 0;
            const dailyVelocity = (totalSold / 30) || 0.1; // Estimate over 30 days

            const daysLeft = stock / dailyVelocity;

            // Trigger warning if stock will run out in 3 days or less, and it's an actively selling item
            if (daysLeft <= 3 && totalSold > 2) {
                warnings.push({
                    name: name,
                    stock: stock,
                    velocity: dailyVelocity.toFixed(1),
                    daysLeft: Math.floor(daysLeft),
                    image: p.image || null
                });
            }
        });

        return warnings.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [orders, allProducts]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-800 dark:text-white pb-20">
            {/* Print Styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-section, .print-section * { visibility: visible; }
                    .print-section { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 no-print">
                <div>
                    <h2 className="text-[#111827] dark:text-white text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        🎯 ডেমোগ্রাফিক ও স্মার্ট অ্যানালিটিক্স
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold mt-1">অর্ডার ডেটার উপর ভিত্তি করে এলাকা, অপারেটর ও কাস্টমার ডেমোগ্রাফিক্স বিশ্লেষণ</p>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewType('charts')} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            viewType === 'charts' 
                            ? 'bg-[#0f172a] text-white' 
                            : 'bg-white border text-slate-600 dark:text-zinc-300 hover:bg-slate-50 neo-inset'
                        }`}
                    >
                        <LayoutGrid size={15} /> 📊 চার্ট ভিউ
                    </button>
                    <button 
                        onClick={() => setViewType('data-sheets')} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            viewType === 'data-sheets' 
                            ? 'bg-[#0f172a] text-white' 
                            : 'bg-white border text-slate-600 dark:text-zinc-300 hover:bg-slate-50 neo-inset'
                        }`}
                    >
                        <Database size={15} /> 📋 বিস্তারিত ডাটা শিট
                    </button>
                    <button 
                        onClick={handlePrint} 
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                        <Printer size={15} /> 🖨️ PDF ডাউনলোড / প্রিন্ট
                    </button>
                </div>
            </div>

            {/* 🤖 AI Stock Warnings */}
            {stockWarnings.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm mb-8 animate-pulse-slow relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10">
                        <AlertTriangle size={200} className="text-rose-600" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black text-rose-800 flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                            <AlertTriangle size={24} /> 🚨 AI স্টক অ্যালার্ট! (স্টক শেষ হওয়ার পথে)
                        </h3>
                        <p className="text-sm font-semibold text-rose-600 mb-6">বর্তমান বিক্রির হার (Sales Velocity) এনালাইসিস করে দেখা গেছে নিচের প্রোডাক্টগুলো খুব শিগগিরই স্টক আউট হয়ে যাবে। দয়া করে ফ্যাক্টরিতে দ্রুত অর্ডার করুন!</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stockWarnings?.map((w, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-4 border border-rose-100 flex items-center gap-4 shadow-sm neo-card dark:border-white/5 ">
                                    {w.image ? (
                                        <img loading="lazy" src={w.image} alt={w.name} className="w-16 h-16 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-slate-100 neo-inset flex items-center justify-center text-[#111827] dark:text-white text-xl neo-bg">📦</div>
                                    )}
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-1">{w.name}</h4>
                                        <div className="flex gap-2 text-xs font-bold mt-1">
                                            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded">স্টক: {w.stock} পিস</span>
                                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 px-2 py-1 rounded">{w.daysLeft === 0 ? 'আজকেই শেষ!' : `${w.daysLeft} দিন চলবে`}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Print Friendly Wrapper */}
            <div className="print-section space-y-8">
                
                {/* Printable Header */}
                <div className="hidden print:block border-b-4 border-slate-900 pb-4 mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase dark:text-white">NR ZONE — DEMOGRAPHICS REPORT</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-300 mt-1">তারিখ: {new Date().toLocaleDateString('en-GB')} | সর্বমোট অর্ডার বিশ্লেষণ: {orders.length}টি</p>
                </div>

                {viewType === 'charts' ? (
                    /* ─── 📊 CHARTS VIEW ─── */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Area Analytics Card */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <MapPin size={18} className="text-emerald-500" /> deliveryArea (Inside vs Outside)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {areaStats.summary?.map((a, i) => (
                                    <div key={i} className="bg-slate-50 neo-inset p-4 rounded-xl space-y-2 border border-slate-100 neo-bg">
                                        <div className="text-xs font-bold text-slate-400 uppercase">{a.name}</div>
                                        <div className="text-3xl font-black text-slate-800 dark:text-white">{a.count} <span className="text-xs text-slate-400">অর্ডার</span></div>
                                        <div className="text-sm font-bold text-emerald-600">৳{a.revenue} ({a.percentage}%)</div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2 pt-2">
                                {areaStats.summary?.map((a, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-600 dark:text-zinc-300">{a.name}</span>
                                            <span className="text-slate-900 dark:text-white tracking-tight dark:text-white">{a.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 neo-inset h-2 rounded-full overflow-hidden neo-bg">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${a.percentage}%`, backgroundColor: a.color }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Product Type Analysis */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <ShoppingBag size={18} className="text-indigo-500" /> ক্যাটাগরি বিশ্লেষণ (Borka vs Hijab)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categoryStats?.map((c, i) => (
                                    <div key={i} className="bg-slate-50 neo-inset p-4 rounded-xl space-y-2 border border-slate-100 neo-bg">
                                        <div className="text-xs font-bold text-slate-400 uppercase">{c.name}</div>
                                        <div className="text-3xl font-black text-slate-800 dark:text-white">{c.count} <span className="text-xs text-slate-400">অর্ডার</span></div>
                                        <div className="text-sm font-bold text-indigo-600 dark:text-blue-500">৳{c.revenue}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-[120px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="count" stroke="none">
                                            {categoryStats?.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Mobile Operator Analysis */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Smartphone size={18} className="text-indigo-500" /> মোবাইল অপারেটর বিশ্লেষণ (GP, Robi, Airtel, BL)
                            </h3>
                            {operatorStats.length > 0 ? (
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={operatorStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                                            <Bar dataKey="count" name="কাস্টমার সংখ্যা">
                                                {operatorStats?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs font-bold text-slate-400">কোনো মোবাইল নম্বর পাওয়া যায়নি</div>
                            )}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-600 dark:text-zinc-300">
                                {operatorStats?.map((op, idx) => (
                                    <div key={idx} className="p-2 bg-slate-50 neo-inset border border-slate-100 rounded-lg flex flex-col items-center neo-bg">
                                        <span className="w-2.5 h-2.5 rounded-full inline-block mb-1" style={{ backgroundColor: op.color }}></span>
                                        <div>{op.name}</div>
                                        <div className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{op.pct}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gender Demographics Analytics */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Users size={18} className="text-pink-500" /> কাস্টমার জেন্ডার ডেমোগ্রাফিক্স (নামের ভিত্তিতে অনুমিত)
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex-1 space-y-3 w-full">
                                    {genderStats?.map((g, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-slate-600 dark:text-zinc-300">{g.name}</span>
                                                <span className="text-slate-900 dark:text-white tracking-tight dark:text-white">{g.value} কাস্টমার ({g.pct}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 neo-inset h-2 rounded-full overflow-hidden neo-bg">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${g.pct}%`, backgroundColor: g.color }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="w-[140px] h-[140px] shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={genderStats} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none">
                                                {genderStats?.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Age Demographics Card */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2 neo-card dark:border-white/5 ">
                            <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Calendar size={18} className="text-purple-500" /> কাস্টমার বয়স ডেমোগ্রাফিক্স (অর্ডার ও সাইজ প্যাটার্ন ভিত্তিক অনুমিত)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {ageStats?.map((a, i) => (
                                    <div key={i} className="bg-slate-50 neo-inset p-4 rounded-xl border border-slate-100 space-y-2 neo-bg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }}></span>
                                            <span className="text-xs font-bold text-slate-500 dark:text-zinc-300">{a.name}</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-800 dark:text-white">{a.count} <span className="text-xs text-slate-400">অর্ডার</span></div>
                                        <div className="text-xs font-bold text-purple-600">৳{a.revenue} ({a.pct}%)</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                ) : (
                    /* ─── 📋 DATA SHEETS VIEW ─── */
                    <div className="space-y-8 animate-slide-up">
                        
                        {/* Table 1: Area Report */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-md font-black text-slate-800 dark:text-white flex items-center gap-2 border-b pb-3">
                                <MapPin size={18} className="text-emerald-500" /> ১. এলাকা ভিত্তিক সেলস ও অর্ডার রিপোর্ট (Location Analysis)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-semibold">
                                    <thead>
                                        <tr className="bg-slate-50 neo-inset text-slate-400 border-b neo-bg">
                                            <th className="p-3">অবস্থান / শহর (City/Location)</th>
                                            <th className="p-3 text-center">অর্ডার সংখ্যা</th>
                                            <th className="p-3 text-right">মোট রেভিনিউ</th>
                                            <th className="p-3 text-center">বাজার শেয়ার (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700 dark:text-white">
                                        {areaStats.topCities?.map((c, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 neo-inset neo-bg">
                                                <td className="p-3 font-bold text-slate-800 dark:text-white">{c.name}</td>
                                                <td className="p-3 text-center font-black">{c.count}টি</td>
                                                <td className="p-3 text-right text-emerald-600 font-bold">৳{c.revenue.toLocaleString()}</td>
                                                <td className="p-3 text-center text-slate-400">{Math.round((c.count / orders.length) * 100)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table 2: Gender Demographics */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-md font-black text-slate-800 dark:text-white flex items-center gap-2 border-b pb-3">
                                <Users size={18} className="text-pink-500" /> ২. জেন্ডার ডেমোগ্রাফিক্স ডেটা শিট (Gender Demographics)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-semibold">
                                    <thead>
                                        <tr className="bg-slate-50 neo-inset text-slate-400 border-b neo-bg">
                                            <th className="p-3">জেন্ডার (Gender Group)</th>
                                            <th className="p-3 text-center">কাস্টমার সংখ্যা</th>
                                            <th className="p-3 text-right">মোট ক্যাশ ইন</th>
                                            <th className="p-3 text-center">শতকরা হার (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700 dark:text-white">
                                        {genderStats?.map((g, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 neo-inset neo-bg">
                                                <td className="p-3 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }}></span>
                                                    {g.name}
                                                </td>
                                                <td className="p-3 text-center font-black">{g.value} জন</td>
                                                <td className="p-3 text-right text-pink-600 font-bold">৳{g.revenue.toLocaleString()}</td>
                                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{g.pct}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table 3: Operator Distribution */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-md font-black text-slate-800 dark:text-white flex items-center gap-2 border-b pb-3">
                                <Smartphone size={18} className="text-indigo-500" /> ৩. কাস্টমার মোবাইল অপারেটর ডাটা শিট (Operator Analysis)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-semibold">
                                    <thead>
                                        <tr className="bg-slate-50 neo-inset text-slate-400 border-b neo-bg">
                                            <th className="p-3">অপারেটর নাম (Operator)</th>
                                            <th className="p-3 text-center">মোট ব্যবহারকারী</th>
                                            <th className="p-3 text-right">রেভিনিউ কন্ট্রিবিউশন</th>
                                            <th className="p-3 text-center">শেয়ার (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700 dark:text-white">
                                        {operatorStats?.map((op, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 neo-inset neo-bg">
                                                <td className="p-3 font-bold text-slate-800 dark:text-white">{op.name}</td>
                                                <td className="p-3 text-center font-black">{op.count} জন</td>
                                                <td className="p-3 text-right text-indigo-600 dark:text-blue-500 font-bold">৳{op.revenue.toLocaleString()}</td>
                                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{op.pct}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table 4: Age demographics */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 neo-card dark:border-white/5 ">
                            <h3 className="text-md font-black text-slate-800 dark:text-white flex items-center gap-2 border-b pb-3">
                                <Calendar size={18} className="text-purple-500" /> ৪. কাস্টমার বয়স ডেমোগ্রাফিক্স ডাটা শিট (Estimated Age Demographics)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-semibold">
                                    <thead>
                                        <tr className="bg-slate-50 neo-inset text-slate-400 border-b neo-bg">
                                            <th className="p-3">বয়স গ্রুপ (Estimated Age Group)</th>
                                            <th className="p-3 text-center">অর্ডার সংখ্যা</th>
                                            <th className="p-3 text-right">রেভিনিউ কন্ট্রিবিউশন</th>
                                            <th className="p-3 text-center">শেয়ার (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700 dark:text-white">
                                        {ageStats?.map((a, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 neo-inset neo-bg">
                                                <td className="p-3 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }}></span>
                                                    {a.name}
                                                </td>
                                                <td className="p-3 text-center font-black">{a.count}টি</td>
                                                <td className="p-3 text-right text-purple-600 font-bold">৳{a.revenue.toLocaleString()}</td>
                                                <td className="p-3 text-center font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{a.pct}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Table 5: Attributes Analysis */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2 neo-card dark:border-white/5 ">
                            <h3 className="text-md font-black text-slate-800 dark:text-white flex items-center gap-2 border-b pb-3">
                                <Users size={18} className="text-indigo-500" /> ৫. প্রোডাক্ট অ্যাট্রিবিউট বিশ্লেষণ (জনপ্রিয় কালার, সাইজ ও ডিজাইন র্যাংকিং)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Top Colors */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🌈 টপ বিক্রিত কালার (Top Colors)</h4>
                                    <div className="bg-slate-50 neo-inset border rounded-xl overflow-hidden neo-bg">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 neo-inset border-b neo-bg">
                                                <tr><th className="p-2">রং (Color)</th><th className="p-2 text-center">অর্ডার সংখ্যা</th></tr>
                                            </thead>
                                            <tbody>
                                                {attributeStats.colors?.map((c, i) => (
                                                    <tr key={i} className="border-b hover:bg-slate-100 neo-inset/50 neo-bg">
                                                        <td className="p-2 font-bold text-slate-700 dark:text-white">{i+1}. {c.name}</td>
                                                        <td className="p-2 text-center font-black text-indigo-600 dark:text-blue-500">{c.count}টি</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top Sizes */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">📏 টপ বিক্রিত সাইজ (Top Sizes)</h4>
                                    <div className="bg-slate-50 neo-inset border rounded-xl overflow-hidden neo-bg">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 neo-inset border-b neo-bg">
                                                <tr><th className="p-2">সাইজ (Size)</th><th className="p-2 text-center">অর্ডার সংখ্যা</th></tr>
                                            </thead>
                                            <tbody>
                                                {attributeStats.sizes?.map((s, i) => (
                                                    <tr key={i} className="border-b hover:bg-slate-100 neo-inset/50 neo-bg">
                                                        <td className="p-2 font-bold text-slate-700 dark:text-white">{i+1}. {s.name}</td>
                                                        <td className="p-2 text-center font-black text-indigo-600 dark:text-blue-500">{s.count}টি</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top Borka Designs */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">👗 জনপ্রিয় বোরকা ডিজাইন (Top Borka)</h4>
                                    <div className="bg-slate-50 neo-inset border rounded-xl overflow-hidden neo-bg">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 neo-inset border-b neo-bg">
                                                <tr><th className="p-2">প্রোডাক্ট নাম</th><th className="p-2 text-center">অর্ডার</th></tr>
                                            </thead>
                                            <tbody>
                                                {attributeStats.borkas?.map((b, i) => (
                                                    <tr key={i} className="border-b hover:bg-slate-100 neo-inset/50 neo-bg">
                                                        <td className="p-2 font-bold text-slate-700 dark:text-white truncate max-w-xs">{i+1}. {b.name}</td>
                                                        <td className="p-2 text-center font-black text-rose-600">{b.count}টি</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top Hijab Designs */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🧕 জনপ্রিয় হিজাব ডিজাইন (Top Hijab)</h4>
                                    <div className="bg-slate-50 neo-inset border rounded-xl overflow-hidden neo-bg">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 neo-inset border-b neo-bg">
                                                <tr><th className="p-2">প্রোডাক্ট নাম</th><th className="p-2 text-center">অর্ডার</th></tr>
                                            </thead>
                                            <tbody>
                                                {attributeStats.hijabs?.map((h, i) => (
                                                    <tr key={i} className="border-b hover:bg-slate-100 neo-inset/50 neo-bg">
                                                        <td className="p-2 font-bold text-slate-700 dark:text-white truncate max-w-xs">{i+1}. {h.name}</td>
                                                        <td className="p-2 text-center font-black text-pink-600">{h.count}টি</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default SmartAnalyticsView;
