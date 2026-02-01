"use client";

import React from 'react';
import { Plus, Play, Pause, MoreVertical, TrendingUp, Target, FileText, Calendar, Layers } from 'lucide-react';
import Tooltip from '../shared/Tooltip';
import InfoPanel from '../shared/InfoPanel';

interface Campaign {
    id: number;
    name: string;
    channel: 'TV' | 'Search' | 'Social' | 'Display';
    status: 'active' | 'paused' | 'completed';
    budget: number;
    spent: number;
    roi: number;
    conversions: number;
    startDate: string;
    endDate: string;
}

const CAMPAIGNS: Campaign[] = [
    { id: 1, name: 'Q1 Brand Awareness TV', channel: 'TV', status: 'active', budget: 450000, spent: 312000, roi: 1.51, conversions: 2450, startDate: '2026-01-01', endDate: '2026-03-31' },
    { id: 2, name: 'Search - High Intent Keywords', channel: 'Search', status: 'active', budget: 320000, spent: 285000, roi: 2.66, conversions: 8920, startDate: '2026-01-01', endDate: '2026-03-31' },
    { id: 3, name: 'Social Media Influencer Push', channel: 'Social', status: 'active', budget: 280000, spent: 195000, roi: 1.50, conversions: 3450, startDate: '2026-01-15', endDate: '2026-04-15' },
    { id: 4, name: 'Retargeting Display Campaign', channel: 'Display', status: 'paused', budget: 120000, spent: 98000, roi: 1.50, conversions: 1280, startDate: '2026-01-01', endDate: '2026-02-28' },
    { id: 5, name: 'Holiday Season TV Special', channel: 'TV', status: 'completed', budget: 380000, spent: 380000, roi: 1.62, conversions: 2100, startDate: '2025-12-01', endDate: '2025-12-31' },
];

const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = { 'TV': '#ff3c3c', 'Search': '#00f2ff', 'Social': '#a855f7', 'Display': '#f59e0b' };
    return colors[channel] || '#71717a';
};

const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string, text: string, border: string }> = {
        'active': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
        'paused': { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
        'completed': { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/30' }
    };
    return badges[status] || badges['completed'];
};

export default function Campaigns() {
    const [campaigns, setCampaigns] = React.useState(CAMPAIGNS);

    const toggleCampaignStatus = (id: number) => {
        setCampaigns(prev => prev.map(c => {
            if (c.id === id) {
                const newStatus = c.status === 'active' ? 'paused' : 'active';
                return { ...c, status: newStatus };
            }
            return c;
        }));
    };

    return (
        <div className="relative space-y-12 animate-in fade-in duration-1000">
            <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Tooltip content="Operational view for active marketing tasks. Directly connected to the Bayesian budget pool.">
                            <div className="px-3 py-1 glass-surface border-purple-500/20 text-purple-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 clip-tactical cursor-help">
                                <Layers size={12} />
                                CAMPAIGN_KERNEL_DEPICTION
                            </div>
                        </Tooltip>
                    </div>
                    <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">
                        CAMPAIGN <span className="neon-text-red">MANAGER</span>
                    </h1>
                </div>
                <Tooltip content="Open the deployment wizard to create a new campaign, define its budget, and select its expenditure channel.">
                    <button className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-black italic uppercase tracking-tighter text-sm shadow-2xl hover:bg-red-500 transition-all clip-tactical">
                        <Plus size={18} />
                        INITIATE_NEW_CAMPAIGN
                    </button>
                </Tooltip>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Tasks', value: '03', color: '#22c55e', tip: "Number of currently active expenditure vectors." },
                    { label: 'Deployed Capital', value: '$1.55M', color: '#ff3c3c', tip: "Total amount of budget already spent across all current initiatives." },
                    { label: 'Aggregate ROI', value: '1.76x', color: '#a855f7', tip: "The return multiplier for these specific campaigns." }
                ].map((stat, i) => (
                    <Tooltip key={i} content={stat.tip}>
                        <div className="tactical-panel p-8 clip-tactical border-l-4 cursor-help" style={{ borderLeftColor: stat.color }}>
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</div>
                            <div className="text-3xl font-black italic text-white tracking-tighter">{stat.value}</div>
                        </div>
                    </Tooltip>
                ))}
            </div>

            <div className="tactical-panel p-10 clip-tactical">
                <div className="grid grid-cols-12 gap-4 mb-10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 italic border-b border-white/5 pb-6">
                    <div className="col-span-4">IDENTIFIER_POOL</div>
                    <div className="col-span-2 text-center">VECTOR</div>
                    <div className="col-span-3 text-center">FLOW_ANALYSIS</div>
                    <div className="col-span-1 text-center">STATUS</div>
                    <div className="col-span-2 text-right">ACTION</div>
                </div>

                <div className="space-y-4">
                    {campaigns.map((campaign) => {
                        const spentPct = (campaign.spent / campaign.budget) * 100;
                        const badge = getStatusBadge(campaign.status);
                        const channelColor = getChannelColor(campaign.channel);

                        return (
                            <div key={campaign.id} className="glass-surface p-6 hover:border-white/20 transition-all group clip-tactical border-l-4" style={{ borderLeftColor: channelColor }}>
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-4">
                                        <h4 className="text-lg font-black italic text-white uppercase tracking-tight">{campaign.name}</h4>
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">PROP_ID::SYS_{campaign.startDate.replace(/-/g, '')}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <div className="px-4 py-1 glass-surface text-[10px] font-black uppercase tracking-widest" style={{ color: channelColor, borderColor: `${channelColor}40` }}>
                                            {campaign.channel}
                                        </div>
                                    </div>
                                    <div className="col-span-3 px-8">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-black text-white">${(campaign.spent / 1000).toFixed(0)}K</span>
                                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">/ ${(campaign.budget / 1000).toFixed(0)}K ({(spentPct).toFixed(0)}%)</span>
                                        </div>
                                        <Tooltip content={`Pacing Analysis: ${campaign.name} is ${spentPct.toFixed(0)}% through its allocated budget. Status is ${campaign.status}.`}>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden cursor-help">
                                                <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${spentPct}%`, backgroundColor: channelColor }} />
                                            </div>
                                        </Tooltip>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border ${badge.bg} ${badge.text} ${badge.border}`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-3">
                                        <Tooltip content={campaign.status === 'active' ? "Pause this campaign to cease all spend on this specific identifier." : "Resume spend on this campaign."}>
                                            <button onClick={() => toggleCampaignStatus(campaign.id)} className="p-3 glass-surface hover:text-white transition-all">
                                                {campaign.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                        </Tooltip>
                                        <Tooltip content="Open detailed telemetry report for this campaign.">
                                            <button className="p-3 glass-surface hover:text-white transition-all">
                                                <MoreVertical size={14} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <InfoPanel
                title="Campaign Orchestration Logic"
                description="Live Tactical Control Layer"
                details="This view connects your high-level Bayesian strategy to day-to-day operations. Each card represents an active budget initiative. When you 'Run Optimization' on the Overview page, these are the targets that get their budgets re-calculated."
                useCase="Monitor pacing. If a campaign is at 99% spend but has two weeks left in the month, use the 'More' menu to increase the budget or the 'Pause' button to prevent overspending."
                technical="Spend is pulled hourly via API. ROI is attributed via the same kernel used in the Analytics view, ensuring consistency between 'Execution' and 'Observation'."
            />
        </div>
    );
}
