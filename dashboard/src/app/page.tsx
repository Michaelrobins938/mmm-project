"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BarChart3,
    Megaphone,
    Settings as SettingsIcon,
    Menu,
    ChevronLeft,
    Activity,
    Shield
} from 'lucide-react';

import Overview from '../components/views/Overview';
import Campaigns from '../components/views/Campaigns';
import Settings from '../components/views/Settings';
import Analytics from '../components/views/Analytics';

const views = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function MMMDashboard() {
    const [activeView, setActiveView] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex min-h-screen w-screen overflow-auto bg-[#020203] font-mono selection:bg-red-600/30 text-zinc-100">
            {/* Ambient Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <div className="scan-line" />

            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 300 : 80 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="relative h-full tactical-panel border-r border-white/5 z-50 flex flex-col flex-shrink-0"
            >
                <div className="p-8 border-b border-white/5 relative overflow-hidden flex-shrink-0">
                    <div className="flex items-center justify-between relative z-10">
                        <motion.div
                            animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -20 }}
                            className="flex items-center gap-3 overflow-hidden"
                        >
                            <div className="w-8 h-8 bg-red-600 rounded-sm flex items-center justify-center shadow-lg shadow-red-600/20 flex-shrink-0">
                                <Shield size={18} className="text-white" />
                            </div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase text-white whitespace-nowrap">
                                MMM<span className="neon-text-red">CORE</span>
                            </h1>
                        </motion.div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 glass-surface border border-white/10 text-zinc-500 hover:text-white transition-all hover:border-red-600/40 flex-shrink-0"
                        >
                            {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
                    {views.map((view) => {
                        const isActive = activeView === view.id;
                        const Icon = view.icon;

                        return (
                            <button
                                key={view.id}
                                onClick={() => setActiveView(view.id)}
                                className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all relative overflow-hidden group rounded-sm ${isActive
                                    ? 'bg-red-600/10 border-l-4 border-l-red-600 text-white shadow-[inset_10px_0_20px_rgba(229,9,20,0.05)]'
                                    : 'text-zinc-600 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} className={`${isActive ? 'text-red-500' : 'text-zinc-600 group-hover:text-zinc-300'} transition-colors flex-shrink-0`} />
                                <AnimatePresence mode="wait">
                                    {sidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                                        >
                                            {view.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute right-4 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-8 border-t border-white/5 flex-shrink-0">
                    <motion.div
                        className="flex items-center gap-3 text-[9px] font-black text-zinc-700 uppercase tracking-widest"
                    >
                        <Activity size={12} className="text-red-900/50" />
                        {sidebarOpen && <span>KERNEL_STABLE_V4.2</span>}
                    </motion.div>
                </div>
            </motion.aside>

            <main className="flex-1 h-full overflow-y-auto relative z-10 scrollbar-thin">
                <div className="p-8 md:p-14 max-w-[1600px] mx-auto min-h-full flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="flex-1"
                        >
                            {activeView === 'overview' && <Overview />}
                            {activeView === 'analytics' && <Analytics />}
                            {activeView === 'campaigns' && <Campaigns />}
                            {activeView === 'settings' && <Settings />}
                        </motion.div>
                    </AnimatePresence>

                    {/* Integrated Footer Visibility */}
                    <footer className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">
                        <div>BY_MAR_SCI_ENGINEERING</div>
                        <div className="flex gap-8">
                            <span>RE_HASH::4A1F29</span>
                            <span>CPU_LOAD::14.2%</span>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
