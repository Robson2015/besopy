# Démarrage Rapide - Gestionnaire de Tournoi ⚡

## 5 Minutes pour Commencer

### 1️⃣ Récupérer les Clés Supabase (2 min)

1. Allez sur **supabase.com/dashboard**
2. Créez un nouveau projet (name: `tournament`, region: Ireland)
3. Une fois créé, allez dans **Settings → API**
4. **Copiez**:
   - `Project URL` (ex: `https://xxxxx.supabase.co`)
   - `anon public` key

### 2️⃣ Exécuter le Script SQL (1 min)

1. Dans Supabase, allez dans **SQL Editor**
2. Cliquez **New Query**
3. Ouvrez le fichier `supabase-setup.sql` du projet
4. **Copiez tout** et **Collez** dans Supabase
5. Cliquez **Run**

✅ Les tables sont créées!

### 3️⃣ Configurer l'App Locale (1 min)

```bash
# Dans le dossier du projet
echo 'NEXT_PUBLIC_SUPABASE_URL=https://votre-url.supabase.co' > .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon' >> .env.local
```

**Remplacez** les valeurs!

### 4️⃣ Lancer l'App (1 min)

```bash
pnpm install
pnpm dev
```

Ouvrez **http://localhost:3000** ✅

## Utilisation Basique

| Action | Comment Faire |
|--------|--------------|
| **Créer un compte** | Cliquez "S'inscrire" + Email + Mot de passe |
| **Ajouter équipes** | Dashboard → "Poules" → Tapez nom → "Ajouter" |
| **Créer matchs** | Dashboard → "8ème de Finale" → Sélectionnez équipes → "Ajouter Match" |
| **Saisir scores** | Cliquez "Saisir" sur le match → Entrez scores → "OK" |

## Déploiement en 3 Clics

```bash
# 1. Git
git push

# 2. Allez sur vercel.com → Importez votre repo

# 3. Ajoutez les 2 variables d'environnement
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Voilà! Votre app est en ligne!** 🚀

## Structure du Tournoi

```
📊 Poules (23 équipes total)
├── Poule 1: 5 équipes
├── Poule 2: 6 équipes
├── Poule 3: 6 équipes
└── Poule 4: 6 équipes

🥊 8ème de Finale (16 équipes)
⚔️ Quart de Finale (8 équipes)
🏆 Demi-Finale (4 équipes)
👑 Finale (2 équipes)
```

## Besoin d'Aide?

- **Erreur Supabase**: Vérifiez que les tables existent (SQL Editor)
- **Erreur app locale**: Vérifiez `.env.local` - les clés sont correctes?
- **Erreur Vercel**: Vérifiez les variables d'environnement dans Project Settings

## Documentation Complète

- **Installation détaillée**: Voir `INSTALLATION.md`
- **Configuration Supabase**: Voir `SETUP.md`
- **Code & Architecture**: Voir `README.md`

---

**C'est tout! Bon tournoi! 🏆**
