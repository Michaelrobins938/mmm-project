"use client";

import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, ComposedChart, Bar
} from 'recharts';
import { BarChart3, TrendingUp, Info, Activity, Globe, Zap, Target, PieChart, ActivitySquare } from 'lucide-react';
import StatCard from '../shared/StatCard';
import InfoPanel from '../shared/InfoPanel';
import Tooltip from '../shared/Tooltip';

const CHANNEL_PERFORMANCE = [
    { month: 'Jan', tv: 650, search: 820, social: 480, display: 220, roi: 1.2 },
    { month: 'Feb', tv: 590, search: 850, social: 520, display: 190, roi: 1.4 },
    { month: 'Mar', tv: 720, search: 890, social: 550, display: 240, roi: 1.3 },
    { month: 'Apr', tv: 680, search: 910, social: 580, display: 210, roi: 1.6 },
    { month: 'May', tv: 750, search: 950, social: 610, display: 250, roi: 1.8 },
    { month: 'Jun', tv: 800, search: 980, social: 640, display: 260, roi: 1.7 },
];

const ROI_COMPARISON = [
    { channel: 'TV', roi: 1.51, spend: 450000, color: '#ff3c3c' },
    { channel: 'Search', roi: 2.66, spend: 320000, color: '#00f2ff' },
    { channel: 'Social', roi: 1.50, spend: 280000, color: '#a855f7' },
    { channel: 'Display', roi: 1.50, spend: 120000, color: '#f59e0b' },
];

export default function Analytics() {
    const [viewMetrics, setViewMetrics] = useState<'revenue' | 'conversions'>('revenue');
    const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x: `${x}%`, y: `${y}%` });
    };

    const chartData = React.useMemo(() => {
        return CHANNEL_PERFORMANCE.map(item => ({
            ...item,
            tv_conv: Math.floor(item.tv * 1.2),
            search_conv: Math.floor(item.search * 0.8),
            social_conv: Math.floor(item.social * 1.5),
            display_conv: Math.floor(item.display * 0.5)
        }));
    }, []);

    return (
        <div
            className="relative space-y-12 animate-in slide-in-from-bottom duration-1000 p-2"
            onMouseMove={handleMouseMove}
            style={{ '--mouse-x': mousePos.x, '--mouse-y': mousePos.y } as any}
        >
            <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Tooltip content="Telemetry stream tracking discrete channel vectors and ROI propagation.">
                            <div className="px-4 py-1.5 glass-surface neon-border text-cyan-400 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 clip-tactical cursor-help transition-all hover:scale-105">
                                <ActivitySquare size={14} className="animate-pulse" />
                                ANALYTICS_STREAM::V2.0
                            </div>
                        </Tooltip>
                        <div className="h-px w-24 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] italic">DECOMPOSITION_ENGINE_RUNNING</span>
                    </div>
                    <div>
                        <h1 className="text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">
                            CHANNEL <br />
                            <span className="neon-text-cyan">ANALYTICS</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-6 max-w-2xl leading-relaxed uppercase tracking-tighter font-extrabold border-l-2 border-cyan-500/20 pl-6">
                            Precision telemetry for multi-channel <span className="text-zinc-300">expenditure efficiency</span>. Dynamic tracking of temporal ROI flux and marginal yield clusters.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard label="Avg Channel ROI" value="1.79x" trend="OPTIMAL" trendType="neutral" color="#00f2ff" />
                <StatCard label="Top Flux" value="Search" trend="+14% MOM" trendType="up" color="#ff3c3c" />
                <StatCard label="Velocity" value="High" trend="STABLE" trendType="neutral" color="#a855f7" />
                <StatCard label="Allocated" value="84%" trend="BUDGET" trendType="neutral" color="#22c55e" />
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8">
                    <div className="tactical-panel p-12 clip-tactical group border-l-4 border-l-cyan-600/30">
                        <div className="flex justify-between items-start mb-16">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 glass-surface flex items-center justify-center relative overflow-hidden group/icon">
                                    <div className="absolute inset-0 bg-cyan-600/10 group-hover/icon:bg-cyan-600/20 transition-colors" />
                                    <PieChart className="text-cyan-400 relative z-10" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Efficiency Evolution</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Temporal Yield Deconstruction</p>
                                </div>
                            </div>

                            <div className="flex bg-black/40 p-1.5 border border-white/5 backdrop-blur-xl">
                                {['revenue', 'conversions'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMetrics(mode as any)}
                                        className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${viewMetrics === mode ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-600/20' : 'text-zinc-600 hover:text-white'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[480px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTV" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff3c3c" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#ff3c3c" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#00f2ff" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}
                                    />
                                    <YAxis hide />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#22d3ee', color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={viewMetrics === 'revenue' ? 'tv' : 'tv_conv'}
                                        stroke="#ff3c3c"
                                        fill="url(#colorTV)"
                                        strokeWidth={4}
                                        name="TV_EXP_VEC"
                                        animationDuration={1500}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={viewMetrics === 'revenue' ? 'search' : 'search_conv'}
                                        stroke="#00f2ff"
                                        fill="url(#colorSearch)"
                                        strokeWidth={4}
                                        name="SEARCH_HUB_PRM"
                                        animationDuration={2000}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="roi"
                                        stroke="#ffffff"
                                        strokeDasharray="5 5"
                                        strokeWidth={1}
                                        dot={{ fill: '#ffffff', r: 4 }}
                                        name="AGGREGATE_ROI_VEC"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5">
                            <InfoPanel
                                title="Channel Analytics Context"
                                description="Interpreting Temporal ROI Flux"
                                details="The system tracks the 'Efficiency Gradient' across six months of data. Current Search dominance is driven by a 14% month-over-month increase in conversion velocity, while TV remains a stable baseline for brand anchor effects."
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <div className="tactical-panel p-12 clip-tactical h-full group border-l-4 border-l-red-600/30 overflow-hidden">
                        <div className="glow-orb bg-red-600/10" />

                        <div className="flex items-center gap-6 mb-16 relative z-10">
                            <div className="w-16 h-16 glass-surface flex items-center justify-center relative">
                                <Target className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Capital Mix</h3>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {ROI_COMPARISON.map((item, i) => (
                                <Tooltip
                                    key={i}
                                    content={`${item.channel} Intelligence Hub: ROI [${item.roi}x], Total Capital [${(item.spend / 1000).toFixed(0)}K].`}
                                    position="left"
                                >
                                    <div className="glass-surface p-8 relative overflow-hidden group/item cursor-help transition-all hover:bg-white/[0.03] border-l-2" style={{ borderLeftColor: item.color }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] group-hover/item:text-zinc-300 transition-colors">{item.channel} SOURCE</span>
                                            <span className={`text-4xl font-black italic ${item.roi > 2 ? 'neon-text-cyan' : 'text-zinc-100'}`}>
                                                {item.roi.toFixed(1)}x
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/40 overflow-hidden relative border border-white/5">
                                            <div
                                                className="h-full transition-all duration-[2s] shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                                style={{ width: `${(item.roi / 3) * 100}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                        <div className="mt-6 flex justify-between text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                                            <span>Deployed Capital</span>
                                            <span className="text-zinc-200">${(item.spend / 1000).toFixed(0)}K</span>
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>

                        <div className="mt-16">
                            <InfoPanel
                                title="Efficiency Vector Index"
                                description="Marginal ROI Benchmarks"
                                details="Search consistently outperforms baseline TV by a factor of 1.7x. The optimizer suggests maintaining current Search weight to capture existing high-intent surplus."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <footer className="pt-20 pb-12 flex flex-col md:flex-row items-center justify-between border-t border-white/5 gap-8">
                <div className="flex items-center gap-12">
                    <div className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">ANALYTICS_KERNEL::STABLE</div>
                    <div className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">BUFFER_CLEARANCE::99.9%</div>
                </div>
                <div className="text-[10px] font-black text-zinc-800 uppercase tracking-[1em]">MAR_SCI_INTEL_HUB_PRM</div>
            </footer>
        </div>
    );
}
