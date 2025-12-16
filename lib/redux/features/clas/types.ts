import type { Clas, ClasTeamMemberWithProfile } from "@/types/database";

export interface ClasFilters {
    searchQuery: string;
    level: string; // "all" ou valeur dynamique depuis les données
    allophone: "all" | "yes" | "no";
}

export interface ClasWithTeam extends Clas {
    team_members: ClasTeamMemberWithProfile[];
}

export interface ClasState {
    items: ClasWithTeam[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastFetched: number | null;
    filters: ClasFilters;
}