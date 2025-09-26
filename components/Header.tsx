
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trip } from '../types';

interface HeaderProps {
    tripsData: Trip[];
    filters: { vehicles: Set<string>; months: Set<string> };
    onFilterToggle: (type: 'vehicles' | 'months', value: string) => void;
    onResetFilters: () => void;
}

const FilterDropdown: React.FC<{
    buttonText: string;
    items: string[];
    selectedItems: Set<string>;
    onToggle: (item: string) => void;
}> = ({ buttonText, items, selectedItems, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 border-none rounded-lg bg-white text-slate-800 text-sm font-semibold cursor-pointer shadow-md transition hover:bg-slate-100"
            >
                {buttonText} ▼
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto p-2">
                    {items.map(item => (
                        <label key={item} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                            <input
                                type="checkbox"
                                value={item}
                                checked={selectedItems.has(item)}
                                onChange={() => onToggle(item)}
                                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-slate-700">{item}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ tripsData, filters, onFilterToggle, onResetFilters }) => {
    const vehicles = useMemo(() => [...new Set(tripsData.map(r => r['رقم المركبة']).filter(Boolean))].sort(), [tripsData]);
    const months = useMemo(() => [...new Set(tripsData.map(r => (r['الشهر'] || '').toLowerCase()).filter(Boolean))], [tripsData]);

    const printKPIs = () => {
        const kpiElement = document.getElementById('kpi-grid');
        if (kpiElement) {
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow?.document.write('<html><head><title>طباعة المؤشرات</title>');
            printWindow?.document.write('<link href="https://cdn.tailwindcss.com" rel="stylesheet">');
            printWindow?.document.write('<style>body { font-family: "Cairo", sans-serif; direction: rtl; padding: 20px; }</style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write('<h1>مؤشرات الأداء الرئيسية</h1>');
            printWindow?.document.write(kpiElement.outerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.print();
        }
    };

    return (
        <header className="bg-gradient-to-l from-blue-600 to-sky-500 text-white p-5 shadow-lg flex justify-between items-center">
            <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight">بيانات نقل النفايات</h1>
                <h2 className="text-lg md:text-xl font-semibold">بلدية مؤتة والمزار</h2>
                <h3 className="text-md font-medium">2025</h3>
            </div>
            <div className="flex items-center gap-2">
                <FilterDropdown
                    buttonText="المركبات"
                    items={vehicles}
                    selectedItems={filters.vehicles}
                    onToggle={(item) => onFilterToggle('vehicles', item)}
                />
                <FilterDropdown
                    buttonText="الأشهر"
                    items={months}
                    selectedItems={filters.months}
                    onToggle={(item) => onFilterToggle('months', item.toLowerCase())}
                />
                <button
                    onClick={onResetFilters}
                    className="px-3 py-2 border-none rounded-lg bg-red-500 text-white text-sm font-semibold cursor-pointer shadow-md transition hover:bg-red-600"
                >
                    إعادة تعيين
                </button>
                <button
                    onClick={printKPIs}
                    className="px-3 py-2 border-none rounded-lg bg-emerald-500 text-white text-sm font-semibold cursor-pointer shadow-md transition hover:bg-emerald-600"
                >
                    طباعة المؤشرات
                </button>
            </div>
        </header>
    );
};

export default Header;
