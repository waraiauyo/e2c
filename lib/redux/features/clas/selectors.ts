import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/lib/redux/store";
import { filterByName, filterByLevel, filterByAllophone, composeFilters } from "./filters";

export const selectAllClas = (state: RootState) => state.clas.items;
export const selectClasFilters = (state: RootState) => state.clas.filters;
export const selectClasStatus = (state: RootState) => state.clas.status;

export const selectFilteredClas = createSelector(
  [selectAllClas, selectClasFilters],
  (items, { searchQuery, level, allophone }) => {
    const isVisible = composeFilters(
      filterByName(searchQuery),
      filterByLevel(level),
      filterByAllophone(allophone)
    );
    return items.filter(isVisible);
  }
);

export const selectClasForMap = createSelector([selectFilteredClas], (items) =>
  items
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      id: c.id,
      position: [c.latitude!, c.longitude!] as [number, number],
      infos: {
        name: c.name,
        location: c.location || "Non renseigné",
        gradeLevels: c.grade_levels || "Non renseigné",
        capacity: c.capacity || "Non renseignée",
        allophoneCount: c.allophone_count || "0",
        schedule: c.schedule || "Non renseigné",
      },
    }))
);