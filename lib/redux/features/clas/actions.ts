import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllClasWithTeams } from "@/lib/supabase/query/clas";

export const fetchClasList = createAsyncThunk(
    "clas/fetchAll",
    async (_, { rejectWithValue }) => {
        const { clas, error } = await getAllClasWithTeams();

        if (error) {
            return rejectWithValue(error);
        }

        return clas || [];
    }
);