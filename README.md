# Gestionnaire de Tournoi

Une application web complète pour gérer des tournois sportifs avec des poules éliminatoires.

## Caractéristiques

- 🔐 Authentification sécurisée avec Supabase
- 📊 Gestion de 4 poules (5, 6, 6, 6 équipes)
- 🥊 Suivi des matchs (8ème, quart, demi-finale, finale)
- 🏆 Classement automatique par points
- 📱 Interface responsive
- ⚡ Déployable sur Vercel

## Architecture

### Structure des Poules
- **Poule 1**: 5 équipes
- **Poule 2**: 6 équipes
- **Poule 3**: 6 équipes
- **Poule 4**: 6 équipes

### Phases Éliminatoires
- 8ème de Finale (16 matchs)
- Quart de Finale (8 matchs)
- Demi-Finale (4 matchs)
- Finale (1 match)

## Configuration Supabase

### 1. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre `Project URL` et `Anon Key`

### 2. Exécuter le script SQL
1. Allez dans le SQL Editor de Supabase
2. Copiez le contenu du fichier `supabase-setup.sql`
3. Exécutez le script pour créer les tables et les politiques RLS

### 3. Configurer les variables d'environnement
Créez un fichier `.env.local` avec:

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

## Installation Locale

```bash
# Installer les dépendances
pnpm install

# Démarrer le serveur de développement
pnpm dev

# Ouvrir http://localhost:3000
```

## Déploiement sur Vercel

### 1. Connecter le dépôt Git
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <votre-repo-url>
git push -u origin main
```

### 2. Importer sur Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Sélectionnez votre dépôt GitHub
4. Ajoutez les variables d'environnement:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Cliquez sur "Deploy"

## Utilisation

### 1. Créer un compte
- Accédez à l'application
- Cliquez sur "S'inscrire"
- Entrez votre email et mot de passe

### 2. Ajouter des équipes
- Allez dans l'onglet "Poules"
- Pour chaque poule, entrez le nom de l'équipe
- Cliquez sur "Ajouter"

### 3. Gérer les matchs
- Allez dans l'onglet correspondant (8ème, quart, demi, finale)
- Cliquez sur "Saisir" pour entrer les scores
- Les résultats sont automatiquement enregistrés

## Structure du Projet

```
├── app/
│   ├── page.tsx              # Page d'accueil (redirection)
│   ├── login/
│   │   └── page.tsx          # Page de connexion
│   └── dashboard/
│       └── page.tsx          # Tableau de bord principal
├── components/
│   ├── Login.tsx             # Formulaire d'authentification
│   ├── Poule.tsx             # Gestion des poules
│   └── Bracket.tsx           # Gestion des matchs éliminatoires
├── lib/
│   ├── supabase.ts           # Configuration Supabase
│   ├── auth.ts               # Fonctions d'authentification
│   └── tournament.ts         # Logique du tournoi
└── supabase-setup.sql        # Script de configuration BD
```

## Technologies Utilisées

- **Frontend**: React, Next.js 16, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Déploiement**: Vercel
- **Authentification**: Supabase Auth

## Licence

MIT
