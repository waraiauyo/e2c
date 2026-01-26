-- Migration: RLS policies for drive bucket
-- Description:
--   - Owner of file has full access (update, delete)
--   - All authenticated users can read/download (select) and upload (insert)
--   - Admins can do everything

-- Drop old permissive policies if they exist
DROP POLICY IF EXISTS "Les auths peuvent tout faire 1l2glm_0" ON storage.objects;
DROP POLICY IF EXISTS "Les auths peuvent tout faire 1l2glm_1" ON storage.objects;
DROP POLICY IF EXISTS "Les auths peuvent tout faire 1l2glm_2" ON storage.objects;
DROP POLICY IF EXISTS "Les auths peuvent tout faire 1l2glm_3" ON storage.objects;
DROP POLICY IF EXISTS "Les auths peuvent tout faire" ON storage.objects;

-- Drop new policies if they exist (for idempotency)
DROP POLICY IF EXISTS "drive_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "drive_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "drive_update_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "drive_delete_owner_or_admin" ON storage.objects;

-- 1. SELECT: All authenticated users can read/download files
CREATE POLICY "drive_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'drive');

-- 2. INSERT: All authenticated users can upload files
-- The owner_id is automatically set by Supabase during upload
CREATE POLICY "drive_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'drive');

-- 3. UPDATE: Only file owner or admins can update
CREATE POLICY "drive_update_owner_or_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'drive'
    AND (
        owner_id = (SELECT auth.uid())::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND account_type = 'admin'
        )
    )
)
WITH CHECK (
    bucket_id = 'drive'
    AND (
        owner_id = (SELECT auth.uid())::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND account_type = 'admin'
        )
    )
);

-- 4. DELETE: Only file owner or admins can delete
CREATE POLICY "drive_delete_owner_or_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'drive'
    AND (
        owner_id = (SELECT auth.uid())::text
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND account_type = 'admin'
        )
    )
);
