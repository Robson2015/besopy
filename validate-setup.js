#!/usr/bin/env node

/**
 * Script de validation de la configuration
 * Vérifie que toutes les variables d'environnement sont correctement configurées
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Validation de la Configuration\n');

let hasErrors = false;

// Vérifier .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ Fichier .env.local non trouvé');
  console.log('   Créez le fichier: cp .env.example .env.local');
  hasErrors = true;
} else {
  console.log('✅ Fichier .env.local trouvé');
  
  // Lire et vérifier les variables
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL manquante');
    hasErrors = true;
  } else if (envContent.includes('https://your-project')) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL non configurée (valeur par défaut)');
    hasErrors = true;
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL configurée');
  }

  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquante');
    hasErrors = true;
  } else if (envContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
    console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY non configurée (valeur par défaut)');
    hasErrors = true;
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurée');
  }
}

// Vérifier les fichiers critiques
const criticalFiles = [
  'lib/supabase.ts',
  'lib/auth.ts',
  'lib/tournament.ts',
  'components/Login.tsx',
  'components/Poule.tsx',
  'components/Bracket.tsx',
  'components/MatchManager.tsx',
  'app/page.tsx',
  'app/login/page.tsx',
  'app/dashboard/page.tsx',
  'middleware.ts',
  'supabase-setup.sql',
];

console.log('\n📁 Vérification des fichiers:\n');
criticalFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MANQUANT`);
    hasErrors = true;
  }
});

// Vérifier package.json
console.log('\n📦 Vérification des dépendances:\n');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const requiredDeps = ['@supabase/supabase-js', '@supabase/ssr', 'next', 'react'];
  
  requiredDeps.forEach((dep) => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ ${dep} - MANQUANT`);
      hasErrors = true;
    }
  });
}

// Résumé
console.log('\n' + '='.repeat(50));
if (!hasErrors) {
  console.log('✅ Configuration OK! Vous êtes prêt à démarrer.');
  console.log('\n   Commande: pnpm dev\n');
  process.exit(0);
} else {
  console.log('❌ Des problèmes ont été détectés.');
  console.log('\n   1. Vérifiez votre .env.local');
  console.log('   2. Installez les dépendances: pnpm install');
  console.log('   3. Exécutez le script SQL de Supabase\n');
  process.exit(1);
}
