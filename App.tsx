import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trip, Vehicle, Fuel, Maintenance, Area, VehicleTableData } from './types';
import { CONFIG, MONTHS_ORDER } from './constants';
import { loadAllData } from './services/dataService';
import { generateFleetReport } from './services/geminiService';
import Header from './components/Header';
import KpiGrid from './components/KpiGrid';
import ChartSection from './components/ChartSection';
import TableSection from './components/TableSection';
import AiAnalysisSection from './components/AiAnalysisSection';
import UtilizationSection from './components/UtilizationSection';
import Loader from './components/Loader';

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [tripsData, setTripsData] = useState<Trip[]>([]);
    const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([]);
    const [fuelData, setFuelData] = useState<Fuel[]>([]);
    const [maintData, setMaintData] = useState<Maintenance[]>([]);
    const [areasData, setAreasData] = useState<Area[]>([]);
    const [filters, setFilters] = useState<{ vehicles: Set<string>; months: Set<string> }>({
        vehicles: new Set(),
        months: new Set(),
    });
    const [isFiltering, setIsFiltering] = useState(false);

    const [aiReport, setAiReport] = useState<string>('');
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [aiError, setAiError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { trips, vehicles, fuel, maint, areas } = await loadAllData();
                setTripsData(trips);
                setVehiclesData(vehicles);
                setFuelData(fuel);
                setMaintData(maint);
                setAreasData(areas);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFilterToggle = useCallback((type: 'vehicles' | 'months', value: string) => {
        setIsFiltering(true);
        setFilters(prev => {
            const newSet = new Set(prev[type]);
            if (newSet.has(value)) {
                newSet.delete(value);
            } else {
                newSet.add(value);
            }
            return { ...prev, [type]: newSet };
        });
    }, []);

    const resetFilters = useCallback(() => {
        setIsFiltering(true);
        setFilters({ vehicles: new Set(), months: new Set() });
    }, []);

    const filteredTrips = useMemo(() => {
        let data = [...tripsData];
        if (filters.vehicles.size > 0) {
            data = data.filter(r => r['رقم المركبة'] && filters.vehicles.has(r['رقم المركبة']));
        }
        if (filters.months.size > 0) {
            data = data.filter(r => r['الشهر'] && filters.months.has(r['الشهر'].toLowerCase()));
        }
        return data;
    }, [tripsData, filters]);

    useEffect(() => {
        if (isFiltering) {
            const timer = setTimeout(() => setIsFiltering(false), 300);
            return () => clearTimeout(timer);
        }
    }, [filteredTrips, isFiltering]);
    
    const allVehiclesList = useMemo(() => {
        return [...new Set(tripsData.map(r => r['رقم المركبة']).filter(Boolean))].sort();
    }, [tripsData]);

    const vehicleTableData = useMemo<VehicleTableData[]>(() => {
        const vehGroups: { [key: string]: { trips: number; tons: number; drivers: Set<string> } } = {};
        
        tripsData.forEach(r => {
            const v = r['رقم المركبة'];
            if (!v) return;
            if (!vehGroups[v]) vehGroups[v] = { trips: 0, tons: 0, drivers: new Set() };
            vehGroups[v].trips += 1;
            vehGroups[v].tons += (Number(r['صافي التحميل']) || 0) / 1000;
            if (r['السائق']) vehGroups[v].drivers.add(r['السائق']);
        });

        return Object.keys(vehGroups).map(v => {
            const { trips, tons, drivers } = vehGroups[v];
            const vehRow = vehiclesData.find(x => x['رقم المركبة'] === v) || {};
            const areaRow = areasData.find(x => x['رقم المركبة'] === v) || {};
            const fuelRow = fuelData.find(x => x['رقم المركبة'] === v) || {};
            const maintRow = maintData.find(x => x['رقم المركبة'] === v) || {};

            let fuel = 0;
            if(fuelRow) {
                Object.keys(fuelRow).forEach(k => {
                    if (k !== 'رقم المركبة') fuel += (Number(fuelRow[k as keyof Fuel]) || 0);
                });
            }
            
            const maint = Number(maintRow?.['كلفة الصيانة'] || 0);
            const cap_m3 = parseFloat(vehRow['سعة المركبة بالمتر المكعب'] || '0');
            const density = parseFloat(vehRow['كثافة التحميل'] || '0');
            const cap_ton = cap_m3 * density;
            const totalCost = fuel + maint;
            const cost_trip = trips ? totalCost / trips : 0;
            const cost_ton = tons ? totalCost / tons : 0;

            return {
                veh: v,
                area: areaRow['المنطقة'] || '',
                drivers: [...drivers].join(', '),
                year: vehRow['سنة التصنيع'] || '',
                cap_m3,
                cap_ton,
                trips,
                tons,
                fuel,
                maint,
                cost_trip,
                cost_ton,
            };
        });
    }, [tripsData, vehiclesData, areasData, fuelData, maintData]);

    const handleGenerateReport = async (analysisType: string, options: { vehicleId?: string; vehicleIds?: string[]; customPrompt?: string }) => {
        setAiLoading(true);
        setAiError('');
        setAiReport('');
        try {
            const report = await generateFleetReport(vehicleTableData, analysisType, options);
            setAiReport(report);
        } catch (err) {
            setAiError('حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى.');
            console.error(err);
        } finally {
            setAiLoading(false);
        }
    };


    if (loading) {
        return <Loader />;
    }

    return (
        <div className="bg-slate-50 text-slate-800 min-h-screen">
            <Header
                tripsData={tripsData}
                filters={filters}
                onFilterToggle={handleFilterToggle}
                onResetFilters={resetFilters}
            />
            <main className="container mx-auto p-4 md:p-6">
                <KpiGrid 
                    filteredTrips={filteredTrips} 
                    fuelData={fuelData} 
                    maintData={maintData} 
                    filters={filters}
                    vehicleTableData={vehicleTableData}
                />
                <ChartSection data={filteredTrips} isLoading={isFiltering} />
                <TableSection fullTableData={vehicleTableData} />
                <AiAnalysisSection
                    vehicles={allVehiclesList}
                    onGenerateReport={handleGenerateReport}
                    report={aiReport}
                    isLoading={aiLoading}
                    error={aiError}
                />
                <UtilizationSection vehicleTableData={vehicleTableData} />
            </main>
        </div>
    );
};

export default App;