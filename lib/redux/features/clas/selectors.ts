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
    .map((c) => {
      // Compter les coordinateurs, directeurs et animateurs
      const coordinators = c.team_members?.filter((m) => m.role === "coordinator") || [];
      const directors = c.team_members?.filter((m) => m.role === "director") || [];
      const animators = c.team_members?.filter((m) => m.role === "animator") || [];

      return {
        id: c.id,
        position: [c.latitude!, c.longitude!] as [number, number],
        infos: {
          id: c.id,
          name: c.name,
          logoUrl: c.logo_url || null,
          location: c.location || "Non renseigné",
          description: c.public_description || null,
          gradeLevel: c.grade_level,
          websiteUrl: c.website_url || null,
          capacity: c.capacity || "Non renseignée",
          allophoneCount: c.allophone_count || "0",
          schedule: c.schedule || "Non renseigné",
          coordinators: coordinators.map((m) => ({
            name: m.profile
              ? `${m.profile.first_name} ${m.profile.last_name}`
              : m.name || "Inconnu",
            email: m.profile?.email || m.contact_email || null,
          })),
          directors: directors.map((m) => ({
            name: m.profile
              ? `${m.profile.first_name} ${m.profile.last_name}`
              : m.name || "Inconnu",
            email: m.profile?.email || m.contact_email || null,
          })),
          animatorCount: animators.length,
        },
      };
    })
);
