import React, { useState, useMemo } from 'react';
import { Truck, Package, AlertCircle, CheckCircle, RefreshCw, TrendingDown, ArrowDownCircle, ArrowUpCircle, Search, Calendar, XCircle } from 'lucide-react';

const CourierTrackingView = ({ orders, isAdmin, onUpdateOrder }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // Courier statuses
    const COURIER_STATUSES = [
        { value: 'কুরিয়ার প্রসেসিং', label: '📦 কুরিয়ার প্রসেসিং', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/30' },
        { value: 'কুরিয়ারে দিয়েছি', label: '🚚 কুরিয়ারে দিয়েছি', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/30' },
        { value: 'ডেলিভারি হয়েছে', label: '✅ ডেলিভারি হয়েছে', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-500/30' },
        { value: 'রিটার্ন', label: '🔄 রিটার্ন', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-500/30' },
        { value: 'হারিয়ে গেছে', label: '❌ হারিয়ে গেছে', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-500/30' },
        { value: 'ডেলিভারি ফেইল', label: '⚠️ ডেলিভারি ফেইল', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30' },
        { value: 'পেমেন্ট পেয়েছি', label: '💰 পেমেন্ট পেয়েছি', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30' },
    ];

    // Filter orders that are in courier process
    const courierOrders = useMemo(() => {
        return orders?.filter(order => {
            const status = order.courierStatus || order.status || '';
            const isCourier = status.includes('কুরিয়ার') || status.includes('ডেলিভারি') || status.includes('রিটার্ন') || status.includes('হারিয়ে') || status.includes('পেমেন্ট') || order.trackingId;
            
            // Status filter
            if (statusFilter !== 'all' && (order.courierStatus || '') !== statusFilter) return false;
            
            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchName = (order.name || '').toLowerCase().includes(term);
                const matchPhone = (order.phone || '').toLowerCase().includes(term);
                const matchTracking = (order.trackingId || '').toLowerCase().includes(term);
                const matchId = (order.firebaseId || '').toLowerCase().includes(term);
                if (!matchName && !matchPhone && !matchTracking && !matchId) return false;
            }

            // Date filter
            if (dateFrom || dateTo) {
                const orderDate = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt || 0);
                const orderDateStr = orderDate.toISOString().split('T')[0];
                if (dateFrom && orderDateStr < dateFrom) return false;
                if (dateTo && orderDateStr > dateTo) return false;
            }

            return true;
        });
    }, [orders, statusFilter, searchTerm, dateFrom, dateTo]);

    // Calculate summary stats
    const stats = useMemo(() => {
        const allCourierOrders = orders?.filter(o => o.courierStatus || o.trackingId);
        
        const delivered = allCourierOrders?.filter(o => o.courierStatus === 'ডেলিভারি হয়েছে' || o.courierStatus === 'পেমেন্ট পেয়েছি');
        const returned = allCourierOrders?.filter(o => o.courierStatus === 'রিটার্ন');
        const lost = allCourierOrders?.filter(o => o.courierStatus === 'হারিয়ে গেছে');
        const failed = allCourierOrders?.filter(o => o.courierStatus === 'ডেলিভারি ফেইল');
        const inTransit = allCourierOrders?.filter(o => o.courierStatus === 'কুরিয়ারে দিয়েছি');
        const processing = allCourierOrders?.filter(o => o.courierStatus === 'কুরিয়ার প্রসেসিং');
        const paid = allCourierOrders?.filter(o => o.courierStatus === 'পেমেন্ট পেয়েছি');

        const totalDeliveryCharge = allCourierOrders?.reduce((sum, o) => sum + (parseFloat(o.deliveryCharge) || 0), 0);
        const totalReturnCharge = returned?.reduce((sum, o) => sum + (parseFloat(o.returnCharge) || 0), 0);
        const totalCOD = paid?.reduce((sum, o) => sum + (parseFloat(o.codAmount) || parseFloat(o.total) || 0), 0);
        const totalLoss = lost?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const netAmount = totalCOD - totalDeliveryCharge - totalReturnCharge;

        return {
            total: allCourierOrders.length,
            delivered: delivered.length,
            returned: returned.length,
            lost: lost.length,
            failed: failed.length,
            inTransit: inTransit.length,
            processing: processing.length,
            paid: paid.length,
            totalDeliveryCharge,
            totalReturnCharge,
            totalCOD,
            totalLoss,
            netAmount,
        };
    }, [orders]);

    const handleSaveEdit = (order) => {
        if (onUpdateOrder) {
            onUpdateOrder(order.firebaseId, {
                courierStatus: editData.courierStatus || order.courierStatus || '',
                deliveryCharge: parseFloat(editData.deliveryCharge) || 0,
                returnCharge: parseFloat(editData.returnCharge) || 0,
                codAmount: parseFloat(editData.codAmount) || 0,
                courierName: editData.courierName || order.courierName || '',
                courierNote: editData.courierNote || '',
            });
        }
        setEditingId(null);
        setEditData({});
    };

    const startEdit = (order) => {
        setEditingId(order.firebaseId);
        setEditData({
            courierStatus: order.courierStatus || '',
            deliveryCharge: order.deliveryCharge || '',
            returnCharge: order.returnCharge || '',
            codAmount: order.codAmount || order.total || '',
            courierName: order.courierName || '',
            courierNote: order.courierNote || '',
        });
    };

    const getStatusBadge = (status) => {
        const found = COURIER_STATUSES.find(s => s.value === status);
        if (found) return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${found.color}`}>{found.label}</span>;
        return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-600 border-gray-200 dark:text-zinc-300">📋 {status || 'স্ট্যাটাস নেই'}</span>;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white underline decoration-slate-100 underline-offset-[16px]">
                🚚 কুরিয়ার ট্র্যাকিং ও হিসাব
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                    { label: 'মোট প্রসেসিং', value: stats.processing, icon: <Package size={20} />, color: 'text-indigo-600 dark:text-blue-500 bg-indigo-50/50 border-blue-100' },
                    { label: 'কুরিয়ারে আছে', value: stats.inTransit, icon: <Truck size={20} />, color: 'text-indigo-600 dark:text-blue-500 bg-indigo-50 border-indigo-100' },
                    { label: 'ডেলিভারি সফল', value: stats.delivered, icon: <CheckCircle size={20} />, color: 'text-green-600 bg-green-50 border-green-100' },
                    { label: 'রিটার্ন', value: stats.returned, icon: <RefreshCw size={20} />, color: 'text-orange-600 bg-orange-50 border-orange-100' },
                    { label: 'হারিয়ে গেছে', value: stats.lost, icon: <XCircle size={20} />, color: 'text-red-600 bg-red-50 border-red-100' },
                    { label: 'ডেলিভারি ফেইল', value: stats.failed, icon: <AlertCircle size={20} />, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'পেমেন্ট পেয়েছি', value: stats.paid, icon: <CheckCircle size={20} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                ]?.map(card => (
                    <div key={card.label} className={`rounded-xl border p-4 ${card.color} transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-xs font-semibold">{card.label}</span></div>
                        <p className="text-[#111827] dark:text-white text-xl font-black">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                    { label: '💰 মোট COD আদায়', value: `৳${stats.totalCOD.toLocaleString('bn-BD')}`, color: 'bg-emerald-50 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200' },
                    { label: '🚚 মোট ডেলিভারি চার্জ', value: `৳${stats.totalDeliveryCharge.toLocaleString('bn-BD')}`, color: 'bg-indigo-50/50 border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-200' },
                    { label: '🔄 মোট রিটার্ন চার্জ', value: `৳${stats.totalReturnCharge.toLocaleString('bn-BD')}`, color: 'bg-orange-50 border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-200' },
                    { label: '❌ হারানোর ক্ষতি', value: `৳${stats.totalLoss.toLocaleString('bn-BD')}`, color: 'bg-red-50 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200' },
                    { label: '📊 নেট আয় (চার্জ বাদে)', value: `৳${stats.netAmount.toLocaleString('bn-BD')}`, color: stats.netAmount >= 0 ? 'bg-green-50 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200' },
                ]?.map(card => (
                    <div key={card.label} className={`rounded-xl border-2 p-4 ${card.color} text-center`}>
                        <p className="text-xs font-bold mb-1">{card.label}</p>
                        <p className="text-xl font-black">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 neo-card dark:border-white/5 ">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="নাম, ফোন বা ট্র্যাকিং আইডি..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="all">সব স্ট্যাটাস</option>
                        {COURIER_STATUSES?.map(s => (
                            <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="From"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="To"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden neo-card dark:border-white/5 ">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 dark:text-white">কুরিয়ার অর্ডার তালিকা ({courierOrders.length}টি)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 neo-inset text-slate-600 dark:text-zinc-300 text-xs uppercase neo-bg">
                            <tr>
                                <th className="px-4 py-3 text-left">তারিখ</th>
                                <th className="px-4 py-3 text-left">কাস্টমার</th>
                                <th className="px-4 py-3 text-left">ফোন</th>
                                <th className="px-4 py-3 text-left">প্রোডাক্ট</th>
                                <th className="px-4 py-3 text-right">মোট টাকা</th>
                                <th className="px-4 py-3 text-left">ট্র্যাকিং</th>
                                <th className="px-4 py-3 text-left">কুরিয়ার স্ট্যাটাস</th>
                                <th className="px-4 py-3 text-right">ডেলিভারি চার্জ</th>
                                <th className="px-4 py-3 text-right">রিটার্ন চার্জ</th>
                                <th className="px-4 py-3 text-right">COD আদায়</th>
                                {isAdmin && <th className="px-4 py-3 text-center">অ্যাকশন</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {courierOrders.length === 0 ? (
                                <tr><td colSpan="11" className="text-center py-12 text-slate-400">কোনো কুরিয়ার অর্ডার পাওয়া যায়নি</td></tr>
                            ) : courierOrders?.map(order => (
                                <tr key={order.firebaseId} className="hover:bg-slate-50 neo-inset transition-colors neo-bg">
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-zinc-300 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{order.name || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-300">{order.phone || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-300 text-xs max-w-[150px] truncate">{order.items?.map(i => i.name || i.color).join(', ') || order.productName || '-'}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-white">৳{(order.total || 0).toLocaleString('bn-BD')}</td>
                                    <td className="px-4 py-3 text-xs text-indigo-600 dark:text-blue-500 font-mono">{order.trackingId || '-'}</td>
                                    
                                    {editingId === order.firebaseId ? (
                                        <>
                                            <td className="px-4 py-3">
                                                <select value={editData.courierStatus} onChange={e => setEditData({...editData, courierStatus: e.target.value})} className="w-full text-xs px-2 py-1 rounded border border-slate-200 dark:border-white/5 neo-inset">
                                                    <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" value="">স্ট্যাটাস নির্বাচন</option>
                                                    {COURIER_STATUSES?.map(s => <option className="bg-white text-black dark:bg-[#2A2A2E] dark:text-white" key={s.value} value={s.value}>{s.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3"><input type="number" value={editData.deliveryCharge} onChange={e => setEditData({...editData, deliveryCharge: e.target.value})} className="w-20 text-xs px-2 py-1 rounded border border-slate-200 text-right" placeholder="০" /></td>
                                            <td className="px-4 py-3"><input type="number" value={editData.returnCharge} onChange={e => setEditData({...editData, returnCharge: e.target.value})} className="w-20 text-xs px-2 py-1 rounded border border-slate-200 text-right" placeholder="০" /></td>
                                            <td className="px-4 py-3"><input type="number" value={editData.codAmount} onChange={e => setEditData({...editData, codAmount: e.target.value})} className="w-24 text-xs px-2 py-1 rounded border border-slate-200 text-right" placeholder="০" /></td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button onClick={() => handleSaveEdit(order)} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg mr-1 hover:bg-green-700">সেভ</button>
                                                <button onClick={() => { setEditingId(null); setEditData({}); }} className="px-3 py-1 bg-slate-200 text-slate-700 dark:text-white text-xs rounded-lg hover:bg-slate-300">বাতিল</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-3">{getStatusBadge(order.courierStatus)}</td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-300">৳{(order.deliveryCharge || 0).toLocaleString('bn-BD')}</td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-300">৳{(order.returnCharge || 0).toLocaleString('bn-BD')}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700">৳{(order.codAmount || 0).toLocaleString('bn-BD')}</td>
                                            {isAdmin && (
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => startEdit(order)} className="px-3 py-1.5 bg-[#111827] text-white text-xs rounded-lg hover:bg-[#1F2937] transition-all">
                                                        আপডেট
                                                    </button>
                                                </td>
                                            )}
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CourierTrackingView;
