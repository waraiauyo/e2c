"use client"; //PAGE DE TEST TOUT SERA CHANGÉ

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchCurrentUser, logoutUser } from "@/lib/redux/features/userSlice";

export default function TEST() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, profile, isLoading, error, isAuthenticated } = useAppSelector(
        (state) => state.user
    );

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const handleLogout = async () => {
        const result = await dispatch(logoutUser());

        if (logoutUser.fulfilled.match(result)) {
            router.push("/login");
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                        {isAuthenticated ? "✓ Connecté" : "○ Non connecté"}
                    </span>
                    {isAuthenticated && (
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            size="sm"
                        >
                            Se déconnecter
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <Card className="mb-6 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            Erreur
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations utilisateur</CardTitle>
                        <CardDescription>
                            Données de session utilisateur
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Profil utilisateur</CardTitle>
                        <CardDescription>
                            Informations du profil
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
