import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trip } from '../types';
import { MONTHS_ORDER } from '../constants';
import CollapsibleSection from './CollapsibleSection';
import { printChart } from '../services/printService';

interface ChartSectionProps {
    data: Trip[];
    isLoading: boolean;
    filters: { vehicles: Set<string>; months: Set<string> };
    chartRef: React.RefObject<HTMLDivElement>;
}

const ChartSection: React.FC<ChartSectionProps> = ({ data, isLoading, filters, chartRef }) => {
    const [groupBy, setGroupBy] = useState<'month' | 'day'>('month');
    const [metric, setMetric] = useState<'trips' | 'tons'>('trips');

    const chartData = useMemo(() => {
        const grouped: { [key: string]: number } = {};

        data.forEach(trip => {
            let key: string | null = null;
            if (groupBy === 'month') {
                key = (trip['الشهر'] || '').toLowerCase();
            } else {
                const date = new Date(trip['تاريخ التوزين الثاني']);
                if (!isNaN(date.getTime())) {
                    key = date.toISOString().split('T')[0];
                }
            }
            if (!key) return;

            if (!grouped[key]) grouped[key] = 0;
            grouped[key] += metric === 'trips' ? 1 : Math.round((Number(trip['صافي التحميل'] || 0) / 1000));
        });

        const sortedData = Object.entries(grouped).map(([name, value]) => ({ name, value }));

        if (groupBy === 'month') {
            sortedData.sort((a, b) => MONTHS_ORDER.indexOf(a.name) - MONTHS_ORDER.indexOf(b.name));
        } else {
            sortedData.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        return sortedData;
    }, [data, groupBy, metric]);

    const handlePrint = () => {
        const chartTitle = `السلاسل الزمنية - ${metric === 'trips' ? 'عدد الرحلات' : 'الأوزان (طن)'} حسب ${groupBy === 'month' ? 'الشهر' : 'اليوم'}`;
        printChart(chartRef, chartTitle, filters);
    };


    return (
        <CollapsibleSection title="السلاسل الزمنية">
            <div className="flex items-center gap-4 mb-4 text-sm">
                <div>
                    <label htmlFor="timeGroup" className="ml-2 font-semibold">التجميع:</label>
                    <select id="timeGroup" value={groupBy} onChange={e => setGroupBy(e.target.value as 'month' | 'day')}
                        className="p-2 border border-slate-300 rounded-lg">
                        <option value="month">شهري</option>
                        <option value="day">يومي</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="metric" className="ml-2 font-semibold">القيمة:</label>
                    <select id="metric" value={metric} onChange={e => setMetric(e.target.value as 'trips' | 'tons')}
                        className="p-2 border border-slate-300 rounded-lg">
                        <option value="trips">عدد الرحلات</option>
                        <option value="tons">الأوزان (طن)</option>
                    </select>
                </div>
                <button onClick={handlePrint} className="px-3 py-2 border-none rounded-lg bg-emerald-500 text-white text-sm font-semibold cursor-pointer shadow-md transition hover:bg-emerald-600">
                    طباعة الرسم البياني
                </button>
            </div>
            <div className="h-96 w-full relative" ref={chartRef}>
                 {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                )}
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" name={metric === 'trips' ? 'عدد الرحلات' : 'الأوزان (طن)'} stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </CollapsibleSection>
    );
};

export default ChartSection;