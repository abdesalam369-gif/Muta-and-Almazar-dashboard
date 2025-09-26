import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Trip, Vehicle, Fuel, Maintenance, Area, VehicleTableData, DriverStatsData } from './types';
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
import AreaChartSection from './components/AreaChartSection';
import DriverStatsSection from './components/DriverStatsSection';

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
    
    const lineChartRef = useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);

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

    const filteredVehicleTableData = useMemo<VehicleTableData[]>(() => {
        const vehGroups: { [key: string]: { trips: number; tons: number; drivers: Set<string> } } = {};
        
        filteredTrips.forEach(r => {
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
                const monthsToSum = filters.months.size > 0 ? Array.from(filters.months) : MONTHS_ORDER;
                monthsToSum.forEach(m => {
                    fuel += (Number(fuelRow[m as keyof Fuel]) || 0);
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
    }, [filteredTrips, vehiclesData, areasData, fuelData, maintData, filters.months]);

    const driverStatsData = useMemo<DriverStatsData[]>(() => {
        const driverGroups: { [key: string]: { trips: number; tons: number; vehicles: Set<string> } } = {};
        
        filteredTrips.forEach(r => {
            const driver = r['السائق'];
            if (!driver || driver.trim() === '') return;
    
            if (!driverGroups[driver]) {
                driverGroups[driver] = { trips: 0, tons: 0, vehicles: new Set() };
            }
            driverGroups[driver].trips += 1;
            driverGroups[driver].tons += (Number(r['صافي التحميل']) || 0) / 1000;
            if (r['رقم المركبة']) {
                driverGroups[driver].vehicles.add(r['رقم المركبة']);
            }
        });
    
        return Object.entries(driverGroups).map(([driver, data]) => {
            const { trips, tons, vehicles } = data;
            const avgTonsPerTrip = trips > 0 ? tons / trips : 0;
            
            return {
                driver,
                trips,
                tons,
                avgTonsPerTrip,
                vehicles: [...vehicles].join(', '),
            };
        });
    }, [filteredTrips]);
    
    const areaDistributionData = useMemo(() => {
        const areaMap = new Map<string, string>();
        areasData.forEach(a => {
            if (a['رقم المركبة'] && a['المنطقة']) {
                areaMap.set(a['رقم المركبة'], a['المنطقة']);
            }
        });

        const tonsByArea: { [key: string]: number } = {};
        filteredTrips.forEach(trip => {
            const vehicleId = trip['رقم المركبة'];
            if (vehicleId) {
                const area = areaMap.get(vehicleId) || 'غير محدد';
                if (!tonsByArea[area]) {
                    tonsByArea[area] = 0;
                }
                tonsByArea[area] += (Number(trip['صافي التحميل'] || 0) / 1000);
            }
        });

        return Object.entries(tonsByArea)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);

    }, [filteredTrips, areasData]);

    const handleGenerateReport = async (analysisType: string, options: { vehicleId?: string; vehicleIds?: string[]; customPrompt?: string }) => {
        setAiLoading(true);
        setAiError('');
        setAiReport('');
        try {
            const report = await generateFleetReport(filteredVehicleTableData, analysisType, options);
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
                    vehicleTableData={filteredVehicleTableData}
                />
                <ChartSection data={filteredTrips} isLoading={isFiltering} filters={filters} chartRef={lineChartRef} />
                <AreaChartSection data={areaDistributionData} isLoading={isFiltering} filters={filters} chartRef={pieChartRef} />
                <TableSection tableData={filteredVehicleTableData} filters={filters} />
                <DriverStatsSection tableData={driverStatsData} filters={filters} />
                <AiAnalysisSection
                    vehicles={allVehiclesList}
                    onGenerateReport={handleGenerateReport}
                    report={aiReport}
                    isLoading={aiLoading}
                    error={aiError}
                    filters={filters}
                />
                <UtilizationSection tableData={filteredVehicleTableData} filters={filters} />
            </main>
        </div>
    );
};

export default App;