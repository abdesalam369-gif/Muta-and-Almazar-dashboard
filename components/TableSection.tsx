
import React, { useState, useMemo } from 'react';
import { VehicleTableData } from '../types';
import { formatNumber } from '../services/dataService';
import CollapsibleSection from './CollapsibleSection';

interface TableSectionProps {
    fullTableData: VehicleTableData[];
}

const TableSection: React.FC<TableSectionProps> = ({ fullTableData }) => {
    const [sortBy, setSortBy] = useState<keyof VehicleTableData>('veh');

    const sortedData = useMemo(() => {
        const sorted = [...fullTableData];
        sorted.sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB, 'ar');
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return valB - valA;
            }
            return 0;
        });
        return sorted;
    }, [fullTableData, sortBy]);
    
    const totals = useMemo(() => {
        if (sortedData.length === 0) return null;
        const totalTrips = sortedData.reduce((s, r) => s + r.trips, 0);
        const totalTons = sortedData.reduce((s, r) => s + r.tons, 0);
        const totalFuel = sortedData.reduce((s, r) => s + r.fuel, 0);
        const totalMaint = sortedData.reduce((s, r) => s + r.maint, 0);
        const avgCostTrip = sortedData.reduce((s, r) => s + r.cost_trip, 0) / sortedData.length;
        const avgCostTon = sortedData.reduce((s, r) => s + r.cost_ton, 0) / sortedData.length;
        return { totalTrips, totalTons, totalFuel, totalMaint, avgCostTrip, avgCostTon };
    }, [sortedData]);

    const printTable = () => {
        const tableElement = document.getElementById('vehicle-efficiency-table');
        if (tableElement) {
            const printWindow = window.open('', '', 'height=600,width=1000');
            printWindow?.document.write('<html><head><title>طباعة جدول الكفاءة</title>');
            printWindow?.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
            printWindow?.document.write('<style>body { direction:rtl; font-family:"Cairo",sans-serif; margin:24px } table{width:100%;border-collapse:collapse; font-size: 12px;} th,td{border:1px solid #e5e7eb;padding:6px;text-align:center} th{background:#f9fafb}</style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(tableElement.outerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.print();
        }
    };


    const headers = [
        { key: 'veh', label: 'رقم المركبة' }, { key: 'area', label: 'المنطقة' },
        { key: 'drivers', label: 'السائق' }, { key: 'year', label: 'سنة التصنيع' },
        { key: 'cap_m3', label: 'السعة (م³)' }, { key: 'cap_ton', label: 'السعة النظرية (طن)' },
        { key: 'trips', label: 'عدد الرحلات' }, { key: 'tons', label: 'الوزن المنقول (طن)' },
        { key: 'fuel', label: 'كلفة الوقود' }, { key: 'maint', label: 'كلفة الصيانة' },
        { key: 'cost_trip', label: 'كلفة الرحلة' }, { key: 'cost_ton', label: 'كلفة الطن' },
    ];

    return (
        <CollapsibleSection title="جدول كفاءة المركبات">
             <div className="flex items-center gap-4 mb-4 text-sm">
                <div>
                    <label htmlFor="tableSort" className="ml-2 font-semibold">ترتيب حسب:</label>
                    <select id="tableSort" value={sortBy} onChange={e => setSortBy(e.target.value as keyof VehicleTableData)}
                        className="p-2 border border-slate-300 rounded-lg">
                        {headers.map(h => <option key={h.key} value={h.key}>{h.label}</option>)}
                    </select>
                </div>
                <button onClick={printTable} className="px-3 py-2 border-none rounded-lg bg-emerald-500 text-white text-sm font-semibold cursor-pointer shadow-md transition hover:bg-emerald-600">
                    طباعة الجدول
                </button>
            </div>
            <div className="overflow-x-auto">
                <table id="vehicle-efficiency-table" className="w-full text-sm text-center border-collapse">
                    <thead className="bg-slate-100">
                        <tr>
                            {headers.map(h => <th key={h.key} className="p-2 border-b border-slate-200 font-semibold text-slate-600">{h.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(row => (
                            <tr key={row.veh} className="hover:bg-slate-50">
                                <td className="p-2 border-b border-slate-200">{row.veh}</td>
                                <td className="p-2 border-b border-slate-200">{row.area}</td>
                                <td className={`p-2 border-b border-slate-200 ${row.drivers.includes(',') ? 'text-xs' : ''}`}>{row.drivers}</td>
                                <td className="p-2 border-b border-slate-200">{row.year}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.cap_m3, 1)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.cap_ton, 1)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.trips)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.tons, 1)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.fuel, 1)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.maint, 1)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.cost_trip, 1)}</td>
                                <td className="p-2 border-b border-slate-200">{formatNumber(row.cost_ton, 1)}</td>
                            </tr>
                        ))}
                        {totals && (
                            <tr className="font-bold bg-slate-200">
                                <td className="p-2 border-b border-slate-300">الإجمالي/المتوسط</td>
                                <td colSpan={5} className="p-2 border-b border-slate-300"></td>
                                <td className="p-2 border-b border-slate-300">{formatNumber(totals.totalTrips)}</td>
                                <td className="p-2 border-b border-slate-300">{formatNumber(totals.totalTons, 1)}</td>
                                <td className="p-2 border-b border-slate-300">{formatNumber(totals.totalFuel, 1)}</td>
                                <td className="p-2 border-b border-slate-300">{formatNumber(totals.totalMaint, 1)}</td>
                                <td className="p-2 border-b border-slate-300">{formatNumber(totals.avgCostTrip, 1)}</td>
                                <td className="p-2 border-b border-slate-300">{formatNumber(totals.avgCostTon, 1)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </CollapsibleSection>
    );
};

export default TableSection;
