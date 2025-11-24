# Scripts d'import de données

## Import des données CLAS

Le script `import-clas-data.ts` permet d'importer les données CLAS depuis le fichier JSON vers la base de données Supabase.

### Prérequis

1. **Obtenir la clé Service Role** :
   - Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
   - Allez dans `Settings` > `API`
   - Copiez la clé `service_role` (⚠️ **Ne jamais exposer cette clé publiquement !**)

2. **Configurer les variables d'environnement** :
   Ajoutez la clé dans votre fichier `.env` :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_ici
   ```

### Exécution du script

```bash
# Depuis la racine du projet
npx tsx scripts/import-clas-data.ts
```

### Ce que fait le script

Le script importe automatiquement :

1. **Les informations principales des CLAS** → table `clas`
   - Nom, localisation, description publique
   - Niveaux scolaires, capacité, nombre d'allophones
   - Horaires

2. **Les membres de l'équipe** → table `clas_team_members`
   - Coordinateurs
   - Animateurs
   - ⚠️ Les bénévoles ne sont **pas** importés

3. **Les contacts bruts** → table `clas_raw_contacts`
   - Contacts non structurés associés aux CLAS

### Structure des données

Le script attend un fichier JSON à `/Users/valentinrnld/Downloads/clas.json` avec la structure suivante :

```json
{
  "clas_mayenne": [
    {
      "id": 1,
      "nom": "Nom du CLAS",
      "location": "Adresse",
      "public_description": "Description",
      "niveaux": "CP au CM2",
      "capacite": "8-12",
      "allophones": "3 familles",
      "horaires": "Les mardis et jeudis de 15h45 à 17h30",
      "equipe": {
        "coordinateur": {
          "nom": "Nom Prénom",
          "contact": "06 XX XX XX XX",
          "email": "email@example.com"
        },
        "animateur": { ... },
        "benevoles": {
          "liste": [...],
          "description": "5 BENEVOLES"
        }
      },
      "contacts_bruts": [
        {
          "nom": "Nom Contact",
          "email": "contact@example.com",
          "telephone": "02 XX XX XX XX"
        }
      ]
    }
  ]
}
```

### En cas d'erreur

Si le script échoue :
1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien définie dans `.env`
2. Vérifiez que le fichier JSON existe au bon emplacement
3. Consultez les messages d'erreur pour identifier le CLAS problématique

### Sécurité

⚠️ **IMPORTANT** : La clé `service_role` contourne toutes les politiques RLS et donne un accès complet à la base de données.

- Ne **JAMAIS** utiliser cette clé dans le code frontend
- Ne **JAMAIS** committer cette clé dans Git
- Utiliser uniquement pour les scripts d'administration côté serveur
