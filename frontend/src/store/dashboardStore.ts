import { create } from 'zustand';
import { api, endpoints } from '../lib/api';

export interface ActivityItem {
    id: number;
    method: string;
    endpoint: string;
    status: string;
    status_code: number;
    time: string;
    duration: string;
}

export interface DashboardStats {
    active_endpoints: number;
    db_connections: number;
    avg_latency: string;
    recent_activities: ActivityItem[];
}

interface DashboardState {
    stats: DashboardStats | null;
    isLoading: boolean;
    error: string | null;

    fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    stats: null,
    isLoading: false,
    error: null,

    fetchStats: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get(endpoints.dashboard.stats);
            set({ stats: response.data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
}));
