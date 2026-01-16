import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/supabase/query/profiles";
import { SidebarProvider, SidebarTrigger } from "@/components/shadcn/sidebar";
// Importez votre Sidebar admin ici si vous en avez une, sinon utilisez un wrapper simple

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Récupérer le profil de l'utilisateur connecté
  const { profile, error } = await getCurrentUserProfile();

  // 2. Vérification de sécurité stricte
  if (error || !profile) {
    redirect("/login");
  }

  if (profile.account_type !== "admin") {
    // Si l'utilisateur n'est pas admin, on le renvoie à l'accueil ou page 403
    redirect("/");
  }

  // 3. Rendu du layout admin
  return (
    <div className="flex min-h-screen flex-col">
       <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
          <h1 className="font-semibold text-lg">E2C Administration</h1>
          <nav className="ml-auto flex gap-4 text-sm">
            <a href="/admin/users">Utilisateurs</a>
            <a href="/admin/clas">CLAS</a>
            <a href="/">Retour au site</a>
          </nav>
       </header>
       <main className="flex-1 p-6">
        {children}
       </main>
    </div>
  );
}