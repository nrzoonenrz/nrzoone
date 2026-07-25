import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, Plus, Trash2, Edit2 } from 'lucide-react';

const ProfitLossView = ({ orders, expenses }) => {
    const [adSpends, setAdSpends] = useState([]);
    const [newAdSpend, setNewAdSpend] = useState({ date: new Date().toLocaleDateString('en-CA'), amount: '' }); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Ad Spend data
    useEffect(() => {
        const q = query(collection(db, "ad_spends"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs?.map(doc => ({ id: doc.id, ...doc.data() }));
            setAdSpends(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddSpend = async (e) => {
        e.preventDefault();
        if (!newAdSpend.amount || !newAdSpend.date) return;
        
        try {
            await addDoc(collection(db, "ad_spends"), {
                date: newAdSpend.date, // Store as string for easy grouping
                amount: parseFloat(newAdSpend.amount),
                createdAt: serverTimestamp()
            });
            setNewAdSpend({ ...newAdSpend, amount: '' });
        } catch (error) {
            console.error("Error adding ad spend:", error);
            alert("Failed to save ad spend");
        }
    };

    const handleDeleteSpend = async (id) => {
        if(window.confirm('Delete this ad spend entry?')) {
            await deleteDoc(doc(db, "ad_spends", id));
        }
    };

    // Calculate Metrics
    const metrics = useMemo(() => {
        // 1. Revenue (From Delivered Orders Only)
        const deliveredOrders = orders?.filter(o => o.status === 'delivered');
        
        const totalRevenue = deliveredOrders?.reduce((sum, o) => {
            // total includes delivery charge in our system usually, but let's deduct delivery cost if we paid courier
            // For simple math: Revenue = sum of (price) 
            // If they paid deliveryCharge, we pay courier deliveryCharge, so net is roughly just price.
            return sum + (Number(o.price) || 0);
        }, 0);

        // 2. Product Cost (Cost of Goods Sold - COGS)
        // We will assume an average product cost if exact cost isn't in DB, or use a fixed percentage (e.g., 50%)
        // Actually, we have factory_expenses which covers manufacturing!
        
        // 3. Total Factory Expenses
        const totalFactoryExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // 4. Total Ad Spend
        const totalAdSpend = adSpends?.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

        // 5. Total Marketing + Overhead
        const totalCosts = totalFactoryExpenses + totalAdSpend;

        // 6. Net Profit
        const netProfit = totalRevenue - totalCosts;

        // 7. ROAS (Return On Ad Spend)
        const roas = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : 0;

        return {
            deliveredCount: deliveredOrders.length,
            totalRevenue,
            totalFactoryExpenses,
            totalAdSpend,
            totalCosts,
            netProfit,
            roas
        };
    }, [orders, expenses, adSpends]);

    if (isLoading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in text-slate-800 dark:text-white">
            <div>
                <h2 className="text-[#111827] dark:text-white text-xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">অ্যাডভান্সড প্রফিট এন্ড লস (P&L)</h2>
                <p className="text-slate-500 dark:text-zinc-300 font-medium mt-1">সর্বমোট রেভিনিউ, খরচ এবং প্রকৃত লাভের হিসাব</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group neo-card dark:border-white/5 ">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} className="text-indigo-600 dark:text-blue-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-widest mb-2">Total Revenue (Delivered)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight dark:text-white">৳{metrics.totalRevenue.toLocaleString()}</h3>
                    <p className="text-xs text-indigo-600 dark:text-blue-500 font-semibold mt-2">{metrics.deliveredCount} Orders Completed</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group neo-card dark:border-white/5 ">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={64} className="text-rose-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-300 uppercase tracking-widest mb-2">Total Expenses</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight dark:text-white">৳{metrics.totalCosts.toLocaleString()}</h3>
                    <p className="text-xs text-rose-600 font-semibold mt-2">Factory: ৳{metrics.totalFactoryExpenses} + Ads: ৳{metrics.totalAdSpend}</p>
                </div>

                <div className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden group ${metrics.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} className={metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${metrics.netProfit >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800'}`}>Net Profit</p>
                    <h3 className={`text-3xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {metrics.netProfit >= 0 ? '+' : '-'}৳{Math.abs(metrics.netProfit).toLocaleString()}
                    </h3>
                    <p className={`text-xs font-semibold mt-2 ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Overall Business Profit</p>
                </div>

                <div className="bg-[#0f172a] p-6 rounded-2xl shadow-sm relative overflow-hidden group text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} className="text-yellow-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Overall ROAS</p>
                    <h3 className="text-3xl font-black text-white">{metrics.roas}x</h3>
                    <p className="text-xs text-yellow-400 font-semibold mt-2">Return on Ad Spend</p>
                </div>
            </div>

            {/* Ad Spend Input & List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 neo-card dark:border-white/5 ">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={18}/> Add Daily Ad Spend</h3>
                    <form onSubmit={handleAddSpend} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase mb-1">Date</label>
                            <input 
                                type="date" 
                                required
                                value={newAdSpend.date}
                                onChange={e => setNewAdSpend({...newAdSpend, date: e.target.value})}
                                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-300 uppercase mb-1">Amount (BDT)</label>
                            <input 
                                type="number" 
                                required
                                placeholder="e.g. 5000"
                                value={newAdSpend.amount}
                                onChange={e => setNewAdSpend({...newAdSpend, amount: e.target.value})}
                                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-lg font-bold"
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#0f172a] text-white font-bold rounded-xl hover:bg-[#1e293b] transition-colors">
                            Save Ad Spend
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col neo-card dark:border-white/5 ">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Calendar size={18}/> Ad Spend History</h3>
                    <div className="overflow-y-auto flex-1 max-h-[400px] pr-2">
                        {adSpends.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 font-medium">No ad spend data recorded yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {adSpends?.map(spend => (
                                    <div key={spend.id} className="flex items-center justify-between p-4 bg-slate-50 neo-inset rounded-xl border border-slate-100 hover:border-indigo-200 dark:border-indigo-500/30 transition-colors group neo-bg">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{spend.date}</p>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-300 uppercase">Facebook / Google Ads</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-black text-rose-600 text-lg">-৳{spend.amount.toLocaleString()}</p>
                                            <button onClick={() => handleDeleteSpend(spend.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ProfitLossView;
