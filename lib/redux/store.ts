import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";

export const makeStore = () => {
    return configureStore({
        reducer: {
            user: userReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    // Ignore les actions qui contiennent des objets non sérialisables de Supabase
                    ignoredActions: [
                        "user/login/fulfilled",
                        "user/fetchCurrent/fulfilled",
                    ],
                    ignoredPaths: ["user.user"],
                },
            }),
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
