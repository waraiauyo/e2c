# Espace collaboratif du CLAS | E2C

Application web collaborative destinée aux Contrats Locaux d'Accompagnement à la Scolarité (CLAS) de Mayenne. Cette plateforme centralisée remplace l'organisation actuelle via WhatsApp en offrant un espace professionnel dédié à la coordination des activités de soutien scolaire.

## 🎯 Présentation du projet

### Contexte

Les CLAS représentent un dispositif essentiel d'accompagnement à la scolarité en Mayenne, offrant gratuitement aux élèves un soutien méthodologique et culturel complémentaire à l'école. Ces structures impliquent de nombreux acteurs (coordinateurs, animateurs, bénévoles) répartis sur l'ensemble du département.

### Partenaire

**Caisse d'Allocations Familiales (CAF) de Mayenne** - Financement du projet

## ✨ Fonctionnalités

### Fonctionnalités principales

- 🗂️ **Espace de ressources partagées** - Dépôt et consultation de fichiers pédagogiques
- 🗺️ **Carte interactive** - Localisation de l'ensemble des CLAS de Mayenne
- 💬 **Communication interne** - Fil d'actualités et discussions
- 📅 **Gestion des plannings** - Système adapté aux besoins spécifiques des CLAS

### Objectifs opérationnels

- Centraliser l'ensemble des outils de gestion dans une interface unique
- Simplifier les processus de coordination entre les différents CLAS
- Faciliter le partage de ressources pédagogiques
- Optimiser la planification des activités

## 🛠️ Stack technique

- **Framework :** [Next.js 15.5.3](https://nextjs.org/) avec Turbopack
- **Langage :** TypeScript
- **Styling :** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Base de données :** [Supabase](https://supabase.com/) (authentification + données)
- **État global :** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icônes :** [Lucide React](https://lucide.dev/)

## 🚀 Installation

### Prérequis

- Node.js 18+

### Configuration

1. **Cloner le repository**
   ```bash
   git clone https://github.com/waraiauyo/e2c.git
   cd e2c
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Renseignez les variables d'environnement Supabase dans le fichier `.env` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

4. **Lancement du serveur de développement**
   ```bash
   npm run dev
   ```

L'application sera accessible à l'adresse : `http://localhost:3000`

## 📜 Scripts disponibles

```bash
npm run dev        # Serveur de développement avec Turbopack
npm run build      # Build de production avec Turbopack  
npm run start      # Serveur de production
npm run lint       # Linting du code avec ESLint
```

## 🏗️ Architecture du projet

```
e2c/
├── app/                   # App Router
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React réutilisables
├── lib/                   # Utilitaires et configuration
│   ├── supabase/          # Configuration Supabase
│   └── utils.ts           # Fonctions utilitaires
├── types/                 # Types TypeScript
├── public/                # Assets statiques
└── middleware.ts          # Middleware Next.js (auth, etc.)
```