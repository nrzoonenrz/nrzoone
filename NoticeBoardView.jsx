import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { Bell, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

const NoticeBoardView = ({ userRole }) => {
    const [notices, setNotices] = useState([]);
    const [newNotice, setNewNotice] = useState('');
    const [isPriority, setIsPriority] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'notices'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const n = snapshot.docs?.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotices(n);
        });
        return () => unsubscribe();
    }, []);

    const handleAddNotice = async (e) => {
        e.preventDefault();
        if (!newNotice.trim()) return;

        try {
            await addDoc(collection(db, 'notices'), {
                text: newNotice,
                author: userRole,
                isPriority,
                timestamp: serverTimestamp()
            });
            setNewNotice('');
            setIsPriority(false);
        } catch (error) {
            console.error("Error adding notice: ", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("আপনি কি নিশ্চিত যে এই নোটিশটি মুছতে চান?")) return;
        try {
            await deleteDoc(doc(db, 'notices', id));
        } catch (error) {
            console.error("Error deleting notice: ", error);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in no-print text-light-text dark:text-dark-text transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-light-surface neo-card dark:border-white/5  rounded-2xl border-none dark:border dark:border-white/5 shadow-[5px_5px_10px_#c2c3c7,-5px_-5px_10px_#ffffff] dark:shadow-lg">
                    <Bell size={28} className="text-light-orange dark:text-dark-orange drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,159,67,0.5)]" />
                </div>
                <div>
                    <h2 className="text-[#111827] dark:text-white text-xl font-bold tracking-tight text-light-text dark:text-white drop-shadow-sm dark:drop-shadow-md">অফিসিয়াল নোটিশ বোর্ড</h2>
                    <p className="text-sm font-bold text-light-textMuted dark:text-dark-textMuted mt-1">Important announcements and updates</p>
                </div>
            </div>

            {(userRole === 'admin' || userRole === 'manager') && (
                <div className="bg-light-surface neo-card dark:border-white/5  border-none dark:border dark:border-white/5 p-6 md:p-8 rounded-[2rem] shadow-[10px_10px_20px_#c2c3c7,-10px_-10px_20px_#ffffff] dark:shadow-xl">
                    <h3 className="text-lg font-bold text-light-text dark:text-white mb-4 flex items-center gap-2">
                        <PlusCircle size={20} className="text-light-green dark:text-dark-cyan" /> নতুন নোটিশ যোগ করুন
                    </h3>
                    <form onSubmit={handleAddNotice} className="space-y-4">
                        <textarea
                            value={newNotice}
                            onChange={(e) => setNewNotice(e.target.value)}
                            placeholder="এখানে নোটিশ লিখুন..."
                            className="w-full h-32 bg-light-surface neo-bg border-none dark:border dark:border-white/5 rounded-xl px-6 py-4 text-light-text dark:text-white placeholder:text-light-textMuted/50 dark:placeholder:text-dark-textMuted/50 outline-none focus:ring-2 focus:ring-light-purple dark:focus:border-dark-cyan/50 dark:focus:ring-1 dark:focus:ring-dark-cyan transition-all font-semibold resize-none custom-scrollbar shadow-[inset_5px_5px_10px_#c2c3c7,inset_-5px_-5px_10px_#ffffff] dark:shadow-none"
                            required
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={isPriority}
                                    onChange={(e) => setIsPriority(e.target.checked)}
                                    className="hidden" 
                                />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isPriority ? 'bg-red-500 border-red-500 text-white shadow-[0_0_8px_rgba(255,71,87,0.5)]' : 'bg-light-surface neo-bg border-none dark:border dark:border-white/5 group-hover:border-red-500/50 shadow-[inset_2px_2px_5px_#c2c3c7,inset_-2px_-2px_5px_#ffffff] dark:shadow-none'}`}>
                                    {isPriority && <AlertCircle size={14} />}
                                </div>
                                <span className="text-sm font-bold text-light-textMuted dark:text-dark-textMuted group-hover:text-light-text dark:group-hover:text-white transition-colors">জরুরি নোটিশ (High Priority)</span>
                            </label>
                            
                            <button 
                                type="submit" 
                                className="px-8 py-3 bg-light-purple text-white dark:bg-dark-cyan dark:text-dark-bg font-black rounded-xl hover:shadow-[5px_5px_10px_#c2c3c7,-5px_-5px_10px_#ffffff] dark:hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all hover:-translate-y-1"
                            >
                                পাবলিশ করুন
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {notices.length === 0 && (
                    <div className="text-center p-12 border-2 border-dashed border-light-border dark:border-white/5 rounded-[2rem] text-light-textMuted dark:text-dark-textMuted font-bold">
                        এখনো কোনো নোটিশ দেওয়া হয়নি।
                    </div>
                )}
                {notices?.map(notice => (
                    <div key={notice.id} className={`p-6 rounded-[2rem] border-none dark:border transition-all hover:-translate-y-1 shadow-[10px_10px_20px_#c2c3c7,-10px_-10px_20px_#ffffff] dark:shadow-lg relative overflow-hidden ${notice.isPriority ? 'bg-light-surface neo-card dark:border-white/5  dark:border-dark-red/30' : 'bg-light-surface neo-card dark:border-white/5  dark:border-white/5 dark:hover:border-dark-cyan/30'}`}>
                        {notice.isPriority && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 dark:bg-dark-red/5 rounded-full blur-[30px] -mr-10 -mt-10"></div>
                        )}
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${notice.isPriority ? 'bg-red-500/20 text-red-600 dark:bg-dark-red/20 dark:text-dark-red border border-red-500/30 dark:border-dark-red/30' : 'bg-light-purple/20 text-light-purple dark:bg-dark-cyan/10 dark:text-dark-cyan border border-light-purple/30 dark:border-dark-cyan/20'}`}>
                                        {notice.isPriority ? 'জরুরি' : 'সাধারণ'}
                                    </span>
                                    <span className="text-xs font-bold text-light-textMuted dark:text-dark-textMuted capitalize">By: {notice.author}</span>
                                    {notice.timestamp && (
                                        <span className="text-xs font-semibold text-light-textMuted/60 dark:text-dark-textMuted/60">
                                            • {new Date(notice.timestamp.toDate()).toLocaleDateString('bn-BD')} {new Date(notice.timestamp.toDate()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-light-text dark:text-white font-semibold whitespace-pre-wrap leading-relaxed">{notice.text}</p>
                            </div>
                            
                            {(userRole === 'admin' || userRole === notice.author) && (
                                <button 
                                    onClick={() => handleDelete(notice.id)}
                                    className="p-2 text-light-textMuted dark:text-dark-textMuted hover:text-red-500 dark:hover:text-dark-red transition-colors rounded-lg hover:bg-red-500/10 dark:hover:bg-dark-red/10"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NoticeBoardView;
