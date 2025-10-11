import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@supabase/supabase-js";
import { getUser, login, logout } from "@/lib/supabase/auth";
import {
    getCurrentUserProfile,
    getUserProfile,
    UserProfile,
} from "@/lib/supabase/query/profiles";

export interface UserState {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

const initialState: UserState = {
    user: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
};

// Thunks asynchrones
export const loginUser = createAsyncThunk(
    "user/login",
    async (
        { email, password }: { email: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            const result = await login(email, password);

            if (!result.success) {
                return rejectWithValue(result.message);
            }

            // Récupère l'utilisateur et son profil
            const { user, error: userError } = await getUser();

            if (userError || !user) {
                return rejectWithValue(
                    userError || "Erreur lors de la récupération de l'utilisateur."
                );
            }

            const { profile, error: profileError } =
                await getCurrentUserProfile();

            if (profileError) {
                // On ne bloque pas si le profil n'est pas trouvé
                console.warn("Profil non trouvé:", profileError);
            }

            return { user, profile };
        } catch (error) {
            return rejectWithValue(
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors de la connexion."
            );
        }
    }
);

export const logoutUser = createAsyncThunk(
    "user/logout",
    async (_, { rejectWithValue }) => {
        try {
            const result = await logout();

            if (!result.success) {
                return rejectWithValue(result.message);
            }

            return true;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors de la déconnexion."
            );
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    "user/fetchCurrent",
    async (_, { rejectWithValue }) => {
        try {
            const { user, error: userError } = await getUser();

            if (userError || !user) {
                return rejectWithValue(
                    userError || "Utilisateur non connecté."
                );
            }

            const { profile, error: profileError } =
                await getCurrentUserProfile();

            if (profileError) {
                console.warn("Profil non trouvé:", profileError);
            }

            return { user, profile };
        } catch (error) {
            return rejectWithValue(
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors de la récupération de l'utilisateur."
            );
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    "user/fetchProfile",
    async (userId: string, { rejectWithValue }) => {
        try {
            const { profile, error } = await getUserProfile(userId);

            if (error || !profile) {
                return rejectWithValue(
                    error || "Erreur lors de la récupération du profil."
                );
            }

            return profile;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors de la récupération du profil."
            );
        }
    }
);

// Slice
const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.isAuthenticated = action.payload !== null;
        },
        setProfile: (state, action: PayloadAction<UserProfile | null>) => {
            state.profile = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.profile = action.payload.profile;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        // Logout
        builder
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.user = null;
                state.profile = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Fetch current user
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.profile = action.payload.profile;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        // Fetch user profile
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.profile = action.payload;
                state.error = null;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, setUser, setProfile } = userSlice.actions;
export default userSlice.reducer;
