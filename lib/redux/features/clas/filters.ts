import { normalizeText } from "@/lib/utils";
import type { ClasWithTeam } from "./types";

type ClasFilterFn = (clas: ClasWithTeam) => boolean;

export const filterByName = (query: string): ClasFilterFn => (clas) => {
  if (!query) return true;
  const search = normalizeText(query);
  return (
    normalizeText(clas.name).includes(search) ||
    normalizeText(clas.location || "").includes(search)
  );
};

export const filterByLevel = (level: string): ClasFilterFn => (clas) => {
  if (level === "all") return true;
  return clas.grade_level === level;
};

export const filterByAllophone = (option: string): ClasFilterFn => (clas) => {
  if (option === "all") return true;
  const count = parseInt(clas.allophone_count || "0", 10);
  const hasAllophones = !isNaN(count) && count > 0;
  return option === "yes" ? hasAllophones : !hasAllophones;
};

// Composition des filtres
export const composeFilters = (...filters: ClasFilterFn[]): ClasFilterFn => 
  (clas) => filters.every((f) => f(clas));