export interface DiagnosticCardProps {
    label: string;
    value: string | number;
    unit?: string;
}

export default function DiagnosticCard({ label, value, unit }: DiagnosticCardProps) {
    return (
        <div className="glass-surface p-5 rounded-sm interactive-node border-l-2 border-l-zinc-700 hover:border-l-emerald-600 transition-all group">
            <span className="block text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-2">
                DIAG::{label.toUpperCase().replace(/\s/g, '_')}
            </span>
            <div className="flex items-baseline gap-1">
                <span
                    className="text-2xl font-black italic tracking-tighter text-white group-hover:text-emerald-500 transition-colors"
                >
                    {value}
                </span>
                {unit && <span className="text-[10px] font-bold text-zinc-600 ml-1">{unit}</span>}
            </div>
        </div>
    );
}
