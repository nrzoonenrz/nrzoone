import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from './CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const CartSidebar = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);

    const toggleDrawer = () => setIsOpen(!isOpen);

    return (
        <AnimatePresence>
            <div 
                id="cart-drawer"
                className="fixed top-0 right-0 w-full md:w-[450px] h-full z-[100] transform transition-transform duration-500 translate-x-full bg-light-bg text-light-text flex flex-col shadow-[-10px_0_20px_#a3b1c6]"
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
            >
                {/* Header */}
                <div className="p-6 bg-light-bg shadow-neu-flat m-4 rounded-[2rem] flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={24} className="text-light-purple" />
                        <h2 className="text-xl font-bold uppercase tracking-widest text-light-text text-slate-900 dark:text-white">আপনার ব্যাগ</h2>
                    </div>
                    <button 
                        onClick={() => {
                            const drawer = document.getElementById('cart-drawer');
                            if (drawer) drawer.style.transform = 'translateX(100%)';
                        }}
                        className="p-3 bg-light-bg text-light-text shadow-neu-flat rounded-full hover:shadow-neu-pressed transition-all active:shadow-neu-pressed"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                            <ShoppingBag size={80} />
                            <p className="text-xl font-bold uppercase tracking-widest">ব্যাগটি ফাঁকা</p>
                        </div>
                    ) : (
                        cartItems?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-5 bg-light-bg shadow-neu-pressed rounded-3xl relative group">
                                <div className="w-24 h-32 rounded-xl overflow-hidden bg-light-bg shadow-neu-flat p-1">
                                    <img loading="lazy" src={item.image || "/placeholder_item.jpg"} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-800 leading-tight dark:text-white">{item.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{item.color} | {item.size}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center bg-light-bg shadow-neu-flat p-2 rounded-xl">
                                            <button onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)} className="p-1 text-light-textMuted hover:text-light-purple active:shadow-neu-pressed rounded-md transition-all"><Minus size={14} /></button>
                                            <span className="w-8 text-center font-bold text-sm text-light-text">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)} className="p-1 text-light-textMuted hover:text-light-purple active:shadow-neu-pressed rounded-md transition-all"><Plus size={14} /></button>
                                        </div>
                                        <p className="font-bold text-[#FF4D6D]">{item.price * item.quantity} ৳</p>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id, item.color, item.size)}
                                        className="absolute top-4 right-4 p-2 bg-light-bg shadow-neu-flat rounded-full text-light-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:shadow-neu-pressed"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-8 bg-light-bg shadow-[0_-10px_20px_#a3b1c6] space-y-6 z-10 rounded-t-[2rem]">
                        <div className="flex justify-between items-center text-xl font-bold italic text-light-text">
                            <span>সর্বমোট:</span>
                            <span className="text-light-purple">{cartTotal} ৳</span>
                        </div>
                        <button 
                            onClick={() => {
                                const orderForm = document.getElementById('order-form') || document.querySelector('form');
                                if (orderForm) {
                                    orderForm.scrollIntoView({ behavior: 'smooth' });
                                    const drawer = document.getElementById('cart-drawer');
                                    if (drawer) drawer.style.transform = 'translateX(100%)';
                                } else {
                                    window.location.href = '/#form';
                                }
                            }}
                            className="w-full bg-light-bg text-light-purple py-5 rounded-2xl font-black text-xl shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed transition-all flex items-center justify-center gap-3 group"
                        >
                            সরাসরি চেকআউট <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                        <p className="text-[10px] text-center text-light-textMuted font-bold uppercase tracking-widest">সকল মূল্য অন্তর্ভুক্ত (কুরিয়ার চার্জ ছাড়া)</p>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};

export default CartSidebar;
