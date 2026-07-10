# Guide d'Installation - Gestionnaire de Tournoi

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Installation Supabase](#installation-supabase)
3. [Configuration Locale](#configuration-locale)
4. [Déploiement Vercel](#déploiement-vercel)
5. [Utilisation](#utilisation)

---

## Prérequis

- Node.js 18+ et npm/pnpm/yarn
- Un compte Supabase (gratuit sur supabase.com)
- Un compte Vercel (gratuit sur vercel.com)
- Git

---

## Installation Supabase

### Étape 1: Créer un Projet Supabase

1. Allez sur https://supabase.com et connectez-vous
2. Cliquez sur "New Project"
3. Remplissez les informations:
   - **Name**: `tournament-app` (ou votre nom préféré)
   - **Password**: Entrez un mot de passe fort
   - **Region**: Choisissez `Europe (Ireland)` pour la meilleure performance
4. Attendez la création (2-3 minutes)

### Étape 2: Créer les Tables

1. Une fois le projet créé, allez dans **SQL Editor** (menu gauche)
2. Cliquez sur **New Query**
3. **Copiez le contenu entier** du fichier `supabase-setup.sql` de ce projet
4. **Collez** dans l'éditeur SQL
5. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`
6. Attendez le message "Query executed successfully"

✅ Les tables sont maintenant créées!

### Étape 3: Copier les Clés d'API

1. Allez dans **Project Settings** → **API** (menu gauche)
2. Vous verrez:
   - **Project URL**: Commençant par `https://xxxxx.supabase.co`
   - **API keys**: Section avec "anon public"

3. **Copiez et notez**:
   - `Project URL` complète
   - La clé `anon public` (elle ressemble à une longue chaîne)

Ces clés sont importantes pour les étapes suivantes!

---

## Configuration Locale

### Étape 1: Cloner le Projet

```bash
# Clonez le dépôt (ou téléchargez le ZIP)
git clone <votre-url-repo>
cd tournament-app
```

### Étape 2: Installer les Dépendances

```bash
# Avec pnpm (recommandé)
pnpm install

# Ou avec npm
npm install

# Ou avec yarn
yarn install
```

### Étape 3: Configurer les Variables d'Environnement

1. À la racine du projet, créez un fichier `.env.local`:

```bash
# Unix/Mac
touch .env.local

# Windows (PowerShell)
New-Item -Path .env.local
```

2. Ouvrez `.env.local` et ajoutez vos clés Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Remplacez les valeurs par celles copiées depuis Supabase!**

### Étape 4: Lancer l'Application

```bash
pnpm dev
```

Vous devriez voir:
```
> tournament-app@0.1.0 dev
> next dev

▲ Next.js 16.2.6
- Local:        http://localhost:3000
```

Ouvrez **http://localhost:3000** dans votre navigateur!

### Étape 5: Tester Localement

1. **Créer un compte**: Cliquez sur "S'inscrire"
   - Email: `test@example.com`
   - Mot de passe: `MonMotDePasse123!`

2. **Ajouter des équipes**:
   - Vous êtes sur le Dashboard
   - Allez dans l'onglet "Poules"
   - Ajoutez les équipes pour chaque poule

3. **Créer des matchs** (optionnel):
   - Allez dans "8ème de Finale"
   - Créez des matchs entre équipes
   - Saisissez les scores

✅ L'application fonctionne localement!

---

## Déploiement Vercel

### Étape 1: Préparer GitHub

1. Créez un dépôt GitHub (https://github.com/new)
2. Initialisez Git localement:

```bash
cd tournament-app
git init
git add .
git commit -m "Initial commit - Tournament app"
git branch -M main
git remote add origin https://github.com/votre-username/tournament-app.git
git push -u origin main
```

### Étape 2: Déployer sur Vercel

1. Allez sur https://vercel.com
2. Cliquez sur "Add New" → "Project"
3. Sélectionnez votre dépôt GitHub
4. Cliquez sur **Deploy** (la configuration devrait être détectée automatiquement)

**Ajoutez les variables d'environnement**:
1. Avant de cliquer "Deploy", allez à "Environment Variables"
2. Ajoutez:
   - `NEXT_PUBLIC_SUPABASE_URL`: Votre URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Votre clé Anon

3. Cliquez sur **Deploy**

### Étape 3: Accéder à l'Application

Une fois déployée (2-3 minutes):
1. Vous verrez le lien de votre app: `https://tournament-app-xxxxx.vercel.app`
2. Cliquez pour accéder à votre application en ligne!

✅ Votre app est en ligne!

---

## Utilisation

### Première Visite

1. **Créer un compte** avec votre email
2. **Ajouter les équipes** dans chaque poule
3. **Créer les matchs** pour les phases éliminatoires
4. **Saisir les scores** au fur et à mesure des matchs

### Fonctionnalités

#### 📊 Poules
- Ajouter jusqu'à 23 équipes réparties en 4 poules
- Voir le classement en temps réel
- Les points s'affichent automatiquement

#### 🥊 Phases Éliminatoires
- Créer les matchs (8ème, quart, demi, finale)
- Saisir les scores
- Voir le statut (en attente/terminé)

#### 🔐 Compte
- Authentification sécurisée avec Supabase
- Vos données sont sauvegardées dans le cloud
- Déconnexion facile

---

## Dépannage

### ❌ "Erreur: Cannot connect to Supabase"

**Solution**: Vérifiez que les variables d'environnement sont correctes
```bash
# Vérifiez le fichier .env.local
cat .env.local
```

### ❌ "Les équipes ne s'ajoutent pas"

**Solution**: 
1. Vérifiez que vous êtes connecté
2. Allez dans Supabase → SQL Editor → Vérifiez que la table `teams` existe
3. Regardez la console (F12) pour les erreurs

### ❌ "Erreur 404 ou page blanche"

**Solution**:
1. Arrêtez le serveur (`Ctrl+C`)
2. Relancez: `pnpm dev`
3. Attendez que le build soit complet

### ❌ "Les variables d'environnement ne fonctionnent pas"

**Solution** (Vercel):
1. Allez dans Project Settings → Environment Variables
2. Vérifiez que les clés sont présentes
3. Redéployez: `git push` (Vercel redéploiera automatiquement)

---

## Fichiers Importants

```
tournament-app/
├── .env.local                 # Vos clés Supabase (À NE PAS partager!)
├── .env.example              # Modèle de configuration
├── supabase-setup.sql        # Script pour créer les tables
├── lib/
│   ├── supabase.ts          # Initialisation Supabase
│   ├── auth.ts              # Fonctions d'authentification
│   └── tournament.ts        # Logique du tournoi
├── components/
│   ├── Login.tsx            # Page de connexion
│   ├── Poule.tsx            # Gestion des poules
│   ├── Bracket.tsx          # Affichage des matchs
│   └── MatchManager.tsx     # Création des matchs
└── app/
    ├── page.tsx             # Redirection
    ├── login/               # Page de connexion
    └── dashboard/           # Tableau de bord principal
```

---

## Support

- **Problèmes Supabase**: https://supabase.com/docs
- **Problèmes Next.js**: https://nextjs.org/docs
- **Problèmes Vercel**: https://vercel.com/docs
- **GitHub Issues**: Créez une issue dans votre dépôt

---

## Prochaines Étapes

Après l'installation:
1. ✅ Testez localement (`pnpm dev`)
2. ✅ Vérifiez que l'ajout d'équipes fonctionne
3. ✅ Créez un dépôt GitHub
4. ✅ Déployez sur Vercel
5. ✅ Partagez l'URL avec vos amis!

**Bonne chance pour votre tournoi! 🏆**
