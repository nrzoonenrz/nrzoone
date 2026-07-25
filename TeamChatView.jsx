import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Send, User } from 'lucide-react';

const TeamChatView = ({ userRole }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const q = query(collection(db, 'team_chats'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs?.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'team_chats'), {
                text: newMessage,
                sender: userRole,
                timestamp: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    return (
        <div className="flex flex-col h-[80vh] bg-light-surface neo-card dark:border-white/5  border-none dark:border dark:border-white/5 rounded-[2rem] shadow-[10px_10px_20px_#c2c3c7,-10px_-10px_20px_#ffffff] dark:shadow-xl overflow-hidden text-light-text dark:text-dark-text animate-fade-in transition-colors duration-300">
            {/* Chat Header */}
            <div className="p-6 bg-transparent neo-bg/50 border-b border-light-bg dark:border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-light-text dark:text-white tracking-tight flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-light-purple dark:bg-dark-cyan dark:shadow-[0_0_8px_#00E5FF] animate-pulse"></span>
                        টিম চ্যাট (Internal)
                    </h2>
                    <p className="text-sm text-light-textMuted dark:text-dark-textMuted font-bold mt-1">End-to-end team communication</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-dark-textMuted font-bold">
                        কোনো মেসেজ নেই। চ্যাট শুরু করুন!
                    </div>
                )}
                {messages?.map((msg) => {
                    const isMe = msg.sender === userRole;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isMe ? 'bg-light-purple text-white dark:bg-dark-cyan dark:text-dark-bg' : 'bg-light-bg text-light-textMuted dark:bg-dark-border dark:text-dark-textMuted shadow-[inset_2px_2px_5px_#c2c3c7,inset_-2px_-2px_5px_#ffffff] dark:shadow-none'}`}>
                                    <User size={12} />
                                </div>
                                <span className="text-xs font-bold text-light-textMuted dark:text-dark-textMuted capitalize">{msg.sender}</span>
                                {msg.timestamp && (
                                    <span className="text-[10px] text-light-textMuted/60 dark:text-dark-textMuted/60 font-semibold">
                                        {new Date(msg.timestamp.toDate()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm font-semibold shadow-[5px_5px_10px_#c2c3c7,-5px_-5px_10px_#ffffff] dark:shadow-sm ${
                                isMe 
                                ? 'bg-light-purple text-white dark:bg-dark-cyan dark:text-dark-bg rounded-tr-none' 
                                : 'bg-light-surface neo-bg border-none dark:border dark:border-white/5 text-light-text dark:text-white rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-transparent neo-bg/50 border-t border-light-bg dark:border-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="আপনার মেসেজ লিখুন..."
                        className="flex-1 bg-light-surface neo-card dark:border-white/5  border-none dark:border dark:border-white/5 rounded-full px-6 py-4 text-light-text dark:text-white placeholder:text-light-textMuted/50 dark:placeholder:text-dark-textMuted/50 outline-none focus:ring-2 focus:ring-light-purple dark:focus:border-dark-cyan/50 dark:focus:ring-1 dark:focus:ring-dark-cyan transition-all font-semibold shadow-[inset_5px_5px_10px_#c2c3c7,inset_-5px_-5px_10px_#ffffff] dark:shadow-none"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="bg-light-purple text-white dark:bg-dark-cyan dark:text-dark-bg w-14 h-14 rounded-full flex items-center justify-center shadow-[5px_5px_10px_#c2c3c7,-5px_-5px_10px_#ffffff] dark:shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                    >
                        <Send size={20} className="ml-1" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TeamChatView;
