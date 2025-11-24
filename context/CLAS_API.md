# CLAS API Documentation

This document describes all available functions for interacting with CLAS data.

## Import

```typescript
import {
    getAllClas,
    getClasById,
    getClasWithTeam,
    getAllClasWithTeams,
    createClas,
    updateClas,
    deleteClas,
    getClasTeamMembers,
    getUserClas,
} from "@/lib/supabase/query/clas";
```

## Query Functions (Read Operations)

### `getAllClas()`

Get all CLAS centers ordered by name.

**Returns**: `Promise<GetAllClasResult>`
```typescript
{
    clas: Clas[] | null;
    error: string | null;
}
```

**Example**:
```typescript
const { clas, error } = await getAllClas();
if (error) {
    console.error(error);
} else {
    console.log(clas); // Array of all CLAS
}
```

### `getClasById(clasId: string)`

Get a single CLAS by its ID.

**Parameters**:
- `clasId` (string) - UUID of the CLAS

**Returns**: `Promise<GetClasResult>`
```typescript
{
    clas: Clas | null;
    error: string | null;
}
```

**Example**:
```typescript
const { clas, error } = await getClasById("uuid-here");
```

### `getClasWithTeam(clasId: string)`

Get a CLAS with its complete team members and raw contacts.

**Parameters**:
- `clasId` (string) - UUID of the CLAS

**Returns**: `Promise<GetClasWithTeamResult>`
```typescript
{
    clas: ClasWithTeam | null; // Includes team_members[] and raw_contacts[]
    error: string | null;
}
```

**Example**:
```typescript
const { clas, error } = await getClasWithTeam("uuid-here");
if (clas) {
    console.log(clas.team_members); // Array of team members
    console.log(clas.raw_contacts); // Array of raw contacts
}
```

### `getAllClasWithTeams()`

Get all CLAS with their team members (including profile information).

**Returns**:
```typescript
Promise<{
    clas: (Clas & { team_members: ClasTeamMemberWithProfile[] })[] | null;
    error: string | null;
}>
```

**Example**:
```typescript
const { clas, error } = await getAllClasWithTeams();
if (clas) {
    clas.forEach(c => {
        console.log(c.name);
        c.team_members.forEach(tm => {
            console.log(`  - ${tm.role}: ${tm.profile?.email}`);
        });
    });
}
```

### `getClasTeamMembers(clasId: string)`

Get team members for a specific CLAS with their profile information.

**Parameters**:
- `clasId` (string) - UUID of the CLAS

**Returns**: `Promise<GetTeamMembersResult>`
```typescript
{
    teamMembers: ClasTeamMemberWithProfile[] | null;
    error: string | null;
}
```

**Example**:
```typescript
const { teamMembers, error } = await getClasTeamMembers("uuid-here");
if (teamMembers) {
    teamMembers.forEach(tm => {
        console.log(`${tm.role}: ${tm.profile?.email || tm.name}`);
    });
}
```

### `getUserClas(userId: string)`

Get all CLAS where a specific user is a team member.

**Parameters**:
- `userId` (string) - UUID of the user (profile ID)

**Returns**: `Promise<GetAllClasResult>`

**Example**:
```typescript
const { clas, error } = await getUserClas(currentUser.id);
console.log(`User is member of ${clas?.length} CLAS`);
```

## Mutation Functions (Write Operations)

⚠️ **Coordinator Only**: These operations are restricted by RLS policies to coordinators only.

### `createClas(clasData: ClasInsert)`

Create a new CLAS center.

**Parameters**:
- `clasData` (ClasInsert) - CLAS data without id, created_at, updated_at

**Returns**: `Promise<CreateClasResult>`
```typescript
{
    clas: Clas | null;
    error: string | null;
}
```

**Example**:
```typescript
const { clas, error } = await createClas({
    name: "CLAS Nouveau Centre",
    location: "123 rue Example, 53000 Laval",
    latitude: 48.0704,
    longitude: -0.7698,
    public_description: "Description du CLAS",
    grade_levels: "CP à CM2",
    capacity: "15",
    allophone_count: "3 familles",
    schedule: "Lundi et Jeudi 16h30-18h00",
});

if (error) {
    toast.error(`Erreur: ${error}`);
} else {
    toast.success("CLAS créé avec succès!");
}
```

### `updateClas(clasUpdate: ClasUpdate)`

Update an existing CLAS.

**Parameters**:
- `clasUpdate` (ClasUpdate) - Must include `id` + fields to update

**Returns**: `Promise<CreateClasResult>`

**Example**:
```typescript
const { clas, error } = await updateClas({
    id: "uuid-here",
    name: "Nouveau nom",
    capacity: "20",
    // Only include fields you want to update
});
```

### `deleteClas(clasId: string)`

Delete a CLAS (also deletes associated team members and contacts via CASCADE).

**Parameters**:
- `clasId` (string) - UUID of the CLAS to delete

**Returns**: `Promise<DeleteClasResult>`
```typescript
{
    success: boolean;
    error: string | null;
}
```

**Example**:
```typescript
const { success, error } = await deleteClas("uuid-here");
if (success) {
    toast.success("CLAS supprimé");
} else {
    toast.error(`Erreur: ${error}`);
}
```

## TypeScript Types

All types are exported from `@/types/database`:

```typescript
import type {
    Clas,
    ClasInsert,
    ClasUpdate,
    ClasWithTeam,
    ClasTeamMember,
    ClasTeamMemberWithProfile,
    ClasRawContact,
    TeamRole,
} from "@/types/database";
```

## RLS Security

All functions respect Row Level Security policies:

| Operation | Coordinator | Animator |
|-----------|-------------|----------|
| Read (SELECT) | ✅ | ✅ |
| Create (INSERT) | ✅ | ❌ |
| Update (UPDATE) | ✅ | ❌ |
| Delete (DELETE) | ✅ | ❌ |

If an animator tries to create/update/delete, the operation will fail with an RLS error.

## Usage in Components

### Client Component Example

```typescript
"use client";

import { useEffect, useState } from "react";
import { getAllClas } from "@/lib/supabase/query/clas";
import type { Clas } from "@/types/database";

export function ClasListComponent() {
    const [clas, setClas] = useState<Clas[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadClas() {
            const { clas, error } = await getAllClas();
            if (!error && clas) {
                setClas(clas);
            }
            setLoading(false);
        }
        loadClas();
    }, []);

    if (loading) return <div>Chargement...</div>;

    return (
        <div>
            {clas.map(c => (
                <div key={c.id}>
                    <h3>{c.name}</h3>
                    <p>{c.location}</p>
                </div>
            ))}
        </div>
    );
}
```

### Server Component Example

```typescript
import { getAllClas } from "@/lib/supabase/query/clas";

export default async function ClasPage() {
    const { clas, error } = await getAllClas();

    if (error) {
        return <div>Erreur: {error}</div>;
    }

    return (
        <div>
            {clas?.map(c => (
                <div key={c.id}>{c.name}</div>
            ))}
        </div>
    );
}
```
