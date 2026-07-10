# 🚀 Guide de Déploiement sur Vercel

## Prérequis

- ✅ Application testée localement (`pnpm dev` fonctionne)
- ✅ Supabase configuré avec les tables créées
- ✅ Dépôt GitHub avec votre code
- ✅ Compte Vercel (gratuit sur vercel.com)

## Étape 1: Préparer le Dépôt GitHub

### Si vous n'avez pas encore de dépôt:

```bash
cd tournament-app

# Initialiser Git
git init
git add .
git commit -m "Initial commit - Tournament app"

# Créer un dépôt sur GitHub
# https://github.com/new

# Ajouter le dépôt distant
git remote add origin https://github.com/votre-username/tournament-app.git
git branch -M main
git push -u origin main
```

### Si vous avez déjà un dépôt:

```bash
# Assurez-vous que vous êtes à jour
git add .
git commit -m "Tournament app ready for deployment"
git push origin main
```

## Étape 2: Connecter à Vercel

### Option A: Via Dashboard Vercel

1. Allez sur https://vercel.com
2. Connectez-vous (ou créez un compte)
3. Cliquez sur **"Add New"** → **"Project"**
4. Sélectionnez votre organisation GitHub (ou autorisez)
5. Cherchez **"tournament-app"** dans la liste
6. Cliquez sur **"Import"**

### Option B: Via CLI (Plus rapide)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel
```

## Étape 3: Configurer les Variables d'Environnement

### Via Dashboard Vercel:

1. Vous êtes dans l'écran **"Import Project"**
2. Allez à **"Environment Variables"**
3. Ajoutez les variables:

| Name | Value | Description |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Votre URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Votre clé Anon |

4. Cliquez sur **"Deploy"**

### Via `.env.production.local` (Alternative):

Créez le fichier à la racine:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Puis commit:
```bash
git add .env.production.local
git commit -m "Add production env vars"
git push
```

## Étape 4: Attendez le Déploiement

1. Vercel commencera à construire votre app (~2-3 minutes)
2. Vous verrez:
   - ✅ Building
   - ✅ Installing dependencies
   - ✅ Running build script
   - ✅ Uploading
   - ✅ **READY!**

3. Une fois fait, cliquez sur le lien de votre app!

## ✅ Vérification Après Déploiement

### Test de Base

1. **Accédez à votre URL** (ex: `tournament-app-abc123.vercel.app`)
2. **Testez le login**:
   - Créez un compte
   - Connectez-vous
   - Vous devez voir le Dashboard

3. **Testez l'ajout d'équipes**:
   - Allez dans "Poules"
   - Ajoutez une équipe
   - Elle devrait s'afficher

4. **Testez la création de matchs**:
   - Allez dans "8ème de Finale"
   - Créez un match
   - Saisissez un score

### Tests Avancés

- [ ] Créer un compte avec un autre email
- [ ] Vérifier que les équipes sont isolées par utilisateur
- [ ] Tester sur mobile (responsive)
- [ ] Tester la déconnexion
- [ ] Vérifier les performances

## 🔄 Mises à Jour Futures

Après votre premier déploiement, pour mettre à jour:

```bash
# Faire vos modifications locales
# ...

# Commit et push
git add .
git commit -m "Description de vos changements"
git push origin main

# Vercel redéploiera automatiquement!
```

C'est tout! Vous pouvez maintenant partager votre app avec le monde! 🎉

## 🐛 Dépannage

### ❌ Build Error: "Module not found"

**Cause**: Dépendances manquantes

**Solution**:
```bash
pnpm install
pnpm build
git add .
git commit -m "Fix dependencies"
git push
```

### ❌ Erreur Supabase: "Connection refused"

**Cause**: Variables d'environnement incorrectes

**Solution**:
1. Allez dans Project Settings → Environment Variables
2. Vérifiez les valeurs:
   - Pas de typos
   - URL complète (avec https://)
3. Redéployez: `vercel deploy`

### ❌ Erreur Auth: "Invalid API key"

**Cause**: Clé Anon incorrecte

**Solution**:
1. Allez dans Supabase → Settings → API
2. Copiez la clé `anon public` exactement
3. Mettez à jour dans Vercel Settings
4. Redéployez

### ❌ Page blanche / 404

**Cause**: Build échoué

**Solution**:
1. Regardez les **Build Logs** dans Vercel
2. Cherchez les erreurs (rouge)
3. Corrigez en local: `pnpm dev`
4. Testez complètement
5. Push et redéployez

### ❌ Les équipes ne s'ajoutent pas

**Cause**: RLS incorrecte

**Solution**:
1. Allez dans Supabase → SQL Editor
2. Exécutez: `SELECT * FROM teams;`
3. Si erreur, réexécutez `supabase-setup.sql`

## 📊 Monitoring

### Vérifier les Erreurs

Allez dans **Project → Functions** pour voir les logs.

### Vérifier les Performances

Allez dans **Project → Analytics** pour voir:
- Temps de réponse
- Erreurs 500
- Usage

## 🔐 Sécurité

### Après Déploiement

✅ Vérifiez:
- [ ] HTTPS activé (par défaut)
- [ ] Variables d'env pas exposées
- [ ] RLS activé sur Supabase
- [ ] Pas d'erreurs sensibles exposées

## 📚 Documentation Vercel

- Deployments: https://vercel.com/docs/deployments
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Troubleshooting: https://vercel.com/docs/platforms/endpoints-api-reference

---

**Félicitations! Votre app est en ligne! 🚀**

Pour partager: Envoyez l'URL `https://tournament-app-xxx.vercel.app` à vos amis!
