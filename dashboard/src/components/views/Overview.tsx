"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Cell, AreaChart, Area, LineChart, Line, ComposedChart
} from 'recharts';
import { ShieldCheck, Zap, Info, TrendingUp, Cpu, Activity, LayoutGrid, Download, RefreshCw, Box, Layers, PlaySquare } from 'lucide-react';
import StatCard from '../shared/StatCard';
import Tooltip from '../shared/Tooltip';
import InfoPanel from '../shared/InfoPanel';
import DiagnosticCard from '../shared/DiagnosticCard';

const CHANNEL_DATA = [
    { name: 'TV', revenue: 450, spend: 320, profit: 130, efficiency: 1.4 },
    { name: 'Search', revenue: 820, spend: 310, profit: 510, efficiency: 2.6 },
    { name: 'Social', revenue: 380, spend: 250, profit: 130, efficiency: 1.5 },
    { name: 'Display', revenue: 150, spend: 110, profit: 40, efficiency: 1.3 },
    { name: 'Email', revenue: 210, spend: 40, profit: 170, efficiency: 5.2 },
];

const SATURATION_DATA = [
    { spend: 0, revenue: 0, limit: 0 },
    { spend: 10, revenue: 40, limit: 180 },
    { spend: 20, revenue: 75, limit: 180 },
    { spend: 30, revenue: 105, limit: 180 },
    { spend: 40, revenue: 130, limit: 180 },
    { spend: 50, revenue: 150, limit: 180 },
    { spend: 60, revenue: 165, limit: 180 },
    { spend: 70, revenue: 175, limit: 180 },
    { spend: 80, revenue: 182, limit: 180 },
    { spend: 90, revenue: 187, limit: 180 },
    { spend: 100, revenue: 190, limit: 180 },
];

export default function Overview() {
    const [viewMode, setViewMode] = useState<'revenue' | 'profit'>('revenue');
    const [activeChannel, setActiveChannel] = useState('Search');
    const [totalBudget, setTotalBudget] = useState(1500000);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x: `${x}%`, y: `${y}%` });
    };

    const handleOptimize = () => {
        setIsOptimizing(true);
        setTimeout(() => setIsOptimizing(false), 2000);
    };

    const chartData = React.useMemo(() => {
        return CHANNEL_DATA.sort((a, b) => b[viewMode] - a[viewMode]);
    }, [viewMode]);

    return (
        <div
            className="relative space-y-12 animate-in fade-in duration-1000 p-2"
            onMouseMove={handleMouseMove}
            style={{ '--mouse-x': mousePos.x, '--mouse-y': mousePos.y } as any}
        >
            {/* High Fidelity Header */}
            <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Tooltip content="The core Bayesian engine version currently running. This ensures all calculations follow the V4.2 mathematical standards.">
                            <div className="px-4 py-1.5 glass-surface neon-border text-red-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 clip-tactical cursor-help group transition-all hover:scale-105">
                                <ShieldCheck size={14} className="animate-pulse" />
                                <span className="text-zinc-400">VERSION::</span>CORE_STABLE_V4.2
                            </div>
                        </Tooltip>
                        <div className="h-px w-24 bg-gradient-to-r from-red-600/50 to-transparent" />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-red-600 animate-ping" />
                            SYSTEM_ACTIVE
                        </span>
                    </div>
                    <div>
                        <h1 className="text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">
                            MEDIA MIX <br />
                            <span className="neon-text-red">OPTIMIZER</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-6 max-w-2xl leading-relaxed uppercase tracking-tighter font-extrabold border-l-2 border-red-600/20 pl-6">
                            Advanced multi-variate Bayesian decomposition engine specialized for <span className="text-zinc-300">cross-channel attribution</span> and strategic capital deployment modeling.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 mb-4">
                    <Tooltip content="Download technical telemetry package in .json format containing all posterior parameters.">
                        <button className="flex items-center gap-3 px-8 py-4 glass-surface text-[10px] font-black uppercase tracking-widest hover:border-red-500/50 transition-all group overflow-hidden relative">
                            <div className="absolute inset-0 bg-red-600/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                            <Download size={16} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                            <span className="relative z-10">Export_Telemetry</span>
                        </button>
                    </Tooltip>
                    <Tooltip content="Force immediate re-calibration of the MCMC chains using the latest ingested data streams.">
                        <button className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(229,9,20,0.3)] hover:bg-red-500 transition-all group clip-tactical">
                            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span className="relative z-10">Live_Model_Refresh</span>
                        </button>
                    </Tooltip>
                </div>
            </header>

            {/* Premium Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <Tooltip content="Return on Investment across all channels. Every $1 invested generates $1.84 in revenue. Higher values indicate more efficient marketing spend.">
                    <div>
                        <StatCard label="Aggregate ROI" value="1.84x" trend="+12.4%" trendType="up" color="#ff3c3c" />
                    </div>
                </Tooltip>
                <Tooltip content="Model confidence measures statistical reliability. 94.2% indicates extremely high confidence that attribution estimates are accurate. Values above 90% are considered excellent.">
                    <div>
                        <StatCard label="Model Confidence" value="94.2%" trend="OPTIMAL" trendType="neutral" color="#00f2ff" />
                    </div>
                </Tooltip>
                <Tooltip content="MCMC convergence diagnostic. R-hat values close to 1.0 (<1.05) indicate proper chain convergence. 1.02 shows the model has converged and results are reliable.">
                    <div>
                        <StatCard label="MCMC R-Hat" value="1.02" trend="STABLE" trendType="up" color="#22c55e" />
                    </div>
                </Tooltip>
                <Tooltip content="Estimated unique individuals reached across all media channels, accounting for deduplication and cross-device attribution.">
                    <div>
                        <StatCard label="Active Reach" value="2.4M" trend="GLOBAL" trendType="neutral" color="#a855f7" />
                    </div>
                </Tooltip>
            </div>

            {/* Multi-Stage Yield Analysis */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                    <div className="tactical-panel p-12 clip-tactical group border-l-4 border-l-red-600/30">
                        <div className="flex justify-between items-start mb-16">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 glass-surface flex items-center justify-center relative overflow-hidden group/icon">
                                    <div className="absolute inset-0 bg-red-600/10 group-hover/icon:bg-red-600/20 transition-colors" />
                                    <Activity className="text-red-500 relative z-10" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Yield Decomposition</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Layers size={12} className="text-zinc-600" />
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Incremental Contribution V2</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex bg-black/40 p-1.5 border border-white/5 backdrop-blur-xl">
                                {['revenue', 'profit'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode as any)}
                                        className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-red-600 text-white shadow-xl' : 'text-zinc-600 hover:text-white'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[450px] relative">
                            {/* Background Grid Lines for Chart */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="h-full w-px bg-white/5 absolute left-1/4" />
                                <div className="h-full w-px bg-white/5 absolute left-1/2" />
                                <div className="h-full w-px bg-white/5 absolute left-3/4" />
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#ff3c3c" stopOpacity={0.8} />
                                            <stop offset="50%" stopColor="#ff3c3c" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#ff3c3c" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="spendGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#27272a" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#09090b" stopOpacity={0.5} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }}
                                    />
                                    <Bar dataKey={viewMode} fill="url(#barGrad)" radius={[0, 4, 4, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.15} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="spend" fill="url(#spendGrad)" radius={[0, 4, 4, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5">
                            <InfoPanel
                                title="Attribution Decomposition Report"
                                description="Deep Learning Insights from the V4.2 Model"
                                details="The model has successfully isolated channel-specific lift from baseline performance with a 98% convergence rate. Revenue indicators suggest a significant halo effect originating from TV exposure, feeding into Search conversion spikes."
                                useCase="Observe the delta between 'Spent' and 'Revenue'. Email currently exhibits the highest marginal headroom, suggesting a primary scaling vector."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="tactical-panel p-10 clip-tactical group overflow-hidden">
                            <div className="glow-orb bg-red-600/10" />
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <Box size={20} className="text-zinc-500" />
                                    <h3 className="text-xl font-black italic uppercase tracking-tight">Saturation Node</h3>
                                </div>
                                <select
                                    className="bg-black/80 border border-white/10 text-white text-[10px] font-black uppercase px-6 py-3 focus:border-red-500 outline-none cursor-pointer transition-all hover:border-red-600/50"
                                    value={activeChannel}
                                    onChange={(e) => setActiveChannel(e.target.value)}
                                >
                                    <option>Search</option>
                                    <option>TV</option>
                                    <option>Social</option>
                                </select>
                            </div>
                            <div className="h-[280px] relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={SATURATION_DATA}>
                                        <defs>
                                            <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ff3c3c" stopOpacity={0.6} />
                                                <stop offset="100%" stopColor="#ff3c3c" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="spend" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10, fontWeight: 800 }} />
                                        <YAxis hide />
                                        <Area type="monotone" dataKey="revenue" stroke="#ff3c3c" strokeWidth={4} fill="url(#curveGrad)" />
                                        <Line type="stepAfter" dataKey="limit" stroke="#ffffff" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="tactical-panel p-10 clip-tactical group overflow-hidden">
                            <div className="glow-orb bg-cyan-600/10" />
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <TrendingUp size={20} className="text-zinc-500" />
                                <h3 className="text-xl font-black italic uppercase tracking-tight">Decay Vector</h3>
                            </div>
                            <div className="h-[280px] relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={Array.from({ length: 12 }, (_, i) => ({ lag: i, impact: Math.pow(0.7, i) }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="lag" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10, fontWeight: 800 }} />
                                        <YAxis hide />
                                        <Line type="basis" dataKey="impact" stroke="#00f2ff" strokeWidth={5} dot={false} />
                                        <Area type="basis" dataKey="impact" fill="#00f2ff" fillOpacity={0.1} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                    <div className="tactical-panel p-12 clip-tactical border-t-2 border-t-red-600 group overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-red-500 transition-all duration-700 group-hover:opacity-10 group-hover:scale-110">
                            <Cpu size={240} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                    <Zap size={24} className="text-red-500 animate-pulse" />
                                </div>
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter">
                                    Strategic <br />
                                    <span className="neon-text-red">Optimizer</span>
                                </h3>
                            </div>

                            <div className="space-y-16">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">ALLOCATION_LIMIT</label>
                                        <span className="text-4xl font-black italic text-zinc-200">${(totalBudget / 1000).toFixed(0)}K</span>
                                    </div>
                                    <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                        <input
                                            type="range"
                                            min="100000"
                                            max="5000000"
                                            step="100000"
                                            value={totalBudget}
                                            onChange={(e) => setTotalBudget(parseInt(e.target.value))}
                                            className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer accent-red-600 z-10"
                                        />
                                        <div className="absolute top-0 left-0 h-full bg-red-600 transition-all shadow-[0_0_20px_rgba(229,9,20,0.5)]" style={{ width: `${(totalBudget / 5000000) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {[
                                        { name: 'TV', pct: 45, color: '#ff3c3c' },
                                        { name: 'Search', pct: 32, color: '#00f2ff' },
                                        { name: 'Social', pct: 18, color: '#a855f7' },
                                        { name: 'Display', pct: 5, color: '#f59e0b' }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-4 group/bar">
                                            <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                                                <span className="text-zinc-500 group-hover/bar:text-white transition-colors">{item.name} // WEIGHT</span>
                                                <span className="text-white bg-white/5 px-3 py-0.5">{item.pct}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-900 overflow-hidden relative border border-white/5">
                                                <div
                                                    className="h-full transition-all duration-[1.5s] ease-out shadow-[0_0_15px_currentColor]"
                                                    style={{ width: `${item.pct}%`, backgroundColor: item.color, color: item.color }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleOptimize}
                                    disabled={isOptimizing}
                                    className={`w-full py-8 font-black italic uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn ${isOptimizing
                                            ? 'bg-zinc-800 text-zinc-600 cursor-wait'
                                            : 'bg-red-600 text-white hover:bg-neutral-100 hover:text-black shadow-[0_0_50px_rgba(229,9,20,0.3)]'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {isOptimizing ? <RefreshCw size={20} className="animate-spin" /> : <PlaySquare size={20} />}
                                        {isOptimizing ? 'PROVISIONING_GRADIENTS...' : 'RUN_OPTIMIZATION_V4'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="tactical-panel p-10 clip-tactical group border-l-4 border-l-emerald-600/30 overflow-hidden">
                        <div className="glow-orb bg-emerald-600/10" />
                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-1.5 h-6 bg-emerald-500" />
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">System Health</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <DiagnosticCard label="RMSE" value="0.024" />
                            <DiagnosticCard label="Divergence" value="0" />
                            <DiagnosticCard label="Accept" value="0.96" />
                            <DiagnosticCard label="Samples" value="4k" />
                        </div>
                    </div>
                </div>
            </div>

            <footer className="pt-20 pb-12 flex flex-col md:flex-row items-center justify-between border-t border-white/5 gap-8">
                <div className="flex items-center gap-12">
                    <div className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">SYSTEM_STATUS::SECURE</div>
                    <div className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">LAST_RUN::15:20:09</div>
                </div>
                <div className="text-[10px] font-black text-zinc-800 uppercase tracking-[1em]">MAR_SCI_INTEL_HUB_PRM</div>
            </footer>
        </div>
    );
}
