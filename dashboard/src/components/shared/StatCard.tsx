export interface StatCardProps {
    label: string;
    value: string | number;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    color?: string;
}

export default function StatCard({ label, value, trend, trendType = 'neutral', color = '#ff3c3c' }: StatCardProps) {
    return (
        <div className="stat-card-premium group clip-tactical">
            {/* Volumetric Glow Orb */}
            <div
                className="glow-orb"
                style={{ backgroundColor: color }}
            />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] italic">
                        {label}
                    </span>
                </div>

                <div className="flex items-end justify-between">
                    <span className="text-4xl font-black italic tracking-tighter text-white">
                        {value}
                    </span>

                    {trend && (
                        <div className="flex flex-col items-end">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${trendType === 'up' ? 'text-emerald-500' :
                                    trendType === 'down' ? 'text-red-500' :
                                        'text-zinc-600'
                                }`}>
                                {trendType === 'up' ? '▲' : trendType === 'down' ? '▼' : '○'} {trend}
                            </span>
                            <span className="text-[8px] text-zinc-800 font-bold uppercase tracking-tighter">vs PW</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Decorative Grid Line */}
            <div className="absolute bottom-4 right-8 w-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
    );
}
