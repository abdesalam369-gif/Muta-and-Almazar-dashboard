
import { Trip, Vehicle, Fuel, Maintenance, Area } from '../types';
import { CONFIG } from '../constants';

async function fetchCSV<T>(url: string): Promise<T[]> {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines.shift()!.split(",");
    
    return lines.map(line => {
        const values = line.split(",");
        const obj: { [key: string]: string } = {};
        header.forEach((h, i) => {
            obj[h.trim()] = (values[i] || "").trim();
        });
        return obj as T;
    });
}

export async function loadAllData() {
    const [trips, vehicles, fuel, maint, areas] = await Promise.all([
        fetchCSV<Trip>(CONFIG.trips),
        fetchCSV<Vehicle>(CONFIG.vehicles),
        fetchCSV<Fuel>(CONFIG.fuel),
        fetchCSV<Maintenance>(CONFIG.maint),
        fetchCSV<Area>(CONFIG.areas)
    ]);

    return { trips, vehicles, fuel, maint, areas };
}

// Utility function to format numbers
export const formatNumber = (num: number | undefined | null, digits: number = 0): string => {
    if (num === null || num === undefined || !isFinite(num)) return "—";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};
