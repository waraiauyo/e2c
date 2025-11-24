# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E2C (Espace collaboratif du CLAS) is a collaborative web application for educational support centers (CLAS - Contrats Locaux d'Accompagnement à la Scolarité) in Mayenne, France. The platform replaces the current WhatsApp-based organization with a professional dedicated space for coordinating educational support activities.

**Funding Partner**: Caisse d'Allocations Familiales (CAF) de Mayenne

## Tech Stack

- **Framework**: Next.js 15.5.3 with App Router and Turbopack
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Backend**: Supabase (auth + database)
- **State Management**: Redux Toolkit with async thunks
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Themes**: next-themes for dark/light mode

## Development Commands

```bash
npm run dev      # Start dev server with Turbopack on localhost:3000
npm run build    # Production build with Turbopack
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required in `.env` (see `.env.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
NEXT_PUBLIC_SITE_URL=              # Site URL for redirects (e.g., password reset)
```

## Architecture

### Path Aliases (tsconfig.json)

- `@/*` - Root directory (maps to `./`)
- `@/components` - React components
- `@/lib` - Utilities and configuration
- `@/components/shadcn` - shadcn/ui components
- `@/hooks` - Custom React hooks

### Supabase Integration

**Two Client Types:**

1. **Browser Client** (`lib/supabase/client.ts`):
   - Used in Client Components
   - Created with `createBrowserClient` from `@supabase/ssr`
   - Uses environment variables directly

2. **Server Client** (`lib/supabase/server.ts`):
   - Used in Server Components and Server Actions
   - Created with `createServerClient` from `@supabase/ssr`
   - Handles cookies for session management
   - Must be awaited: `const supabase = await createClient()`

**Auth Functions** (`lib/supabase/auth.ts`):
- All marked with `"use server"` directive
- `login(email, password)` - Returns `LoginResult`
- `logout()` - Returns `LogoutResult`
- `getUser()` - Returns current authenticated user
- `sendPasswordResetEmail(email)` - Sends reset link to `${NEXT_PUBLIC_SITE_URL}/reset-password`
- `updatePassword(newPassword)` - Updates user password

**Database Queries**:
- `lib/supabase/query/profiles.ts` - User profile operations
  - `getUserProfile(userId)` - Fetch specific user profile
  - `getCurrentUserProfile()` - Fetch current authenticated user's profile

- `lib/supabase/query/clas.ts` - CLAS operations (see `/context/CLAS_API.md` for full API)
  - `getAllClas()` - Get all CLAS centers
  - `getClasById(id)` - Get single CLAS
  - `getClasWithTeam(id)` - Get CLAS with team members and contacts
  - `getAllClasWithTeams()` - Get all CLAS with team info
  - `createClas(data)` - Create CLAS (coordinator only)
  - `updateClas(data)` - Update CLAS (coordinator only)
  - `deleteClas(id)` - Delete CLAS (coordinator only)
  - `getClasTeamMembers(clasId)` - Get team members with profiles
  - `getUserClas(userId)` - Get CLAS where user is team member

### Database Schema

**User Roles** (account_type enum):
- `coordinator` - Full access (admin role, can CRUD all data)
- `animator` - Read-only access (can view all CLAS data)

**Table: `profiles`** (RLS enabled)
- `id` (uuid) - Primary key, foreign key to `auth.users.id`
- `email` (text, unique)
- `first_name`, `last_name` (text, nullable)
- `avatar_url` (text, nullable)
- `account_type` (enum: 'coordinator' | 'animator', default: 'animator')
- `created_at` (timestamp)
- `updated_at` (timestamptz, nullable)

**Table: `clas`** (RLS enabled)
- `id` (uuid) - Primary key
- `name` (text) - CLAS name
- `location` (text, nullable) - Physical address
- `latitude`, `longitude` (numeric, nullable) - GPS coordinates for map display
- `public_description` (text, nullable) - Public description
- `grade_levels` (text, nullable) - School levels (e.g., "CP à CM2", "Collège")
- `capacity` (text, nullable) - Student capacity
- `allophone_count` (text, nullable) - Number of allophone students
- `schedule` (text, nullable) - Operating schedule
- `created_at`, `updated_at` (timestamptz)

**Table: `clas_team_members`** (RLS enabled)
- `id` (uuid) - Primary key
- `clas_id` (uuid) - Foreign key to `clas`
- `profile_id` (uuid, nullable) - Foreign key to `profiles` (for users with accounts)
- `role` (enum: 'coordinator' | 'animator') - Team member role
- `name` (text, nullable) - Name for members without accounts
- `contact_phone`, `contact_email` (text, nullable) - Contact information
- `notes` (text, nullable) - Additional notes
- `created_at`, `updated_at` (timestamptz)

**Table: `clas_raw_contacts`** (RLS enabled)
- `id` (uuid) - Primary key
- `clas_id` (uuid) - Foreign key to `clas`
- `name`, `email`, `phone` (text, nullable) - Contact information
- `created_at`, `updated_at` (timestamptz)

**RLS Policies**: All tables have Row Level Security enabled
- **Coordinators**: Full CRUD access on all CLAS tables
- **Animators**: Read-only access on all CLAS tables
- Helper functions: `is_coordinator()`, `is_authenticated_user()`

**Migrations**: Located in `supabase/migrations/` directory.

### Redux State Management

**Store Configuration** (`lib/redux/store.ts`):
- Single slice: `user` (from `userSlice`)
- Custom middleware config to ignore Supabase non-serializable objects in actions

**User Slice** (`lib/redux/features/userSlice.ts`):

State shape:
```typescript
{
  user: User | null,              // Supabase auth user
  profile: UserProfile | null,     // User profile from database
  isLoading: boolean,
  isAuthenticated: boolean,
  error: string | null
}
```

Async thunks:
- `loginUser({ email, password })` - Logs in, fetches user + profile
- `logoutUser()` - Logs out, clears state
- `fetchCurrentUser()` - Fetches current user + profile
- `fetchUserProfile(userId)` - Fetches specific user profile

Actions:
- `clearError()` - Clear error state
- `setUser(user)` - Set user directly
- `setProfile(profile)` - Set profile directly

**Usage Pattern**:
```typescript
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { loginUser } from '@/lib/redux/features/userSlice';

const dispatch = useAppDispatch();
const { user, profile, isLoading, error } = useAppSelector(state => state.user);
```

### Component Organization

```
components/
├── providers/          # Context providers (ThemeProvider)
├── shadcn/             # shadcn/ui components (button, card, input, form, etc.)
├── wrappers/           # Layout wrappers (MainWrapper)
└── pages/              # Page-level components (LoginPage, ResetPasswordPage, etc.)
```

**Pattern**: Page components are separated from route files. Route files (`app/**/*.tsx`) import from `components/pages/`.

### App Router Structure

```
app/
├── layout.tsx           # Root layout with providers (Theme, Redux, Toast)
├── page.tsx             # Home page
├── login/page.tsx       # Login route
├── forgot-password/page.tsx
├── reset-password/page.tsx
└── globals.css          # Global styles + Tailwind imports
```

**Root Layout Providers** (in order):
1. `StoreProvider` (Redux)
2. `ThemeProvider` (next-themes)
3. `MainWrapper` (layout wrapper)
4. `Toaster` (sonner notifications)

### shadcn/ui Configuration

**components.json**:
- Style: `new-york`
- RSC: enabled
- CSS variables: enabled
- Base color: `neutral`
- Icon library: `lucide`
- Component path: `@/components/shadcn`

**Adding components**: Use `npx shadcn@latest add <component-name>`

## Key Implementation Patterns

### Server Actions

All Supabase interactions should be in Server Actions (files marked with `"use server"`):

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";

export async function myServerAction() {
    const supabase = await createClient(); // Must await!
    // ... Supabase operations
}
```

### Authentication Flow

1. User submits login form (Client Component)
2. Dispatch `loginUser` Redux thunk
3. Thunk calls server action `login()`
4. Server action uses server Supabase client
5. On success, fetches user + profile
6. Redux state updates with user data

### Form Handling

Uses React Hook Form + Zod + shadcn/ui form components:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
    email: z.string().email(),
});

const form = useForm({
    resolver: zodResolver(schema),
});
```

### Toast Notifications

Use `sonner` for notifications:

```typescript
import { toast } from "sonner";

toast.success("Message de succès");
toast.error("Message d'erreur");
```

## Supabase CLI

The project includes `supabase` CLI as a dev dependency. Use it for:
- `npx supabase status` - Check project status
- `npx supabase migration new <name>` - Create new migration
- `npx supabase db push` - Push migrations to remote

## Important Notes

- **Language**: UI text is in French (user-facing messages, toasts, etc.)
- **Strict TypeScript**: Enabled in tsconfig.json
- **No middleware.ts**: Authentication is handled via server actions, not Next.js middleware
- **Turbopack**: All scripts use `--turbopack` flag for faster builds
- **Supabase Project**: `https://nuwofzihsbsrymfsdwho.supabase.co`
