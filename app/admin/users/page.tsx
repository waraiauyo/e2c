import { getAllUsers } from "@/lib/supabase/query/profiles";
import { UserActions } from "@/components/admin/users/user-actions";
import { UserDialog } from "@/components/admin/users/user-dialogs";
import { Badge } from "@/components/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { Users as UsersIcon } from "lucide-react";

const RoleBadge = ({ role }: { role: string }) => {
    const styles: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
        admin: "destructive", // Rouge pour les admins (pouvoir !)
        coordinator: "default", // Noir/Blanc (Primary)
        director: "secondary", // Gris (Secondary)
        animator: "outline", // Bordure simple
    };

    const labels: Record<string, string> = {
        admin: "Administrateur",
        coordinator: "Coordinateur",
        director: "Directeur",
        animator: "Animateur",
    };

    return <Badge variant={styles[role] || "outline"}>{labels[role] || role}</Badge>;
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Utilisateurs</h2>
          <p className="text-muted-foreground">
            Gérez les comptes, les rôles et les accès à la plateforme.
          </p>
        </div>
        {/* Composant Dialog en mode création */}
        <UserDialog mode="create" />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Identité</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
               <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <UsersIcon className="h-8 w-8 opacity-50" />
                    <p>Aucun utilisateur trouvé.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="uppercase">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.account_type} />
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions user={user} />
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