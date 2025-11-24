# Database Schema Documentation

Complete reference for the E2C Supabase database schema.

## Overview

The database consists of 4 main tables:
- `profiles` - User accounts (coordinators and animators)
- `clas` - CLAS centers
- `clas_team_members` - Team assignments
- `clas_raw_contacts` - Unstructured contacts

## Enums

### `account_type`
User account types for role-based access control.

**Values**:
- `coordinator` - Admin role with full CRUD access
- `animator` - Regular user with read-only access

### `team_role`
Roles for CLAS team members.

**Values**:
- `coordinator` - Coordinator of a CLAS
- `animator` - Animator working at a CLAS

## Tables

### `profiles`

User profiles linked to Supabase Auth.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | - | Primary key, FK to `auth.users.id` |
| `email` | text | NO | - | Unique email address |
| `first_name` | text | YES | null | User's first name |
| `last_name` | text | YES | null | User's last name |
| `avatar_url` | text | YES | null | Profile picture URL |
| `account_type` | account_type | NO | 'animator' | User role (coordinator/animator) |
| `created_at` | timestamp | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | YES | null | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `email`

**RLS Policies**: Enabled
- Users can read their own profile
- Only coordinators can modify profiles

---

### `clas`

CLAS educational support centers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | - | CLAS name |
| `location` | text | YES | null | Physical address |
| `latitude` | numeric(10,8) | YES | null | GPS latitude for map display |
| `longitude` | numeric(11,8) | YES | null | GPS longitude for map display |
| `public_description` | text | YES | null | Public-facing description |
| `grade_levels` | text | YES | null | School levels served (e.g., "CP à CM2") |
| `capacity` | text | YES | null | Maximum number of students |
| `allophone_count` | text | YES | null | Number of allophone families |
| `schedule` | text | YES | null | Operating hours/days |
| `created_at` | timestamptz | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | NO | now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `(latitude, longitude)` for geospatial queries

**Triggers**:
- `update_clas_updated_at` - Auto-updates `updated_at` on row modification

**RLS Policies**: Enabled
- All authenticated users can SELECT
- Only coordinators can INSERT/UPDATE/DELETE

**Example Data**:
```sql
{
  "id": "uuid",
  "name": "CLAS Test - Centre Ville",
  "location": "123 rue de la République, 53000 Laval",
  "latitude": 48.0704,
  "longitude": -0.7698,
  "public_description": "CLAS de test pour le centre-ville",
  "grade_levels": "CP à CM2",
  "capacity": "15",
  "allophone_count": "3 familles",
  "schedule": "Lundi et Jeudi de 16h30 à 18h00"
}
```

---

### `clas_team_members`

Team members assigned to CLAS centers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `clas_id` | uuid | NO | - | FK to `clas.id` (CASCADE DELETE) |
| `profile_id` | uuid | YES | null | FK to `profiles.id` (SET NULL) |
| `role` | team_role | NO | - | Member role (coordinator/animator) |
| `name` | text | YES | null | Name (for members without accounts) |
| `contact_phone` | text | YES | null | Phone number |
| `contact_email` | text | YES | null | Email address |
| `notes` | text | YES | null | Additional notes |
| `created_at` | timestamptz | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | NO | now() | Last update timestamp |

**Constraints**:
- `name_or_profile_required`: Either `profile_id` OR `name` must be set

**Indexes**:
- Primary key on `id`
- Index on `clas_id`
- Index on `profile_id`

**Triggers**:
- `update_clas_team_members_updated_at` - Auto-updates `updated_at`

**RLS Policies**: Enabled
- All authenticated users can SELECT
- Only coordinators can INSERT/UPDATE/DELETE

**Relationships**:
- `clas_id` → `clas.id` (CASCADE DELETE)
- `profile_id` → `profiles.id` (SET NULL)

**Usage Pattern**:
- For users with accounts: Set `profile_id`, leave `name` null
- For external members: Set `name` and contact info, leave `profile_id` null

---

### `clas_raw_contacts`

Unstructured contact information for CLAS centers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `clas_id` | uuid | NO | - | FK to `clas.id` (CASCADE DELETE) |
| `name` | text | YES | null | Contact name |
| `email` | text | YES | null | Email address |
| `phone` | text | YES | null | Phone number |
| `created_at` | timestamptz | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | NO | now() | Last update timestamp |

**Constraints**:
- `contact_info_required`: At least one of `name`, `email`, or `phone` must be set

**Indexes**:
- Primary key on `id`
- Index on `clas_id`

**Triggers**:
- `update_clas_raw_contacts_updated_at` - Auto-updates `updated_at`

**RLS Policies**: Enabled
- All authenticated users can SELECT
- Only coordinators can INSERT/UPDATE/DELETE

**Relationships**:
- `clas_id` → `clas.id` (CASCADE DELETE)

---

## Helper Functions

### `is_coordinator()`

Check if the current user is a coordinator.

```sql
CREATE FUNCTION is_coordinator() RETURNS boolean
```

**Returns**: `true` if current user has `account_type = 'coordinator'`

**Usage in policies**:
```sql
CREATE POLICY "coordinators_can_update"
  ON clas FOR UPDATE
  USING (is_coordinator());
```

### `is_authenticated_user()`

Check if a user is authenticated (exists in profiles).

```sql
CREATE FUNCTION is_authenticated_user() RETURNS boolean
```

**Returns**: `true` if `auth.uid()` exists in `profiles` table

**Usage in policies**:
```sql
CREATE POLICY "authenticated_can_read"
  ON clas FOR SELECT
  USING (is_authenticated_user());
```

### `update_updated_at_column()`

Trigger function to auto-update `updated_at` column.

```sql
CREATE FUNCTION update_updated_at_column() RETURNS trigger
```

**Applied to**: All tables with `updated_at` column

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies enforce role-based access:

### Summary Table

| Table | Operation | Coordinator | Animator |
|-------|-----------|-------------|----------|
| `profiles` | SELECT | Own profile | Own profile |
| `profiles` | UPDATE | ✅ All | Own profile |
| `clas` | SELECT | ✅ | ✅ |
| `clas` | INSERT | ✅ | ❌ |
| `clas` | UPDATE | ✅ | ❌ |
| `clas` | DELETE | ✅ | ❌ |
| `clas_team_members` | SELECT | ✅ | ✅ |
| `clas_team_members` | INSERT/UPDATE/DELETE | ✅ | ❌ |
| `clas_raw_contacts` | SELECT | ✅ | ✅ |
| `clas_raw_contacts` | INSERT/UPDATE/DELETE | ✅ | ❌ |

### Policy Patterns

**Read access for all authenticated users**:
```sql
CREATE POLICY "Authenticated users can view {table}"
  ON {table} FOR SELECT
  TO authenticated
  USING (is_authenticated_user());
```

**Write access for coordinators only**:
```sql
CREATE POLICY "Only coordinators can {operation} {table}"
  ON {table} FOR {INSERT|UPDATE|DELETE}
  TO authenticated
  USING (is_coordinator())
  WITH CHECK (is_coordinator());
```

---

## Data Import

To import initial CLAS data from JSON:

```bash
npx tsx scripts/import-clas-data.ts
```

See `scripts/README.md` for details.

---

## Migrations

All migrations are in `supabase/migrations/`:

1. `update_account_type_roles` - Change admin/user to coordinator/animator
2. `create_clas_table` - Create main CLAS table
3. `create_clas_team_members_table` - Create team members table
4. `create_clas_raw_contacts_table` - Create raw contacts table
5. `create_clas_rls_policies` - Set up RLS policies
6. `fix_function_search_path` - Security improvements for functions
7. `remove_volunteer_role` - Remove volunteer from team_role enum
8. `add_coordinates_to_clas` - Add latitude/longitude for map feature

---

## TypeScript Types

All database types are defined in `types/database.ts`:

```typescript
import type {
    AccountType,
    TeamRole,
    Profile,
    Clas,
    ClasTeamMember,
    ClasRawContact,
    ClasWithTeam,
    ClasTeamMemberWithProfile,
} from "@/types/database";
```
