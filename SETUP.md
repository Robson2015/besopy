# Guide de Configuration Complet

## Étape 1: Configuration de Supabase

### 1.1 Créer un compte Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous

### 1.2 Créer un projet
1. Cliquez sur "New Project"
2. Sélectionnez votre organisation
3. Entrez le nom du projet (ex: "tournament-app")
4. Entrez un mot de passe fort
5. Sélectionnez la région (Europe de préférence)
6. Cliquez sur "Create new project"

### 1.3 Initialiser les tables
1. Attendez que le projet soit créé
2. Allez dans l'onglet "SQL Editor"
3. Cliquez sur "New Query"
4. Copiez tout le contenu du fichier `supabase-setup.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur "Run"

### 1.4 Copier les clés d'API
1. Allez dans "Project Settings" → "API"
2. Copiez:
   - **Project URL** (sous "Project API URL")
   - **anon public** (sous "API keys")

## Étape 2: Configuration Locale

### 2.1 Cloner ou préparer le projet
```bash
# Si vous n'avez pas le projet
git clone <votre-repo-url>
cd tournament-app

# Ou créez le fichier .env.local
touch .env.local
```

### 2.2 Configurer les variables d'environnement
Ouvrez `.env.local` et ajoutez:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Remplacez les valeurs par celles copiées depuis Supabase!**

### 2.3 Installer les dépendances
```bash
pnpm install
```

### 2.4 Lancer en développement
```bash
pnpm dev
```

Ouvrez http://localhost:3000

## Étape 3: Test Local

### 3.1 Créer un compte
1. Cliquez sur "S'inscrire"
2. Entrez un email (ex: test@example.com)
3. Entrez un mot de passe
4. Cliquez sur "S'inscrire"

### 3.2 Ajouter des équipes
1. Vous êtes redirigé vers le Dashboard
2. Allez dans l'onglet "Poules"
3. Pour chaque poule, ajoutez les équipes:
   - Poule 1: 5 équipes
   - Poule 2: 6 équipes
   - Poule 3: 6 équipes
   - Poule 4: 6 équipes

### 3.3 Configurer les matchs (optionnel pour le test)
- Allez dans l'onglet "8ème de Finale"
- Les matchs devront être créés manuellement en base de données

## Étape 4: Déploiement sur Vercel

### 4.1 Préparer Git
```bash
git add .
git commit -m "Initial commit - Tournament app"
git push origin main
```

### 4.2 Déployer sur Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Sélectionnez votre dépôt GitHub
4. Dans "Environment Variables", ajoutez:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co`
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. Cliquez sur "Deploy"

### 4.3 Accéder à l'app
Une fois déployée, cliquez sur l'URL pour accéder à votre application!

## Dépannage

### Les équipes ne s'ajoutent pas
- Vérifiez que Supabase a les tables créées (SQL Editor)
- Vérifiez que les variables d'environnement sont correctes
- Vérifiez la console du navigateur (F12) pour les erreurs

### Erreur de connexion
- Vérifiez que l'email/mot de passe sont corrects
- Attendez quelques secondes et réessayez
- Vérifie que Supabase Auth est activé

### L'app se charge lentement
- Vérifiez votre connexion internet
- Vérifiez que le serveur de développement est actif (pnpm dev)

## Support

Pour plus d'aide:
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Vercel](https://vercel.com/docs)
