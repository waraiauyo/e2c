-- Migration: Create RPC function to get drive file owners with profile info
-- This function allows retrieving owner_id and profile info from storage.objects for permission checks and display

DROP FUNCTION IF EXISTS get_drive_file_owners(uuid[]);

CREATE OR REPLACE FUNCTION get_drive_file_owners(file_ids uuid[])
RETURNS TABLE(
    id uuid,
    owner_id text,
    owner_first_name text,
    owner_last_name text,
    owner_avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = storage, public
AS $$
    SELECT
        o.id,
        o.owner_id,
        p.first_name,
        p.last_name,
        p.avatar_url
    FROM storage.objects o
    LEFT JOIN public.profiles p ON p.id::text = o.owner_id
    WHERE o.id = ANY(file_ids)
    AND o.bucket_id = 'drive';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_drive_file_owners(uuid[]) TO authenticated;
