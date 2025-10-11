# Redux Store - Guide d'utilisation

## Structure

```
lib/redux/
├── features/
│   └── userSlice.ts       # Slice pour la gestion de l'utilisateur
├── provider/
│   └── StoreProvider.tsx  # Provider Redux pour Next.js
├── hooks.ts               # Hooks typés pour Redux
├── store.ts               # Configuration du store
└── README.md              # Ce fichier
```

## Installation dans l'application

### 1. Wrapper votre application avec le StoreProvider

Dans votre fichier `app/layout.tsx` :

```tsx
import StoreProvider from "@/lib/redux/provider/StoreProvider";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
```

## Utilisation dans les composants

### Import des hooks

```tsx
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
    loginUser,
    logoutUser,
    fetchCurrentUser,
    fetchUserProfile,
} from "@/lib/redux/features/userSlice";
```

### Exemple de connexion

```tsx
"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { loginUser } from "@/lib/redux/features/userSlice";

export default function LoginComponent() {
    const dispatch = useAppDispatch();
    const { user, profile, isLoading, error } = useAppSelector(
        (state) => state.user
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        await dispatch(loginUser({ email, password }));
    };

    return (
        <div>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
            />
            <button onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
            </button>
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
}
```

### Exemple de récupération de l'utilisateur au chargement

```tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchCurrentUser } from "@/lib/redux/features/userSlice";

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const { user, profile, isLoading, isAuthenticated } = useAppSelector(
        (state) => state.user
    );

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    if (isLoading) {
        return <div>Chargement...</div>;
    }

    if (!isAuthenticated) {
        return <div>Non connecté</div>;
    }

    return (
        <div>
            <h1>Bienvenue {profile?.first_name}</h1>
            <p>Email: {user?.email}</p>
        </div>
    );
}
```

### Exemple de déconnexion

```tsx
import { useAppDispatch } from "@/lib/redux/hooks";
import { logoutUser } from "@/lib/redux/features/userSlice";

export default function LogoutButton() {
    const dispatch = useAppDispatch();

    const handleLogout = async () => {
        await dispatch(logoutUser());
    };

    return <button onClick={handleLogout}>Se déconnecter</button>;
}
```

## État disponible

Le slice `user` contient les propriétés suivantes :

-   `user`: Objet utilisateur Supabase ou `null`
-   `profile`: Profil utilisateur depuis la table `profiles` ou `null`
-   `isLoading`: Booléen indiquant si une opération est en cours
-   `isAuthenticated`: Booléen indiquant si l'utilisateur est connecté
-   `error`: Message d'erreur ou `null`

## Actions disponibles

### Thunks asynchrones

-   `loginUser({ email, password })`: Connexion
-   `logoutUser()`: Déconnexion
-   `fetchCurrentUser()`: Récupère l'utilisateur actuellement connecté
-   `fetchUserProfile(userId)`: Récupère le profil d'un utilisateur spécifique

### Actions synchrones

-   `clearError()`: Efface les erreurs
-   `setUser(user)`: Définit manuellement l'utilisateur
-   `setProfile(profile)`: Définit manuellement le profil
