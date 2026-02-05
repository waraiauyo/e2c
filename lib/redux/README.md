# Redux Store - Guide d'utilisation

## Structure

```
lib/redux/
├── features/
│   ├── userSlice.ts          # Slice pour l'authentification et le profil utilisateur
│   └── clas/
│       ├── slice.ts          # Slice pour la gestion des CLAS
│       ├── actions.ts        # Actions asynchrones (thunks)
│       ├── selectors.ts      # Sélecteurs mémoïsés
│       ├── filters.ts        # Fonctions de filtrage
│       └── types.ts          # Types TypeScript
├── provider/
│   └── StoreProvider.tsx     # Provider Redux pour Next.js
├── hooks.ts                  # Hooks typés (useAppDispatch, useAppSelector)
├── store.ts                  # Configuration du store
└── README.md                 # Ce fichier
```

## Installation dans l'application

Dans `app/layout.tsx` :

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

## Slice User

### État

| Propriété         | Type                  | Description                       |
| ----------------- | --------------------- | --------------------------------- |
| `user`            | `User \| null`        | Objet utilisateur Supabase        |
| `profile`         | `UserProfile \| null` | Profil depuis la table `profiles` |
| `isLoading`       | `boolean`             | Opération en cours                |
| `isAuthenticated` | `boolean`             | Utilisateur connecté              |
| `error`           | `string \| null`      | Message d'erreur                  |

### Actions

```tsx
import { useAppDispatch } from "@/lib/redux/hooks";
import {
    loginUser,
    logoutUser,
    fetchCurrentUser,
} from "@/lib/redux/features/userSlice";

// Connexion
dispatch(loginUser({ email, password }));

// Déconnexion
dispatch(logoutUser());

// Récupérer l'utilisateur courant
dispatch(fetchCurrentUser());
```

## Slice CLAS

### État

| Propriété | Type                                             | Description                            |
| --------- | ------------------------------------------------ | -------------------------------------- |
| `items`   | `ClasWithTeam[]`                                 | Liste des CLAS avec équipes et projets |
| `status`  | `'idle' \| 'loading' \| 'succeeded' \| 'failed'` | État du chargement                     |
| `error`   | `string \| null`                                 | Message d'erreur                       |
| `filters` | `ClasFilters`                                    | Filtres actifs                         |

### Actions

```tsx
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchClasList } from "@/lib/redux/features/clas/actions";
import {
    setSearchQuery,
    setLevelFilter,
    resetFilters,
} from "@/lib/redux/features/clas/slice";

// Charger la liste des CLAS
dispatch(fetchClasList());

// Filtrer par recherche
dispatch(setSearchQuery("Laval"));

// Filtrer par niveau
dispatch(setLevelFilter("primary"));

// Réinitialiser les filtres
dispatch(resetFilters());
```

### Sélecteurs

```tsx
import { useAppSelector } from "@/lib/redux/hooks";
import {
    selectFilteredClas,
    selectClasForMap,
} from "@/lib/redux/features/clas/selectors";

// Liste filtrée des CLAS
const filteredClas = useAppSelector(selectFilteredClas);

// CLAS formatés pour la carte (avec coordonnées)
const mapMarkers = useAppSelector(selectClasForMap);
```

## Exemple complet

```tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchClasList } from "@/lib/redux/features/clas/actions";
import {
    selectFilteredClas,
    selectClasStatus,
} from "@/lib/redux/features/clas/selectors";

export default function ClasList() {
    const dispatch = useAppDispatch();
    const clasList = useAppSelector(selectFilteredClas);
    const status = useAppSelector(selectClasStatus);

    useEffect(() => {
        dispatch(fetchClasList());
    }, [dispatch]);

    if (status === "loading") return <div>Chargement...</div>;
    if (status === "failed") return <div>Erreur de chargement</div>;

    return (
        <ul>
            {clasList.map((clas) => (
                <li key={clas.id}>{clas.name}</li>
            ))}
        </ul>
    );
}
```
