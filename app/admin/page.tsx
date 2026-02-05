import Link from "next/link";
import { User, Map, Home } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/shadcn/card";

export default function AdminDashboard() {
    return (
        <div className="max-w-4xl mx-auto mt-8">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Carte Gestion des Utilisateurs */}
                <Link href="/admin/users">
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-2 hover:border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
                                    <User className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>
                                        Gérer les utilisateurs
                                    </CardTitle>
                                    <CardDescription>
                                        Administrer les comptes, rôles et
                                        permissions.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Carte Gestion des CLAS */}
                <Link href="/admin/clas">
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-2 hover:border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-green-100 text-green-700">
                                    <Map className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Gérer les CLAS</CardTitle>
                                    <CardDescription>
                                        Ajouter et modifier les lieux et projets
                                        CLAS.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Carte Retour au site (prend toute la largeur) */}
                <Link href="/" className="md:col-span-2">
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-2 hover:border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-slate-100 text-slate-700">
                                    <Home className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>Retour au site</CardTitle>
                                    <CardDescription>
                                        Quitter l'administration et revenir à
                                        l'accueil public.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
