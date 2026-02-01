"use client";

import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface InfoPanelProps {
    title: string;
    description: string;
    details: string;
    useCase?: string;
    technical?: string;
}

export default function InfoPanel({ title, description, details, useCase, technical }: InfoPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="tactical-panel p-6 mt-8 rounded-sm bg-gradient-to-br from-zinc-900/40 to-black border border-white/5 shadow-2xl overflow-hidden group">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between group/btn"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 glass-surface flex items-center justify-center rounded-sm transition-all group-hover/btn:border-red-600/50">
                        <BookOpen size={18} className="text-red-500" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                            {title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tight">
                            {description}
                        </p>
                    </div>
                </div>
                <div className={`p-2 glass-surface rounded-full transition-all ${isExpanded ? 'rotate-180 text-red-500' : 'text-zinc-600'}`}>
                    <ChevronDown size={16} />
                </div>
            </button>

            {isExpanded && (
                <div className="mt-8 space-y-8 pt-8 border-t border-white/5 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-3 bg-red-600" />
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                    Functional_Overview
                                </h5>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed italic">
                                {details}
                            </p>
                        </div>

                        {useCase && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-3 bg-blue-600" />
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                        Strategic_Impact
                                    </h5>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed italic">
                                    {useCase}
                                </p>
                            </div>
                        )}
                    </div>

                    {technical && (
                        <div className="p-5 glass-surface border-l-2 border-l-zinc-700 bg-black/40">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-3 bg-zinc-600" />
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                                    Kernel_Telemetry_Specifications
                                </h5>
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                                {technical}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
