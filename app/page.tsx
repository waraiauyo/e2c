"use client"; //PAGE DE TEST TOUT SERA CHANGÉ

import { useEffect, useState } from "react";
import { getUser, logout } from "@/lib/supabase/auth";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Index() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    const fetchUser = async () => {
        const { user, error } = await getUser();

        if (error) {
            console.error(error);
            return;
        }

        setUser(user);
    };

    const handleLogout = async () => {
        const result = await logout();

        if (result.success) {
            router.push("/login");
        } else {
            console.error(result.message);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <div className="p-4">
            <pre>{JSON.stringify(user, null, 2)}</pre>
            {user && (
                <Button onClick={handleLogout} className="mt-4">
                    Se déconnecter
                </Button>
            )}
        </div>
    );
}
