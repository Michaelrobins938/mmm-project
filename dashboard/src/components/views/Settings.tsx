"use client";

import React, { useState } from 'react';
import { Save, RefreshCw, Download, Upload, Cpu, Globe, Zap, Shield, FileOutput, FileInput } from 'lucide-react';
import Tooltip from '../shared/Tooltip';
import InfoPanel from '../shared/InfoPanel';

const DEFAULT_SETTINGS = {
    model: { adstockDecay: 0.70, hillAlpha: 0.50, hillGamma: 0.50 },
    data: { startDate: '2025-01-01', targetMetric: 'revenue', baselineMethod: 'control' },
    optimization: { objective: 'roi', minBudget: 100000, maxBudget: 5000000 }
};

const SETTING_INTEL = {
    adstockDecay: "The rate at which ad impact disappears over time. 0.7 means 70% of impact remains the next day.",
    hillAlpha: "Determines the maximum possible revenue achievable (the 'Ceiling'). Higher = higher theoretical plateau.",
    hillGamma: "Determines the 'S' shape of the curve. Affects how quickly you hit diminishing returns.",
    targetMetric: "The variable the model is trying to optimize. 'Revenue' is standard for business growth.",
    baselineMethod: "How the model accounts for sales that would have happened without any ads at all.",
    objective: "The mathematical goal of the optimizer. 'ROI' focuses on efficiency; 'Volume' focuses on scale.",
};

export default function Settings() {
    const [activeSection, setActiveSection] = useState('model');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const sections = [
        { id: 'model', title: 'Parameters', icon: <Cpu size={16} />, tip: "Adjust the fundamental Bayesian priors and decay constants for the attribution engine." },
        { id: 'data', title: 'Data Flow', icon: <Globe size={16} />, tip: "Configure your data sources, target variables, and baseline exclusion methods." },
        { id: 'optimization', title: 'Strategy', icon: <Zap size={16} />, tip: "Define the optimizer's constraints, floor/ceiling budgets, and target objectives." }
    ];

    const updateSetting = (section: string, key: string, value: any) => {
        setSettings(prev => ({ ...prev, [section]: { ...prev[section as keyof typeof prev], [key]: value } }));
    };

    return (
        <div className="relative space-y-12 animate-in fade-in duration-1000">
            <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Tooltip content="System administration shell. Modifying these values will require a model re-refresh.">
                            <div className="px-3 py-1 glass-surface border-amber-500/20 text-amber-500 text-[10px] font-black tracking-widest uppercase flex items-center gap-2 clip-tactical cursor-help">
                                <Shield size={12} />
                                SYSTEM_CONFIG_V4.0
                            </div>
                        </Tooltip>
                    </div>
                    <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-none">
                        SYSTEM <span className="neon-text-red">SETTINGS</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <Tooltip content="Export the entire configuration object to a local file for backup or cloning.">
                        <button className="flex items-center gap-2 px-6 py-3 glass-surface text-[10px] font-black uppercase tracking-widest clip-tactical group">
                            <FileOutput size={14} className="group-hover:text-red-500 transition-colors" />
                            Export_Config
                        </button>
                    </Tooltip>
                    <Tooltip content="Commit all current changes and trigger a full mathematical re-synchronization of the dashboard.">
                        <button className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-black italic uppercase tracking-tighter text-sm shadow-2xl hover:bg-red-500 transition-all clip-tactical group">
                            <Save size={16} />
                            COMMIT_CHANGES
                        </button>
                    </Tooltip>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    {sections.map(section => (
                        <Tooltip key={section.id} content={section.tip} position="right">
                            <button
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-4 px-6 py-5 tactical-panel transition-all clip-tactical group ${activeSection === section.id ? 'border-l-4 border-l-red-600 bg-red-600/5' : 'text-zinc-600 hover:text-white'}`}
                            >
                                <div className={activeSection === section.id ? 'text-red-500' : 'text-zinc-700'}>{section.icon}</div>
                                <div className="text-left">
                                    <div className="text-[10px] font-black uppercase tracking-widest">{section.title}</div>
                                    <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-tighter">SEC_ID_{section.id}</div>
                                </div>
                            </button>
                        </Tooltip>
                    ))}
                </div>

                <div className="col-span-12 lg:col-span-9">
                    <div className="tactical-panel p-12 clip-tactical">
                        <div className="flex justify-between items-center mb-12 pb-6 border-b border-white/5">
                            <h3 className="text-2xl font-black italic uppercase tracking-tight">{activeSection.toUpperCase()} CONFIGURATION</h3>
                            <Tooltip content="Reset all settings in this section back to the system factory defaults.">
                                <button className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white flex items-center gap-2 transition-colors">
                                    <RefreshCw size={12} />
                                    Purge_To_Defaults
                                </button>
                            </Tooltip>
                        </div>

                        <div className="space-y-8">
                            {Object.entries(settings[activeSection as keyof typeof settings]).map(([key, val]) => (
                                <Tooltip key={key} content={SETTING_INTEL[key as keyof typeof SETTING_INTEL] || "System parameter governing Bayesian computation flow."} position="top" width="w-80">
                                    <div className="glass-surface p-8 clip-tactical border-l-2 border-l-zinc-800 hover:border-l-red-600 transition-all cursor-help">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <label className="text-base font-black italic uppercase tracking-tight text-white block mb-1">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">PROP::{key}</span>
                                            </div>
                                            {typeof val === 'number' && (
                                                <span className="text-3xl font-black italic text-red-600 neon-text-red">{val.toFixed(2)}</span>
                                            )}
                                        </div>
                                        {typeof val === 'number' ? (
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={val}
                                                onChange={(e) => updateSetting(activeSection, key, parseFloat(e.target.value))}
                                                className="w-full h-1 bg-zinc-900 appearance-none cursor-pointer accent-red-600"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={val}
                                                onChange={(e) => updateSetting(activeSection, key, e.target.value)}
                                                className="w-full bg-black/50 border border-white/5 text-white text-[11px] font-bold p-4 focus:border-red-600 outline-none"
                                            />
                                        )}
                                    </div>
                                </Tooltip>
                            ))}
                        </div>

                        <InfoPanel
                            title="Configuration Logic and Bayesian Stability"
                            description="Tuning the Attribution Kernel"
                            details="Parameters managed here influence the Bayesian posterior distribution directly. Modification without statistical validation is not recommended, as it can bias the model toward specific channels if priors are set too aggressively."
                            useCase="Use 'Parameters' to tune for your specific business. If you know your sales cycle is very long, increase 'Adstock Decay'. If you are in a niche market with a low audience ceiling, decrease 'Hill Alpha'."
                            technical="These settings feed directly into the PyMC model specification. The Hill Alpha/Gamma parameters control the non-linear saturation transform, while Adstock Decay controls the geometric carry-over effect."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
