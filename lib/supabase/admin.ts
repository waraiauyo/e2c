import { createClient } from "@supabase/supabase-js";

// Client avec droits "Service Role" (Admin suprême)
// ATTENTION : À utiliser uniquement dans les Server Actions (jamais côté client)
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
