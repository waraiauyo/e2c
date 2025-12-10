import type { Clas } from "@/types/database";

export interface ClasFilters {
    searchQuery: string;
    level: "all" | "primaire" | "college";
    allophone: "all" | "yes" | "no";
}

export interface ClasState {
    items: Clas[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastFetched: number | null;
    filters: ClasFilters; // <--- Ajout des filtres ici
}