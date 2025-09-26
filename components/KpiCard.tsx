
import React from 'react';

interface KpiCardProps {
    value: string | number;
    label: string;
    icon: string;
    color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ value, label, icon, color }) => {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg transition-transform hover:-translate-y-1">
            <div className={`text-3xl font-bold mb-2 ${color}`}>{value}</div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                {label}
            </div>
        </div>
    );
};

export default KpiCard;
