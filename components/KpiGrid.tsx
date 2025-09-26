import React, { useMemo } from 'react';
import { Trip, Fuel, Maintenance, VehicleTableData } from '../types';
import { MONTHS_ORDER } from '../constants';
import { formatNumber } from '../services/dataService';
import KpiCard from './KpiCard';

interface KpiGridProps {
    filteredTrips: Trip[];
    fuelData: Fuel[];
    maintData: Maintenance[];
    filters: { vehicles: Set<string>; months: Set<string> };
    vehicleTableData: VehicleTableData[];
}

const KpiGrid: React.FC<KpiGridProps> = ({ filteredTrips, fuelData, maintData, filters, vehicleTableData }) => {
    
    const kpis = useMemo(() => {
        const totalTons = filteredTrips.reduce((sum, trip) => sum + (Number(trip['صافي التحميل'] || 0) / 1000), 0);
        const totalTrips = filteredTrips.length;
        
        const activeVehicles = new Set(filteredTrips.map(r => r['رقم المركبة']).filter(Boolean));
        
        const sumFuelForVehicle = (veh: string) => {
            const row = fuelData.find(x => x['رقم المركبة'] === veh);
            if (!row) return 0;
            const monthsToSum = filters.months.size ? Array.from(filters.months) : MONTHS_ORDER;
            return monthsToSum.reduce((s, m) => s + (Number(row[m as keyof Fuel]) || 0), 0);
        };

        const maintForVehicle = (veh: string) => {
            const row = maintData.find(x => x['رقم المركبة'] === veh);
            return row ? (Number(row['كلفة الصيانة']) || 0) : 0;
        };
        
        let totalFuel = 0;
        let totalMaint = 0;
        activeVehicles.forEach(v => {
            totalFuel += sumFuelForVehicle(v);
            totalMaint += maintForVehicle(v);
        });

        const daysSet = new Set(filteredTrips.map(r => {
            const d = new Date(r['تاريخ التوزين الثاني']);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
        }).filter(Boolean));
        const daysCount = daysSet.size;
        const avgTonsPerDay = daysCount > 0 ? totalTons / daysCount : 0;

        const agg: { [key: string]: { trips: number; tons: number } } = {};
        filteredTrips.forEach(r => {
            const v = r['رقم المركبة'];
            if (!v) return;
            if (!agg[v]) agg[v] = { trips: 0, tons: 0 };
            agg[v].trips += 1;
            agg[v].tons += (Number(r['صافي التحميل'] || 0) / 1000);
        });

        let topTripsVeh = "—", topTripsVal = 0, topTonsVeh = "—", topTonsVal = 0;
        Object.entries(agg).forEach(([v, data]) => {
            if (data.trips > topTripsVal) {
                topTripsVal = data.trips;
                topTripsVeh = v;
            }
            if (data.tons > topTonsVal) {
                topTonsVal = data.tons;
                topTonsVeh = v;
            }
        });

        const activeVehicleDetails = vehicleTableData.filter(v => activeVehicles.has(v.veh));
        const totalCapacity = activeVehicleDetails.reduce((sum, v) => sum + v.cap_ton, 0);
        const avgCapacity = activeVehicles.size > 0 ? totalCapacity / activeVehicles.size : 0;

        return {
            totalTons, totalTrips, totalFuel, totalMaint, avgTonsPerDay, daysCount,
            activeVehiclesCount: activeVehicles.size,
            topTrips: topTripsVal > 0 ? `${topTripsVeh} | ${formatNumber(topTripsVal)}` : '—',
            topTons: topTonsVal > 0 ? `${topTonsVeh} | ${formatNumber(topTonsVal, 1)} طن` : '—',
            avgCapacity
        };
    }, [filteredTrips, fuelData, maintData, filters, vehicleTableData]);

    const kpiCards = [
        { value: formatNumber(Math.round(kpis.totalTons)), label: 'إجمالي الأطنان', icon: '🗑️', color: 'text-blue-600' },
        { value: formatNumber(kpis.totalTrips), label: 'إجمالي الرحلات', icon: '🚚', color: 'text-sky-500' },
        { value: formatNumber(Math.round(kpis.totalFuel)), label: 'إجمالي كلفة الوقود', icon: '⛽', color: 'text-orange-500' },
        { value: formatNumber(Math.round(kpis.totalMaint)), label: 'إجمالي كلفة الصيانة', icon: '🔧', color: 'text-red-600' },
        { value: formatNumber(kpis.avgTonsPerDay, 1), label: 'متوسط النفايات/اليوم', icon: '📊', color: 'text-green-600' },
        { value: formatNumber(kpis.daysCount), label: 'عدد الأيام التشغيلية', icon: '📅', color: 'text-pink-600' },
        { value: formatNumber(kpis.activeVehiclesCount), label: 'عدد المركبات النشطة', icon: '🚛', color: 'text-purple-600' },
        { value: kpis.topTrips, label: 'أعلى مركبة رحلات', icon: '🏆', color: 'text-indigo-600' },
        { value: kpis.topTons, label: 'أعلى مركبة وزن', icon: '⚖️', color: 'text-teal-500' },
        { value: formatNumber(kpis.avgCapacity, 1), label: 'متوسط سعة المركبات (طن)', icon: '📦', color: 'text-amber-500' },
    ];

    return (
        <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {kpiCards.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
    );
};

export default KpiGrid;