import React, { useMemo, useState } from 'react';
import { Users, Search, Phone, Star, ShieldAlert, Award, Calendar } from 'lucide-react';

const CustomerDatabaseView = ({ orders }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const customers = useMemo(() => {
        const customerMap = {};

        orders.forEach(order => {
            if (!order.phone) return;
            const phone = order.phone.trim();
            if (!customerMap[phone]) {
                customerMap[phone] = {
                    phone,
                    name: order.name || 'Unknown',
                    totalOrders: 0,
                    deliveredOrders: 0,
                    returnedOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: order.date,
                    addresses: []
                };
            }
            
            const c = customerMap[phone];
            c.totalOrders++;
            
            // Keep the most recent name
            if (order.name && c.name === 'Unknown') c.name = order.name;
            
            // Collect unique addresses
            if (order.address && !c.addresses.includes(order.address)) {
                c.addresses.push(order.address);
            }

            if (order.status === 'delivered') {
                c.deliveredOrders++;
                c.totalSpent += (Number(order.total) || 0);
            }
            if (order.status === 'cancelled' || order.courierStatus?.includes('রিটার্ন')) {
                c.returnedOrders++;
            }
        });

        // Convert to array and calculate metrics
        const customerArray = Object.values(customerMap)?.map(c => {
            const returnRate = c.totalOrders > 0 ? (c.returnedOrders / c.totalOrders) * 100 : 0;
            
            let badge = null;
            if (c.deliveredOrders >= 3 || c.totalSpent > 5000) badge = { label: 'VIP Customer', color: 'bg-premium-gold text-white', icon: <Award size={12}/> };
            else if (c.deliveredOrders >= 2) badge = { label: 'Loyal', color: 'bg-indigo-600 dark:bg-white dark:text-black dark:border-none dark:hover:bg-zinc-200 text-white', icon: <Star size={12}/> };
            else if (returnRate >= 50 && c.totalOrders > 1) badge = { label: 'High Risk', color: 'bg-rose-600 text-white animate-pulse', icon: <ShieldAlert size={12}/> };

            return { ...c, returnRate, badge };
        });

        // Sort by total spent descending
        return customerArray.sort((a, b) => b.totalSpent - a.totalSpent);
    }, [orders]);

    const filteredCustomers = customers?.filter(c => 
        c.phone.includes(searchTerm) || c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in text-slate-800 dark:text-white">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-[#111827] dark:text-white text-xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight flex items-center gap-2"><Users size={24} className="text-indigo-600 dark:text-blue-500" /> কাস্টমার ডেটাবেস (CRM)</h2>
                    <p className="text-slate-500 dark:text-zinc-300 font-medium mt-1">লয়্যালটি ট্র্যাকিং এবং কাস্টমার লাইফটাইম ভ্যালু (LTV)</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="নাম বা মোবাইল নম্বর খুঁজুন..." 
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 shadow-sm neo-card dark:border-white/5 "
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden neo-card dark:border-white/5 ">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 neo-inset text-slate-500 dark:text-zinc-300 font-semibold uppercase text-[11px] tracking-widest border-b border-slate-100 neo-bg">
                            <tr>
                                <th className="px-6 py-4">কাস্টমার প্রোফাইল</th>
                                <th className="px-6 py-4">যোগাযোগের তথ্য</th>
                                <th className="px-6 py-4 text-center">মোট অর্ডার</th>
                                <th className="px-6 py-4 text-center">সাকসেস / রিটার্ন</th>
                                <th className="px-6 py-4 text-right">লাইফটাইম স্পেন্ড (LTV)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCustomers?.map(c => (
                                <tr key={c.phone} className="hover:bg-slate-50 neo-inset/50 transition-colors neo-bg">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white tracking-tight text-base dark:text-white">{c.name}</div>
                                        {c.badge && (
                                            <div className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${c.badge.color}`}>
                                                {c.badge.icon} {c.badge.label}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-semibold text-indigo-700">
                                            <Phone size={14} className="text-blue-400" /> {c.phone}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-zinc-300 mt-1 max-w-[200px] truncate" title={c.addresses[0]}>{c.addresses[0] || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-lg font-black text-slate-800 dark:text-white">{c.totalOrders}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex gap-2 text-xs font-bold">
                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{c.deliveredOrders} Success</span>
                                                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{c.returnedOrders} Returned</span>
                                            </div>
                                            {c.returnRate > 30 && <span className="text-[10px] text-rose-500 font-bold mt-1 uppercase">High Return Rate ({Math.round(c.returnRate)}%)</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight dark:text-white">৳{c.totalSpent.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1 flex items-center justify-end gap-1"><Calendar size={10}/> Last: {c.lastOrderDate}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerDatabaseView;
