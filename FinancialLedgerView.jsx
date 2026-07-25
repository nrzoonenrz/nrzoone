import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, Trash2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

const FinancialLedgerView = () => {
    const [transactions, setTransactions] = useState([]);
    const [shippedOrders, setShippedOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Income Form State (Courier)
    const [incomeData, setIncomeData] = useState({
        grossAmount: '',
        deliveryCharge: '',
        failCharge: '',
        description: 'কুরিয়ার পেমেন্ট'
    });

    // Expense Form State
    const [expenseData, setExpenseData] = useState({
        amount: '',
        category: 'fabric',
        description: ''
    });

    const expenseCategories = [
        { id: 'fabric', name: 'কাপড় / কাঁচামাল' },
        { id: 'worker_bill', name: 'ওয়ার্কার বিল' },
        { id: 'factory_bill', name: 'ফ্যাক্টরি খরচ' },
        { id: 'boost', name: 'মার্কেটিং / বুস্ট' },
        { id: 'other', name: 'অন্যান্য' }
    ];

    useEffect(() => {
        const q = query(collection(db, "financial_ledger"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach(d => list.push({ firebaseId: d.id, ...d.data() }));
            setTransactions(list);
        });

        // Fetch Shipped Orders for COD Receivables
        const orderQ = query(collection(db, "orders"), where("status", "==", "shipped"));
        const unsubOrders = onSnapshot(orderQ, (snapshot) => {
            let totalShippedValue = 0;
            snapshot.forEach(d => {
                totalShippedValue += (parseInt(d.data().total) || 0) + (parseInt(d.data().deliveryCharge) || 0);
            });
            setShippedOrders(totalShippedValue);
        });

        return () => { unsub(); unsubOrders(); };
    }, []);

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        const gross = parseInt(incomeData.grossAmount) || 0;
        const delivery = parseInt(incomeData.deliveryCharge) || 0;
        const fail = parseInt(incomeData.failCharge) || 0;
        const packagingCost = 15; // Hidden cost per entry
        
        const netCash = gross - delivery - fail - packagingCost;
        if (netCash <= 0) {
            alert('সঠিক অ্যামাউন্ট দিন!');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "financial_ledger"), {
                type: 'income',
                category: 'courier',
                grossAmount: gross,
                deductions: delivery + fail + packagingCost,
                netAmount: netCash,
                description: incomeData.description,
                date: new Date().toLocaleDateString('en-GB'),
                createdAt: serverTimestamp()
            });
            setIncomeData({ grossAmount: '', deliveryCharge: '', failCharge: '', description: 'কুরিয়ার পেমেন্ট' });
            alert('আয় সফলভাবে এন্ট্রি হয়েছে!');
        } catch (error) {
            console.error(error);
            alert('সমস্যা হয়েছে!');
        }
        setLoading(false);
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        const amt = parseInt(expenseData.amount) || 0;
        if (amt <= 0) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "financial_ledger"), {
                type: 'expense',
                category: expenseData.category,
                netAmount: amt,
                description: expenseData.description,
                date: new Date().toLocaleDateString('en-GB'),
                createdAt: serverTimestamp()
            });
            setExpenseData({ amount: '', category: 'fabric', description: '' });
            alert('খরচ সফলভাবে এন্ট্রি হয়েছে!');
        } catch (error) {
            console.error(error);
            alert('সমস্যা হয়েছে!');
        }
        setLoading(false);
    };

    const deleteTransaction = async (id) => {
        if (confirm('আপনি কি এই এন্ট্রি ডিলিট করতে চান?')) {
            await deleteDoc(doc(db, "financial_ledger", id));
        }
    };

    // Calculations
    const totalIncome = transactions?.filter(t => t.type === 'income')?.reduce((sum, t) => sum + (t.netAmount || 0), 0);
    const totalExpense = transactions?.filter(t => t.type === 'expense')?.reduce((sum, t) => sum + (t.netAmount || 0), 0);
    const netBalance = totalIncome - totalExpense;

    const [showForms, setShowForms] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-emerald-500 rounded-lg p-8 text-white shadow-sm shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="font-bold text-emerald-100 uppercase tracking-widest text-sm mb-2 flex items-center gap-2"><TrendingUp size={16}/> সর্বমোট আয় (জমা)</p>
                        <h2 className="text-[#111827] dark:text-white text-xl font-bold">৳ {totalIncome.toLocaleString()}</h2>
                    </div>
                    <TrendingUp className="absolute -bottom-4 -right-4 text-emerald-400/50" size={120} />
                </div>
                
                <div className="bg-rose-500 rounded-lg p-8 text-white shadow-sm shadow-rose-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="font-bold text-rose-100 uppercase tracking-widest text-sm mb-2 flex items-center gap-2"><TrendingDown size={16}/> সর্বমোট খরচ</p>
                        <h2 className="text-[#111827] dark:text-white text-xl font-bold">৳ {totalExpense.toLocaleString()}</h2>
                    </div>
                    <TrendingDown className="absolute -bottom-4 -right-4 text-rose-400/50" size={120} />
                </div>
                
                <div className="bg-[#0f172a] rounded-lg p-8 text-white shadow-sm shadow-slate-900/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm mb-2 flex items-center gap-2"><Wallet size={16}/> বর্তমান ব্যালেন্স (প্রফিট)</p>
                        <h2 className={`text-[#111827] dark:text-white text-xl font-bold ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                            ৳ {netBalance.toLocaleString()}
                        </h2>
                    </div>
                    <Wallet className="absolute -bottom-4 -right-4 text-slate-800 dark:text-white/50" size={120} />
                </div>
                <div className="bg-blue-900 rounded-lg p-8 text-white shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="font-bold text-blue-200 uppercase tracking-widest text-xs mb-2 flex items-center gap-2"><TrendingUp size={14}/> কুরিয়ার পাওনা (In Transit)</p>
                        <h2 className="text-[#111827] dark:text-white text-xl font-bold">৳ {shippedOrders.toLocaleString()}</h2>
                    </div>
                    <TrendingUp className="absolute -bottom-4 -right-4 text-indigo-800 dark:text-indigo-200/50" size={100} />
                </div>
            </div>

            {/* Toggle Button for Forms */}
            <div className="flex justify-center md:justify-start">
                <button 
                    onClick={() => setShowForms(!showForms)} 
                    className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2 ${
                        showForms 
                        ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                >
                    {showForms ? '❌ ক্যাশ ও খরচ এন্ট্রি ফর্ম বন্ধ করুন' : '➕ কুরিয়ার ক্যাশ ও খরচ এন্ট্রি করুন'}
                </button>
            </div>

            {/* Entry Forms */}
            {showForms && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                {/* Income Form */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 relative overflow-hidden neo-card dark:border-white/5 ">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <h3 className="text-[#111827] dark:text-white text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" /> কুরিয়ার ক্যাশ (আয়) এন্ট্রি
                    </h3>
                    <form onSubmit={handleIncomeSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">কুরিয়ার থেকে মোট রিসিভ (৳)</label>
                                <input required type="number" value={incomeData.grossAmount} onChange={e => setIncomeData({...incomeData, grossAmount: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-bold text-lg neo-bg" placeholder="5000" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">বিবরণ</label>
                                <input required type="text" value={incomeData.description} onChange={e => setIncomeData({...incomeData, description: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-bold neo-bg" placeholder="Pathao Payment" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">ডেলিভারি চার্জ কাটা হয়েছে (৳)</label>
                                <input type="number" value={incomeData.deliveryCharge} onChange={e => setIncomeData({...incomeData, deliveryCharge: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-rose-300 font-bold neo-bg" placeholder="250" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">রিটার্ন ফেইল চার্জ কাটা হয়েছে (৳)</label>
                                <input type="number" value={incomeData.failCharge} onChange={e => setIncomeData({...incomeData, failCharge: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-rose-300 font-bold neo-bg" placeholder="60" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">নেট ক্যাশ যোগ হবে</p>
                                <p className="text-[#111827] dark:text-white text-xl font-bold text-emerald-600">৳ {(parseInt(incomeData.grossAmount) || 0) - (parseInt(incomeData.deliveryCharge) || 0) - (parseInt(incomeData.failCharge) || 0)}</p>
                            </div>
                            <button type="submit" disabled={loading} className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-emerald-700 active:scale-95 transition-all">
                                জমা করুন
                            </button>
                        </div>
                    </form>
                </div>

                {/* Expense Form */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 relative overflow-hidden neo-card dark:border-white/5 ">
                    <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                    <h3 className="text-[#111827] dark:text-white text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-3">
                        <AlertCircle className="text-rose-500" /> খরচ এন্ট্রি
                    </h3>
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">খরচের পরিমাণ (৳)</label>
                                <input required type="number" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-rose-500 font-bold text-lg neo-bg" placeholder="2000" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">খরচের খাত</label>
                                <select value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-rose-500 font-bold appearance-none cursor-pointer neo-bg">
                                    {expenseCategories?.map(c => <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-300">বিস্তারিত বিবরণ</label>
                            <input required type="text" value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} className="w-full mt-1 px-4 py-3 bg-slate-50 neo-inset border-2 border-slate-100 rounded-xl outline-none focus:border-rose-500 font-bold neo-bg" placeholder="যেমন: ইসলামপুর থেকে কাপড় ক্রয়..." />
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button type="submit" disabled={loading} className="px-8 py-4 bg-rose-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-rose-700 active:scale-95 transition-all">
                                খরচ যুক্ত করুন
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            {/* Transactions List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 neo-card dark:border-white/5 ">
                <h3 className="text-xl font-bold uppercase text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-3 dark:text-white">
                    <Calendar className="text-slate-400" /> ক্যাশ হিস্টোরি ({transactions.length})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 neo-inset text-[10px] font-bold uppercase tracking-widest text-slate-400 neo-bg">
                                <th className="p-4 rounded-l-2xl">তারিখ</th>
                                <th className="p-4">বিবরণ</th>
                                <th className="p-4">খাত</th>
                                <th className="p-4 text-right">আয় (জমা)</th>
                                <th className="p-4 text-right">খরচ (ব্যায়)</th>
                                <th className="p-4 text-center rounded-r-2xl">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-semibold text-slate-700 dark:text-white">
                            {transactions?.map(t => (
                                <tr key={t.firebaseId} className="border-b border-slate-50 hover:bg-slate-50 neo-inset/50 transition-colors neo-bg">
                                    <td className="p-4">{t.date}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-900 dark:text-white tracking-tight dark:text-white">{t.description}</p>
                                        {t.type === 'income' && t.grossAmount && (
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Gross: {t.grossAmount} | Cuts: {t.deductions}</p>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-slate-100 neo-inset text-slate-500 dark:text-zinc-300 rounded-full text-[10px] font-bold uppercase tracking-wider neo-bg">
                                            {t.type === 'income' ? 'কুরিয়ার পেমেন্ট' : expenseCategories.find(c => c.id === t.category)?.name || t.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-emerald-600 font-bold text-base">{t.type === 'income' ? `+ ${t.netAmount}` : '-'}</td>
                                    <td className="p-4 text-right text-rose-600 font-bold text-base">{t.type === 'expense' ? `- ${t.netAmount}` : '-'}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => deleteTransaction(t.firebaseId)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                        কোনো এন্ট্রি পাওয়া যায়নি
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialLedgerView;
