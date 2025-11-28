import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllClas } from "@/lib/supabase/query/clas";

export const fetchClasList = createAsyncThunk(
    "clas/fetchAll",
    async (_, { rejectWithValue }) => {
        const { clas, error } = await getAllClas();
        
        if (error) {
            return rejectWithValue(error);
        }
        
        return clas || [];
    }
);