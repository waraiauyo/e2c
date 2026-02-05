import { getAllClas } from "@/lib/supabase/query/clas";
import { ClasActions } from "@/components/admin/clas/clas-actions";
import { ClasDialog } from "@/components/admin/clas/clas-dialogs";
import { Badge } from "@/components/shadcn/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/shadcn/table";
import { MapPin, Users } from "lucide-react";

// Badge component pour le niveau scolaire avec couleurs cohérentes
const GradeBadge = ({ level }: { level: string }) => {
    const variants: Record<
        string,
        { label: string; variant: "default" | "secondary" | "outline" }
    > = {
        primary: { label: "Primaire", variant: "secondary" }, // Gris clair (Theme Secondary)
        middle_school: { label: "Collège", variant: "default" }, // Noir/Blanc (Theme Primary)
    };

    const style = variants[level] || { label: level, variant: "outline" };

    return <Badge variant={style.variant}>{style.label}</Badge>;
};

export default async function AdminClasPage() {
    // Récupération des données côté serveur
    const { clas: clasList, error } = await getAllClas();

    if (error) {
        return (
            <div className="p-4 rounded-md bg-destructive/15 text-destructive">
                Erreur lors du chargement des CLAS : {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* En-tête de page standardisé */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Gestion des CLAS
                    </h2>
                    <p className="text-muted-foreground">
                        Visualisez et gérez les centres, leur capacité et les
                        équipes pédagogiques.
                    </p>
                </div>

                {/* Utilisation du Dialog en mode création à la place du bouton simple */}
                <ClasDialog mode="create" />
            </div>

            {/* Conteneur style "Card" pour le tableau */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Centre</TableHead>
                            <TableHead>Niveau</TableHead>
                            <TableHead>Localisation</TableHead>
                            <TableHead className="text-center">
                                Capacité
                            </TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!clasList || clasList.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-32 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                        <Users className="h-8 w-8 opacity-50" />
                                        <p>
                                            Aucun CLAS configuré pour le moment.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clasList.map((clas) => (
                                <TableRow key={clas.id} className="group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-base">
                                                {clas.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <GradeBadge level={clas.grade_level} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="mr-2 h-3.5 w-3.5" />
                                            {clas.location || "Non renseigné"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {clas.capacity ? (
                                            <span className="font-mono font-medium">
                                                {clas.capacity}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/50">
                                                -
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Menu d'actions (Modifier, Supprimer, Voir) */}
                                        <ClasActions clas={clas} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
