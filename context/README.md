# Context Documentation

This directory contains detailed technical documentation for the E2C project.

## Files Overview

### [`CLAS_API.md`](./CLAS_API.md)
Complete API reference for CLAS operations. Includes:
- All available query functions (read operations)
- Mutation functions (create/update/delete)
- TypeScript type definitions
- Usage examples for Client and Server Components
- RLS security information

**Use this when**: You need to work with CLAS data in your components.

### [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)
Complete database schema documentation. Includes:
- All tables with column definitions
- Enum types (account_type, team_role)
- Indexes and constraints
- RLS policies and helper functions
- Migration history
- Data relationships and foreign keys

**Use this when**: You need to understand the database structure or modify the schema.

## Quick Links

### Common Tasks

**Display all CLAS on a page**:
```typescript
import { getAllClas } from "@/lib/supabase/query/clas";
const { clas, error } = await getAllClas();
```
See: [CLAS_API.md - getAllClas()](./CLAS_API.md#getallclas)

**Create a new CLAS** (coordinator only):
```typescript
import { createClas } from "@/lib/supabase/query/clas";
const { clas, error } = await createClas({ name, location, ... });
```
See: [CLAS_API.md - createClas()](./CLAS_API.md#createclasclasdata-clasinsert)

**Check database schema**:
See: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**Understand RLS policies**:
See: [DATABASE_SCHEMA.md - Row Level Security](./DATABASE_SCHEMA.md#row-level-security-rls)

## Architecture Patterns

### Server Actions Pattern

All Supabase operations must use Server Actions:

```typescript
// ✅ Correct - Server Action
"use server";
import { createClient } from "@/lib/supabase/server";

export async function myOperation() {
    const supabase = await createClient();
    // ... operations
}
```

```typescript
// ❌ Incorrect - Direct client usage in Client Component
"use client";
import { createClient } from "@/lib/supabase/client";

export function MyComponent() {
    const supabase = createClient(); // Don't do this for database queries!
    // Use Server Actions instead
}
```

### Role-Based Access

The application has two user roles:

| Role | Database Name | Permissions |
|------|---------------|-------------|
| Admin | `coordinator` | Full CRUD on all CLAS data |
| User | `animator` | Read-only on all CLAS data |

Check user role:
```typescript
import { getCurrentUserProfile } from "@/lib/supabase/query/profiles";
const { profile } = await getCurrentUserProfile();
const isCoordinator = profile?.account_type === 'coordinator';
```

### Data Fetching Patterns

**Server Component** (preferred for initial page load):
```typescript
export default async function Page() {
    const { clas, error } = await getAllClas();
    return <div>{/* render clas */}</div>;
}
```

**Client Component** (for interactive features):
```typescript
"use client";
export function Component() {
    const [data, setData] = useState([]);

    useEffect(() => {
        async function load() {
            const { clas } = await getAllClas();
            setData(clas);
        }
        load();
    }, []);

    return <div>{/* render data */}</div>;
}
```

## File Organization

```
e2c/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Home page
├── components/                 # React components
│   ├── pages/                  # Page-level components
│   ├── shadcn/                 # shadcn/ui components
│   ├── providers/              # Context providers
│   └── wrappers/               # Layout wrappers
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   ├── auth.ts             # Auth operations
│   │   └── query/              # Database queries
│   │       ├── profiles.ts     # User profiles
│   │       └── clas.ts         # CLAS operations ⭐
│   ├── redux/                  # Redux state management
│   └── utils.ts                # Utility functions
├── types/
│   └── database.ts             # TypeScript types ⭐
├── scripts/
│   ├── import-clas-data.ts     # Data import script ⭐
│   └── README.md               # Scripts documentation
├── context/                    # Technical documentation ⭐
│   ├── README.md               # This file
│   ├── CLAS_API.md             # API reference
│   └── DATABASE_SCHEMA.md      # Schema documentation
└── CLAUDE.md                   # High-level project guide

⭐ = Files created for CLAS feature
```

## Development Workflow

### Adding a New Feature

1. **Plan database changes** (if needed)
   - Review [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)
   - Create migration: `npx supabase migration new feature_name`

2. **Update TypeScript types**
   - Edit `types/database.ts`

3. **Create Server Actions**
   - Add functions to `lib/supabase/query/`
   - Follow patterns in [`CLAS_API.md`](./CLAS_API.md)

4. **Build UI components**
   - Use Server Components when possible
   - Use Client Components for interactivity

5. **Update documentation**
   - Update this context documentation
   - Update `CLAUDE.md` if needed

### Testing Permissions

To test RLS policies:

1. **As Coordinator** (should work):
   ```typescript
   await createClas({ name: "Test CLAS", ... });
   ```

2. **As Animator** (should fail):
   - Change user's `account_type` to 'animator' in database
   - Try same operation - should get RLS error

## Resources

- **Main documentation**: [`/CLAUDE.md`](../CLAUDE.md)
- **API reference**: [`CLAS_API.md`](./CLAS_API.md)
- **Database schema**: [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)
- **Scripts**: [`/scripts/README.md`](../scripts/README.md)
- **Supabase docs**: https://supabase.com/docs
- **Next.js docs**: https://nextjs.org/docs
