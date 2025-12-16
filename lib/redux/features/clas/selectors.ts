import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/lib/redux/store";
import { filterByName, filterByLevel, filterByAllophone, composeFilters } from "./filters";

export const selectAllClas = (state: RootState) => state.clas.items;
export const selectClasFilters = (state: RootState) => state.clas.filters;
export const selectClasStatus = (state: RootState) => state.clas.status;

// Sélecteur pour obtenir les niveaux scolaires uniques
export const selectUniqueLevels = createSelector([selectAllClas], (items) => {
  const levels = new Set<string>();
  items.forEach((clas) => {
    if (clas.grade_levels) {
      levels.add(clas.grade_levels);
    }
  });
  return Array.from(levels).sort();
});

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
    .map((c) => {
      // Compter les coordinateurs et animateurs
      const coordinators = c.team_members?.filter((m) => m.role === "coordinator") || [];
      const animators = c.team_members?.filter((m) => m.role === "animator") || [];

      return {
        id: c.id,
        position: [c.latitude!, c.longitude!] as [number, number],
        infos: {
          name: c.name,
          location: c.location || "Non renseigné",
          description: c.public_description || null,
          gradeLevels: c.grade_levels || "Non renseigné",
          capacity: c.capacity || "Non renseignée",
          allophoneCount: c.allophone_count || "0",
          schedule: c.schedule || "Non renseigné",
          coordinators: coordinators.map((m) =>
            m.profile
              ? `${m.profile.first_name} ${m.profile.last_name}`
              : m.name || "Inconnu"
          ),
          animatorCount: animators.length,
        },
      };
    })
);