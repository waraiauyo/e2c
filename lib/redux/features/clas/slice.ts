import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchClasList } from "./actions";
import type { ClasState, ClasFilters } from "./types";

const initialState: ClasState = {
    items: [],
    status: 'idle',
    error: null,
    lastFetched: null,
    // Initialisation des filtres par défaut
    filters: {
        searchQuery: "",
        level: "all",
        allophone: "all"
    }
};

const clasSlice = createSlice({
    name: "clas",
    initialState,
    reducers: {
        clearClasData: (state) => {
            state.items = [];
            state.status = 'idle';
            state.error = null;
        },
        // --- Actions pour les filtres ---
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.filters.searchQuery = action.payload;
        },
        setLevelFilter: (state, action: PayloadAction<ClasFilters["level"]>) => {
            state.filters.level = action.payload;
        },
        setAllophoneFilter: (state, action: PayloadAction<ClasFilters["allophone"]>) => {
            state.filters.allophone = action.payload;
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchClasList.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchClasList.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchClasList.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { 
    clearClasData, 
    setSearchQuery, 
    setLevelFilter, 
    setAllophoneFilter, 
    resetFilters 
} = clasSlice.actions;

export default clasSlice.reducer;