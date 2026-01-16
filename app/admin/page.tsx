export default function AdminDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Ajoutez ici des cartes de statistiques (Nombre de CLAS, Utilisateurs...) */}
      <div className="p-6 bg-card rounded-xl border shadow-sm">
        <h3 className="font-semibold">Bienvenue sur l'administration</h3>
        <p className="text-sm text-muted-foreground">Sélectionnez un menu ci-dessus.</p>
      </div>
    </div>
  )
}