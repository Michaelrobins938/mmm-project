"use client";

import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    width?: string;
}

export default function Tooltip({ children, content, position = 'top', width = 'w-72' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
        left: 'right-full top-1/2 -translate-y-1/2 mr-3',
        right: 'left-full top-1/2 -translate-y-1/2 ml-3'
    };

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute z-[100] pointer-events-none ${positionClasses[position]} ${width}`}
                    >
                        <div className="relative glass-surface p-4 border border-red-600/30 shadow-[0_0_30px_rgba(229,9,20,0.15)] clip-modern">
                            <div className="flex items-start gap-3">
                                <HelpCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em]">Context_Analysis</div>
                                    <p className="text-[10px] font-bold text-zinc-200 leading-relaxed uppercase tracking-tight">
                                        {content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
